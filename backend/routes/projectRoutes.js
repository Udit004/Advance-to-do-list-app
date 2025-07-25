const express = require("express");
const router = express.Router();
const User = require("../models/userProfileModel");
const Project = require("../models/projectModel");
const rateLimitMiddleware = require("../middleware/rateLimitMiddleware");
const {
  createProject,
  getProjectsByUser,
  getProjectById,
  shareProject,
  requestProjectAccess,
  getAccessRequests,
  respondToAccessRequest,
  joinPublicProject,
  updateCollaboratorRole,
  removeCollaborator,
  getPendingInvitations,
  respondToInvitation,
  updateProject,
  deleteProject,
  createTodoInProject,
  updateTodoInProject,
  toggleTodoInProject,
  removeTodoFromProject
} = require("../controller/projectController");

const authenticateUser = require("../middleware/authMiddleware");

// Public routes (no authentication required)
router.get("/:projectId/public", async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .select("name description isPublic owner shareSettings")
      .populate("owner", "name email username displayName")
      .lean();

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: project._id,
        name: project.name,
        description: project.description,
        isPublic: project.isPublic,
        ownerName: project.owner.name || 
                  project.owner.username || 
                  project.owner.displayName || 
                  project.owner.email,
        shareSettings: {
          requireApproval: project.shareSettings?.requireApproval || false,
          defaultRole: project.shareSettings?.defaultRole || 'viewer'
        }
      },
    });
  } catch (error) {
    console.error("Error fetching public project:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project",
      error: error.message,
    });
  }
});

// Apply authentication to all other routes
router.use(authenticateUser);

// Project CRUD routes
router.post("/create", rateLimitMiddleware, createProject);
router.get("/user", getProjectsByUser);
router.get("/user/:uid", getProjectsByUser);
router.get("/invitations/pending", getPendingInvitations);

// Single project routes
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

// Project sharing and collaboration routes
router.post("/:projectId/share", rateLimitMiddleware, shareProject);
router.post("/:projectId/request-access", rateLimitMiddleware, requestProjectAccess);
router.post("/:projectId/join", joinPublicProject);
router.post("/:projectId/respond", respondToInvitation);

// Access request management (for project owners/admins)
router.get("/:projectId/access-requests", getAccessRequests);
router.post("/:projectId/access-requests/:requestId/respond", respondToAccessRequest);

// Collaborator management routes
router.get("/:projectId/collaborators", async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id || req.user.uid;

    const project = await Project.findById(projectId)
      .select("owner collaborators")
      .populate("owner", "name email username displayName")
      .lean();

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    // Check access
    const isOwner = project.owner._id.toString() === userId;
    const hasAccess = isOwner || project.collaborators.some(
      c => c.userId === userId && c.status === 'accepted'
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    // Add owner to collaborators list for display
    const ownerAsCollaborator = {
      userId: project.owner._id.toString(),
      email: project.owner.email,
      username: project.owner.name || project.owner.username || project.owner.displayName,
      role: 'owner',
      status: 'accepted',
      invitedAt: project.createdAt || new Date(),
      permissions: {
        canEdit: true,
        canDelete: true,
        canInvite: true,
        canManageRoles: true
      }
    };

    const allCollaborators = [ownerAsCollaborator, ...project.collaborators];

    res.status(200).json({
      success: true,
      data: {
        collaborators: allCollaborators,
        userRole: isOwner ? 'owner' : project.collaborators.find(c => c.userId === userId)?.role || null
      },
    });
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching collaborators",
      error: error.message,
    });
  }
});

router.patch("/:projectId/collaborators/:collaboratorId/role", updateCollaboratorRole);
router.delete("/:projectId/collaborators/:collaboratorId", removeCollaborator);

// Project settings update
router.patch("/:projectId/settings", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { shareSettings, isPublic } = req.body;
    const userId = req.user._id || req.user.uid;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!project.canUserManage(userId)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update project settings",
      });
    }

    // Update settings
    if (shareSettings) {
      project.shareSettings = { ...project.shareSettings, ...shareSettings };
    }
    
    if (typeof isPublic === 'boolean') {
      project.isPublic = isPublic;
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: {
        shareSettings: project.shareSettings,
        isPublic: project.isPublic
      }
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating settings",
      error: error.message,
    });
  }
});

// Todo management in projects
router.post("/:projectId/todos/create", rateLimitMiddleware, createTodoInProject);
router.put("/:projectId/todos/:todoId", updateTodoInProject);
router.patch("/:projectId/todos/:todoId/toggle", toggleTodoInProject);
router.delete("/:projectId/todos/:todoId", removeTodoFromProject);

// Bulk operations for collaborators
router.post("/:projectId/collaborators/bulk-invite", rateLimitMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { collaborators } = req.body; // Array of { email, role, message }
    const userId = req.user._id || req.user.uid;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!project.canUserManage(userId)) {
      const collaborator = project.collaborators.find(c => c.userId === userId);
      if (!collaborator?.permissions?.canInvite) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to invite others",
        });
      }
    }

    const results = [];
    const errors = [];

    for (const collab of collaborators) {
      try {
        const { email, role = 'viewer', message = '' } = collab;
        
        const targetUser = await User.findOne({ email });
        if (!targetUser) {
          errors.push({ email, error: "User not found" });
          continue;
        }

        await project.addCollaborator({
          userId: targetUser._id || targetUser.uid,
          email: targetUser.email,
          username: targetUser.username || targetUser.displayName,
          role,
          invitedBy: userId
        });

        results.push({
          email,
          username: targetUser.username || targetUser.displayName,
          role,
          status: 'invited'
        });

      } catch (error) {
        errors.push({ email: collab.email, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: "Bulk invitation completed",
      data: { successful: results, errors }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing bulk invitations",
      error: error.message,
    });
  }
});

// Get project activity/history
router.get("/:projectId/activity", async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id || req.user.uid;
    const { limit = 50, offset = 0 } = req.query;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!project.hasAccess(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // TODO: Implement activity tracking system
    // This would require an Activity model to track:
    // - User actions (created, updated, deleted todos)
    // - Collaboration events (invited, joined, left)
    // - Project changes (settings updated, shared)
    
    res.status(200).json({
      success: true,
      data: {
        activities: [], // Placeholder for activity feed
        hasMore: false,
        total: 0
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching activity",
      error: error.message,
    });
  }
});

// Get project statistics
router.get("/:projectId/stats", async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id || req.user.uid;

    const project = await Project.findById(projectId)
      .populate("todos", "isCompleted priority dueDate")
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check access
    const isOwner = project.owner.toString() === userId;
    const hasAccess = isOwner || project.collaborators.some(
      c => c.userId === userId && c.status === 'accepted'
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const todos = project.todos || [];
    const stats = {
      totalTodos: todos.length,
      completedTodos: todos.filter(t => t.isCompleted).length,
      pendingTodos: todos.filter(t => !t.isCompleted).length,
      overdueTodos: todos.filter(t => 
        !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date()
      ).length,
      collaborators: {
        total: project.collaborators.filter(c => c.status === 'accepted').length + 1, // +1 for owner
        pending: project.collaborators.filter(c => c.status === 'pending').length,
        active: project.collaborators.filter(c => c.status === 'accepted').length
      },
      lastActivity: project.lastActivity || project.updatedAt,
      createdAt: project.createdAt
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
});

// Leave project (for collaborators)
router.post("/:projectId/leave", async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id || req.user.uid;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Owners cannot leave their own projects
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Project owners cannot leave their own projects. Delete the project instead.",
      });
    }

    const collaborator = project.collaborators.find(c => c.userId === userId);
    if (!collaborator) {
      return res.status(400).json({
        success: false,
        message: "You are not a collaborator on this project",
      });
    }

    await project.removeCollaborator(userId);

    res.status(200).json({
      success: true,
      message: "You have left the project successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error leaving project",
      error: error.message,
    });
  }
});

// Transfer project ownership
router.post("/:projectId/transfer-ownership", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { newOwnerId } = req.body;
    const userId = req.user._id || req.user.uid;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Only current owner can transfer ownership
    if (project.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can transfer ownership",
      });
    }

    // Check if new owner is a collaborator
    const newOwnerCollaborator = project.collaborators.find(
      c => c.userId === newOwnerId && c.status === 'accepted'
    );

    if (!newOwnerCollaborator) {
      return res.status(400).json({
        success: false,
        message: "New owner must be an accepted collaborator",
      });
    }

    // Transfer ownership
    const oldOwnerId = project.owner;
    project.owner = newOwnerId;

    // Remove new owner from collaborators list
    project.collaborators = project.collaborators.filter(c => c.userId !== newOwnerId);

    // Add old owner as admin collaborator
    const oldOwnerUser = await User.findById(oldOwnerId);
    if (oldOwnerUser) {
      project.collaborators.push({
        userId: oldOwnerId,
        email: oldOwnerUser.email,
        username: oldOwnerUser.username || oldOwnerUser.displayName,
        role: 'admin',
        status: 'accepted',
        invitedBy: newOwnerId,
        invitedAt: new Date(),
        respondedAt: new Date(),
        permissions: project.getPermissionsByRole('admin')
      });
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: "Project ownership transferred successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error transferring ownership",
      error: error.message,
    });
  }
});

// Resend invitation
router.post("/:projectId/collaborators/:collaboratorId/resend", async (req, res) => {
  try {
    const { projectId, collaboratorId } = req.params;
    const userId = req.user._id || req.user.uid;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!project.canUserManage(userId)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to resend invitations",
      });
    }

    const collaborator = project.collaborators.find(c => c.userId === collaboratorId);
    if (!collaborator || collaborator.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "No pending invitation found for this user",
      });
    }

    // TODO: Resend email invitation
    // await sendInvitationEmail(collaborator.email, project);

    res.status(200).json({
      success: true,
      message: "Invitation resent successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error resending invitation",
      error: error.message,
    });
  }
});

module.exports = router;