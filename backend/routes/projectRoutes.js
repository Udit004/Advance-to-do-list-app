const express = require('express');
const router = express.Router();
const Project = require('../models/projectModel'); // Add missing import
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
  deleteProject,
  createTodoInProject, 
  updateTodoInProject, 
  toggleTodoInProject
} = require('../controller/projectController');

const authenticateUser = require('../middleware/authMiddleware');

// Apply authentication to all routes except public ones
router.use((req, res, next) => {
  // Skip auth for public routes
  if (req.path.includes('/public')) {
    return next();
  }
  return authenticateUser(req, res, next);
});

router.post("/:projectId/todos/create", authenticateUser, createTodoInProject);
router.put("/:projectId/todos/:todoId", authenticateUser, updateTodoInProject);
router.patch("/:projectId/todos/:todoId/toggle", authenticateUser, toggleTodoInProject);



// Project CRUD routes
router.post('/create', createProject);
router.get('/user', getProjectsByUser);
router.get('/user/:uid', getProjectsByUser);
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

// Optimized collaborator routes
router.get('/:projectId/collaborators', async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id || req.user.uid;
    
    // Use lean() for better performance
    const project = await Project.findById(projectId)
      .select('owner collaborators')
      .lean();
      
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Check access efficiently
    const isOwner = project.owner.toString() === userId;
    const hasAccess = isOwner || project.collaborators.some(c => c.userId === userId && c.status === 'accepted');
    
    if (!hasAccess) {
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
    console.error('Error fetching collaborators:', error);
    res.status(500).json({ success: false, message: 'Error fetching collaborators', error: error.message });
  }
});

// Optimized role update
router.patch('/:projectId/collaborators/:collaboratorId/role', async (req, res) => {
  try {
    const { projectId, collaboratorId } = req.params;
    const { role } = req.body;
    const userId = req.user._id || req.user.uid;
    
    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    // Use findOneAndUpdate for better performance
    const project = await Project.findOneAndUpdate(
      { 
        _id: projectId, 
        owner: userId,
        'collaborators.userId': collaboratorId 
      },
      { 
        $set: { 'collaborators.$.role': role } 
      },
      { new: true }
    );
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }
    
    res.status(200).json({ success: true, message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ success: false, message: 'Error updating role', error: error.message });
  }
});

// Optimized collaborator removal
router.delete('/:projectId/collaborators/:collaboratorId', async (req, res) => {
  try {
    const { projectId, collaboratorId } = req.params;
    const userId = req.user._id || req.user.uid;
    
    // Use findOneAndUpdate with $pull for better performance
    const project = await Project.findOneAndUpdate(
      { 
        _id: projectId, 
        owner: userId 
      },
      { 
        $pull: { collaborators: { userId: collaboratorId } } 
      },
      { new: true }
    );
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }
    
    res.status(200).json({ success: true, message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ success: false, message: 'Error removing collaborator', error: error.message });
  }
});

// Public project info (no auth required)
router.get('/:projectId/public', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId)
      .select('name description isPublic owner')
      .populate('owner', 'name email username')
      .lean();
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
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
    console.error('Error fetching public project:', error);
    res.status(500).json({ success: false, message: 'Error fetching project', error: error.message });
  }
});

// Apply auth middleware to remaining routes
router.use(authenticateUser);

router.post('/:projectId/request-access', async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id || req.user.uid;
    
    const project = await Project.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Check if user already has access
    const hasAccess = project.owner.toString() === userId || 
                     project.collaborators.some(c => c.userId === userId);
    
    if (hasAccess) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have access or a pending request' 
      });
    }
    
    // Add collaborator using atomic operation
    await Project.findByIdAndUpdate(projectId, {
      $addToSet: {
        collaborators: {
          userId: userId,
          email: req.user.email,
          username: req.user.username || req.user.displayName,
          role: 'viewer',
          status: 'pending'
        }
      }
    });
    
    res.status(200).json({ success: true, message: 'Access request sent successfully' });
  } catch (error) {
    console.error('Error requesting access:', error);
    res.status(500).json({ success: false, message: 'Error requesting access', error: error.message });
  }
});

router.post('/:projectId/join', async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id || req.user.uid;
    
    const project = await Project.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (!project.isPublic) {
      return res.status(403).json({ success: false, message: 'Project is private' });
    }
    
    // Check if user already has access
    const hasAccess = project.owner.toString() === userId || 
                     project.collaborators.some(c => c.userId === userId);
    
    if (hasAccess) {
      return res.status(400).json({ success: false, message: 'You already have access' });
    }
    
    // Add collaborator using atomic operation
    await Project.findByIdAndUpdate(projectId, {
      $addToSet: {
        collaborators: {
          userId: userId,
          email: req.user.email,
          username: req.user.username || req.user.displayName,
          role: 'viewer',
          status: 'accepted'
        }
      }
    });
    
    res.status(200).json({ success: true, message: 'Successfully joined project' });
  } catch (error) {
    console.error('Error joining project:', error);
    res.status(500).json({ success: false, message: 'Error joining project', error: error.message });
  }
});

module.exports = router;