const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjectsByUser,
  getProjectById,
  addTodoToProject,
  removeTodoFromProject,
  shareProject,
  respondToInvitation,
  getPendingInvitations,
  updateProject,
  deleteProject
} = require('../controller/projectController');

// Middleware to authenticate user (assuming you have this)
const authenticateUser = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authenticateUser);

// Project CRUD routes
router.post('/create', createProject);

// Fix: Use separate routes instead of optional parameter
router.get('/user', getProjectsByUser); // Get projects for current user
router.get('/user/:uid', getProjectsByUser); // Get projects for specific user

router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Todo management within projects
router.post('/:projectId/todos', addTodoToProject);
router.delete('/:projectId/todos/:todoId', removeTodoFromProject);

// Collaboration routes
router.post('/:projectId/share', shareProject);
router.post('/:projectId/respond', respondToInvitation);
router.get('/invitations/pending', getPendingInvitations);

// Additional useful routes
router.get('/:projectId/collaborators', async (req, res) => {
  try {
    const { projectId } = req.params;
    // Use both _id and uid for compatibility
    const userId = req.user._id || req.user.uid;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (!project.hasAccess(userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        owner: project.owner,
        collaborators: project.collaborators
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching collaborators', error: error.message });
  }
});

router.patch('/:projectId/collaborators/:collaboratorId/role', async (req, res) => {
  try {
    const { projectId, collaboratorId } = req.params;
    const { role } = req.body;
    // Use both _id and uid for compatibility
    const userId = req.user._id || req.user.uid;
    
    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (project.owner !== userId) {
      return res.status(403).json({ success: false, message: 'Only owner can change roles' });
    }
    
    const collaborator = project.collaborators.find(collab => collab.userId === collaboratorId);
    if (!collaborator) {
      return res.status(404).json({ success: false, message: 'Collaborator not found' });
    }
    
    collaborator.role = role;
    await project.save();
    
    res.status(200).json({ success: true, message: 'Role updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating role', error: error.message });
  }
});

// Add this route to your projectRoutes.js file

// Remove collaborator route (add this to your existing routes)
router.delete('/:projectId/collaborators/:collaboratorId', async (req, res) => {
  try {
    const { projectId, collaboratorId } = req.params;
    const userId = req.user._id || req.user.uid;
    
    const Project = require('../models/projectModel'); // Import if not already imported
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Only owner can remove collaborators
    if (project.owner !== userId) {
      return res.status(403).json({ success: false, message: 'Only owner can remove collaborators' });
    }
    
    // Remove collaborator from the array
    project.collaborators = project.collaborators.filter(collab => collab.userId !== collaboratorId);
    await project.save();
    
    res.status(200).json({ success: true, message: 'Collaborator removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing collaborator', error: error.message });
  }
});






// Get public project info (no auth required for public projects)
router.get('/:projectId/public', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId)
      .select('name description isPublic owner')
      .populate('owner', 'name email username');
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Only return basic info, even for public projects
    res.status(200).json({
      success: true,
      data: {
        _id: project._id,
        name: project.name,
        description: project.description,
        isPublic: project.isPublic,
        ownerName: project.owner.name || project.owner.username || project.owner.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching project', error: error.message });
  }
});

// Request access to private project
router.post('/:projectId/request-access', authenticateUser, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id || req.user.uid;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Check if user already has access or pending request
    const existingCollaborator = project.collaborators.find(collab => collab.userId === userId);
    if (existingCollaborator) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have access or a pending request' 
      });
    }
    
    // Add as pending collaborator
    await project.addCollaborator({
      userId: userId,
      email: req.user.email,
      username: req.user.username || req.user.displayName,
      role: 'viewer',
      status: 'pending'
    });
    
    res.status(200).json({ success: true, message: 'Access request sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error requesting access', error: error.message });
  }
});

// Auto-accept for public projects or direct link sharing
router.post('/:projectId/join', authenticateUser, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id || req.user.uid;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Only allow joining public projects
    if (!project.isPublic) {
      return res.status(403).json({ success: false, message: 'Project is private' });
    }
    
    // Check if user already has access
    if (project.hasAccess(userId)) {
      return res.status(400).json({ success: false, message: 'You already have access' });
    }
    
    // Add as viewer to public project
    await project.addCollaborator({
      userId: userId,
      email: req.user.email,
      username: req.user.username || req.user.displayName,
      role: 'viewer',
      status: 'accepted'
    });
    
    res.status(200).json({ success: true, message: 'Successfully joined project' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error joining project', error: error.message });
  }
});



module.exports = router;