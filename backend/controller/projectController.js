const Project = require("../models/projectModel");
const Todo = require("../models/todo");
const User = require("../models/userProfileModel");
const mongoose = require("mongoose");

const {
  emitTodoCreated,
  emitTodoUpdated,
  emitTodoDeleted,
  emitTodoToggled,
} = require("../socket");

// Create a new project
const createProject = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      isPublic, 
      color, 
      tags, 
      shareSettings 
    } = req.body;
    const userId = req.user._id || req.user.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed. Owner ID is missing.",
      });
    }

    if (!name || name.trim() === '') { // FIX: Better validation
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    const defaultShareSettings = {
      allowPublicLink: true,
      requireApproval: false,
      defaultRole: 'viewer',
      ...shareSettings
    };

    const newProject = new Project({
      name: name.trim(), // FIX: Trim whitespace
      description: description ? description.trim() : '',
      owner: userId,
      isPublic: Boolean(isPublic), // FIX: Ensure boolean
      color: color || "blue",
      tags: Array.isArray(tags) ? tags : [], // FIX: Ensure array
      shareSettings: defaultShareSettings,
      lastActivity: new Date() // FIX: Add initial activity timestamp
    });

    const savedProject = await newProject.save();

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: savedProject,
    });
  } catch (error) {
    console.error('Error creating project:', error); // FIX: Add logging
    
    // FIX: Handle validation errors specifically
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error creating project",
      error: error.message,
    });
  }
};

// Enhanced share project with multiple options
const shareProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { 
      email, 
      emails, 
      role = "viewer",
      message = "",
      sendEmail = true 
    } = req.body;
    const userId = req.user._id || req.user.uid;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // FIX: Better permission checking with fallback
    let canInvite = false;
    try {
      const userRole = project.getUserRole ? project.getUserRole(userId) : null;
      if (['owner', 'admin'].includes(userRole)) {
        canInvite = true;
      } else {
        const collaborator = project.collaborators.find(c => c.userId === userId);
        canInvite = collaborator?.permissions?.canInvite || false;
      }
    } catch (error) {
      // Fallback: only owner can invite
      canInvite = project.owner.toString() === userId.toString();
    }

    if (!canInvite) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to invite others",
      });
    }

    const emailList = emails && Array.isArray(emails) ? emails : [email].filter(Boolean); // FIX: Better email handling
    
    if (emailList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one email is required",
      });
    }

    const results = [];
    const errors = [];

    for (const emailAddr of emailList) {
      try {
        if (!emailAddr || !emailAddr.trim()) continue;

        const targetUser = await User.findOne({ email: emailAddr.trim().toLowerCase() });
        if (!targetUser) {
          errors.push({
            email: emailAddr,
            error: "User not found with this email"
          });
          continue;
        }

        const targetUserId = targetUser._id || targetUser.uid;

        // Check if user is already a collaborator
        const existingCollaborator = project.collaborators.find(
          c => c.userId === targetUserId.toString()
        );

        if (existingCollaborator) {
          if (existingCollaborator.status === 'pending') {
            errors.push({
              email: emailAddr,
              error: "Invitation already sent"
            });
          } else {
            errors.push({
              email: emailAddr,
              error: "User is already a collaborator"
            });
          }
          continue;
        }

        // FIX: Use proper method if available, otherwise manual addition
        if (project.addCollaborator) {
          await project.addCollaborator({
            userId: targetUserId,
            email: targetUser.email,
            username: targetUser.username || targetUser.displayName,
            role,
            invitedBy: userId
          });
        } else {
          // Fallback manual addition
          project.collaborators.push({
            userId: targetUserId,
            email: targetUser.email,
            username: targetUser.username || targetUser.displayName || targetUser.email,
            role,
            status: 'pending',
            invitedBy: userId,
            invitedAt: new Date(),
            permissions: project.getPermissionsByRole ? project.getPermissionsByRole(role) : {}
          });
          await project.save();
        }

        results.push({
          email: emailAddr,
          username: targetUser.username || targetUser.displayName,
          role,
          status: 'invited'
        });

      } catch (error) {
        console.error('Error inviting user:', error);
        errors.push({
          email: emailAddr,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Invitations processed",
      data: {
        successful: results,
        errors: errors
      }
    });

  } catch (error) {
    console.error('Error sharing project:', error);
    res.status(500).json({
      success: false,
      message: "Error sharing project",
      error: error.message,
    });
  }
};

// Request access to private project
const requestProjectAccess = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { message = "" } = req.body;
    const userId = req.user._id || req.user.uid;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.isPublic) {
      return res.status(400).json({
        success: false,
        message: "This is a public project, you can join directly",
      });
    }

    await project.requestAccess({
      userId,
      email: req.user.email,
      username: req.user.username || req.user.displayName,
      message,
    });

    // TODO: Notify project owner about the access request
    // await sendAccessRequestNotification(project.owner, req.user, project);

    res.status(200).json({
      success: true,
      message: "Access request sent successfully",
    });
  } catch (error) {
    if (
      error.message === "User already has access" ||
      error.message === "Access request already pending"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error requesting access",
      error: error.message,
    });
  }
};

// Get access requests for project owners
const getAccessRequests = async (req, res) => {
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

    if (!project.canUserManage(userId)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view access requests",
      });
    }

    const pendingRequests = project.accessRequests.filter(
      (r) => r.status === "pending"
    );

    res.status(200).json({
      success: true,
      data: pendingRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching access requests",
      error: error.message,
    });
  }
};

// Respond to access request
const respondToAccessRequest = async (req, res) => {
  try {
    const { projectId, requestId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const userId = req.user._id || req.user.uid;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be "approve" or "reject"',
      });
    }

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
        message: "You don't have permission to respond to access requests",
      });
    }

    await project.respondToAccessRequest(requestId, action, userId);

    // TODO: Send notification to requester
    // await sendAccessRequestResponseNotification(requester, project, action);

    res.status(200).json({
      success: true,
      message: `Access request ${action}d successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error responding to access request",
      error: error.message,
    });
  }
};

// Join public project
const joinPublicProject = async (req, res) => {
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

    if (!project.isPublic) {
      return res.status(403).json({
        success: false,
        message: "Project is private. Please request access instead.",
      });
    }

    if (project.hasAccess(userId)) {
      return res.status(400).json({
        success: false,
        message: "You already have access to this project",
      });
    }

    await project.addCollaborator({
      userId,
      email: req.user.email,
      username: req.user.username || req.user.displayName,
      role: project.shareSettings.defaultRole,
      invitedBy: project.owner,
    });

    // Auto-accept for public projects
    await project.respondToInvitation(userId, "accept");

    res.status(200).json({
      success: true,
      message: "Successfully joined the project",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error joining project",
      error: error.message,
    });
  }
};

// Update collaborator role
const updateCollaboratorRole = async (req, res) => {
  try {
    const { projectId, collaboratorId } = req.params;
    const { role } = req.body;
    const userId = req.user._id || req.user.uid;

    if (!["viewer", "editor", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

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
        message: "You don't have permission to manage roles",
      });
    }

    await project.updateCollaboratorRole(collaboratorId, role);

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating role",
      error: error.message,
    });
  }
};

// Remove collaborator
const removeCollaborator = async (req, res) => {
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
        message: "You don't have permission to remove collaborators",
      });
    }

    await project.removeCollaborator(collaboratorId);

    res.status(200).json({
      success: true,
      message: "Collaborator removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing collaborator",
      error: error.message,
    });
  }
};

// Get project with collaboration info
const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user._id || req.user.uid;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    const project = await Project.findById(projectId).populate(
      "todos",
      "task description isCompleted priority dueDate createdAt updatedAt project user"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!project.hasAccess(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this project",
      });
    }

    const projectData = project.toObject();
    projectData.userRole = project.getUserRole(userId);
    projectData.userPermissions = {
      canEdit: project.canUserEdit(userId),
      canManage: project.canUserManage(userId),
    };

    // Only include access requests for managers
    if (!project.canUserManage(userId)) {
      delete projectData.accessRequests;
    }

    // Update last activity
    await project.updateActivity();

    res.status(200).json({
      success: true,
      data: projectData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching project",
      error: error.message,
    });
  }
};

// Get projects by user with enhanced filtering
// Get projects by user with enhanced filtering - FIXED VERSION
const getProjectsByUser = async (req, res) => {
  try {
    const userId = req.params.uid || req.user._id || req.user.uid;
    const { 
      includePublic = false, 
      status = "all",
      role = "all" // 'owned', 'collaborated', 'all'
    } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    let conditions = {};

    if (role === 'owned') {
      // FIX: Use string comparison for Firebase UIDs, not ObjectId
      conditions = { owner: userId };
    } else if (role === 'collaborated') {
      conditions = {
        "collaborators.userId": userId,
        "collaborators.status": status === "all" ? { $in: ["pending", "accepted"] } : status,
        owner: { $ne: userId } // This is fine since we're using $ne with string
      };
    } else {
      conditions = {
        $or: [
          { owner: userId }, // FIX: Direct string comparison
          {
            "collaborators.userId": userId,
            "collaborators.status": status === "all" ? { $in: ["pending", "accepted"] } : status,
          },
        ]
      };
    }

    // FIX: Only add public condition if not getting owned projects
    if (includePublic === 'true' && role !== 'owned') {
      if (!conditions.$or) {
        conditions.$or = [];
      }
      conditions.$or.push({ isPublic: true });
    }

    const projects = await Project.find(conditions)
      .populate("todos", "task isCompleted priority dueDate")
      .populate("owner", "name email username displayName") // This populate might not work with Firebase UIDs
      .sort({ lastActivity: -1, updatedAt: -1 });

    const projectsWithRole = projects.map((project) => {
      const projectObj = project.toObject();
      
      // FIX: Safely get user role with string comparison
      try {
        projectObj.userRole = project.getUserRole ? project.getUserRole(userId) : 'viewer';
        projectObj.userPermissions = {
          canEdit: project.canUserEdit ? project.canUserEdit(userId) : false,
          canManage: project.canUserManage ? project.canUserManage(userId) : false
        };
      } catch (error) {
        console.warn('Error getting user role:', error);
        // Fallback logic with string comparison
        if (project.owner === userId) { // FIX: String comparison instead of toString()
          projectObj.userRole = 'owner';
          projectObj.userPermissions = { canEdit: true, canManage: true };
        } else {
          const collaborator = project.collaborators.find(c => c.userId === userId);
          projectObj.userRole = collaborator ? collaborator.role : 'viewer';
          projectObj.userPermissions = { 
            canEdit: collaborator ? ['editor', 'admin'].includes(collaborator.role) : false,
            canManage: collaborator ? collaborator.role === 'admin' : false
          };
        }
      }
      
      // Don't include access requests in list view
      delete projectObj.accessRequests;
      
      return projectObj;
    });

    res.status(200).json({
      success: true,
      data: projectsWithRole,
    });
  } catch (error) {
    console.error('Error in getProjectsByUser:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching projects",
      error: error.message,
    });
  }
};

// Get pending invitations for current user
const getPendingInvitations = async (req, res) => {
  try {
    const userId = req.user._id || req.user.uid;

    const projects = await Project.find({
      "collaborators.userId": userId,
      "collaborators.status": "pending",
    })
      .select("name description owner createdAt")
      .populate("owner", "name email username");

    const invitationsWithOwnerInfo = projects.map((project) => {
      const projectObj = project.toObject();
      const invitation = project.collaborators.find((c) => c.userId === userId);

      return {
        ...projectObj,
        inviterName:
          project.owner.name || project.owner.username || project.owner.email,
        role: invitation.role,
        invitedAt: invitation.invitedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: invitationsWithOwnerInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pending invitations",
      error: error.message,
    });
  }
};

// Respond to invitation
const respondToInvitation = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { action } = req.body;
    const userId = req.user._id || req.user.uid;

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be "accept" or "decline"',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await project.respondToInvitation(userId, action);

    res.status(200).json({
      success: true,
      message: `Invitation ${action}ed successfully`,
    });
  } catch (error) {
    if (error.message === "Invitation not found") {
      return res.status(404).json({
        success: false,
        message: "Invitation not found or already responded",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error responding to invitation",
      error: error.message,
    });
  }
};

const deleteProject = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const projectId = req.params.id;
    const userId = req.user._id || req.user.uid; // FIX: Handle both formats

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    await session.withTransaction(async () => {
      const project = await Project.findById(projectId).session(session);
      if (!project) {
        throw new Error("Project not found");
      }

      // FIX: Proper string comparison for MongoDB ObjectIds
      if (project.owner.toString() !== userId.toString()) {
        throw new Error("Only project owner can delete projects");
      }

      // Remove project reference from all associated todos
      await Todo.updateMany(
        { project: projectId },
        { $unset: { project: 1 } },
        { session }
      );

      // Delete the project
      await Project.findByIdAndDelete(projectId).session(session);
    });

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting project ${projectId}:`, error); // FIX: Add logging
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting project",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

// 2. Fix the updateProject function - userId handling
const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, description, isPublic, color, tags } = req.body;
    const userId = req.user._id || req.user.uid; // FIX: Handle both _id and uid

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const userRole = project.getUserRole(userId);
    if (!userRole || userRole === "viewer") {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to update project",
      });
    }

    // FIX: Update lastActivity when project is updated
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        name,
        description,
        isPublic,
        color,
        tags,
        lastActivity: new Date(), // Add this
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating project",
      error: error.message,
    });
  }
};

// // FIXED: Add existing todo to project with proper bidirectional relationship

const createTodoInProject = async (req, res) => {
  const { projectId } = req.params;
  const { task, description, priority, dueDate, list, clientId } = req.body;
  const userId = req.user._id;

  const maxRetries = 3;
  let attempt = 0;

  console.log("🚀 Creating todo in project:", {
    projectId,
    userId,
    task,
    clientId,
  });

  // Validate required fields
  if (!task || !task.trim()) {
    return res.status(400).json({
      success: false,
      message: "Task is required",
      error: "MISSING_TASK",
    });
  }

  try {
    // First, verify project exists and user has permissions (outside transaction)
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
        error: "PROJECT_NOT_FOUND",
      });
    }

    const userRole = project.getUserRole(userId);
    if (!userRole || userRole === "viewer") {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to create todos in this project",
        error: "INSUFFICIENT_PERMISSIONS",
      });
    }

    // ✅ IMPROVED: Better duplicate checking for multi-user scenarios
    // Only check for duplicates from the SAME USER, not all users in the project
    const existingTodo = await Todo.findOne({
      task: task.trim(),
      project: projectId,
      user: userId, // Same user
      isCompleted: false,
    });

    if (existingTodo) {
      return res.status(409).json({
        success: false,
        message: "You already have a similar active task in this project",
        error: "DUPLICATE_TODO",
      });
    }

    // ✅ RETRY LOGIC: Handle write conflicts for concurrent requests
    while (attempt < maxRetries) {
      let session = null;

      try {
        attempt++;
        console.log(`🔄 Create attempt ${attempt}/${maxRetries}`);

        session = await mongoose.startSession();

        const result = await session.withTransaction(
          async () => {
            // Create todo with explicit project association and clientId
            const newTodo = new Todo({
              task: task.trim(),
              description: description || "",
              priority: priority || "medium",
              dueDate: dueDate || null,
              list: list || "General",
              user: userId,
              project: projectId,
              clientId: clientId || null, // Store clientId for duplicate prevention
              isCompleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            // Save the todo
            const savedTodo = await newTodo.save({ session });

            // Add todo to project's todos array
            await Project.findByIdAndUpdate(
              projectId,
              {
                $addToSet: { todos: savedTodo._id },
                updatedAt: new Date(),
              },
              { session, new: true }
            );

            return savedTodo;
          },
          {
            // Transaction options with better retry settings
            readPreference: "primary",
            readConcern: { level: "local" },
            writeConcern: { w: "majority", j: true },
            maxCommitTimeMS: 10000,
          }
        );

        console.log(
          "✅ Todo created successfully with transaction:",
          result._id
        );

        // Populate the todo with user info for response and socket emission
        const populatedTodo = await Todo.findById(result._id).populate(
          "user",
          "displayName email"
        );

        // Update project stats asynchronously (don't wait for it)
        project
          .updateStats()
          .catch((err) =>
            console.error("Failed to update project stats:", err)
          );

        // ✅ IMPROVED: Socket emission with user info
        const socketData = {
          ...populatedTodo.toObject(),
          createdBy:
            populatedTodo.user?.displayName ||
            populatedTodo.user?.email ||
            "Anonymous",
        };

        // Emit to all users in the project room (including the creator for other tabs)
        console.log("📡 Emitting todoCreated to project room");
        emitTodoCreated(projectId, socketData);

        // Return success response
        return res.status(201).json({
          success: true,
          message: "Todo created successfully in project",
          data: populatedTodo,
        });
      } catch (transactionError) {
        console.warn(
          `⚠️ Transaction attempt ${attempt} failed:`,
          transactionError.message
        );

        // Check if it's a retryable error
        const isRetryableError =
          transactionError.code === 112 || // WriteConflict
          transactionError.code === 11000 || // DuplicateKey
          transactionError.errorLabels?.includes("TransientTransactionError") ||
          transactionError.message?.includes("Write conflict");

        if (isRetryableError && attempt < maxRetries) {
          console.log(`⏳ Retrying create operation in ${attempt * 1000}ms...`);
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          continue;
        }

        // If not retryable or exhausted retries, fall back to non-transaction approach
        if (attempt === maxRetries) {
          console.warn(
            "⚠️ All transaction attempts failed, falling back to non-transaction approach"
          );

          // Fallback: Create without transaction
          const newTodo = new Todo({
            task: task.trim(),
            description: description || "",
            priority: priority || "medium",
            dueDate: dueDate || null,
            list: list || "General",
            user: userId,
            project: projectId,
            clientId: clientId || null,
            isCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Save the todo (without transaction)
          const savedTodo = await newTodo.save();

          // Add todo to project's todos array (without transaction)
          await Project.findByIdAndUpdate(
            projectId,
            {
              $addToSet: { todos: savedTodo._id },
              updatedAt: new Date(),
            },
            { new: true }
          );

          console.log(
            "✅ Todo created successfully without transaction:",
            savedTodo._id
          );

          // Populate the todo with user info
          const populatedTodo = await Todo.findById(savedTodo._id).populate(
            "user",
            "displayName email"
          );

          // Update project stats asynchronously
          project
            .updateStats()
            .catch((err) =>
              console.error("Failed to update project stats:", err)
            );

          // Emit socket event
          const socketData = {
            ...populatedTodo.toObject(),
            createdBy:
              populatedTodo.user?.displayName ||
              populatedTodo.user?.email ||
              "Anonymous",
          };

          emitTodoCreated(projectId, socketData);

          return res.status(201).json({
            success: true,
            message: "Todo created successfully in project",
            data: populatedTodo,
          });
        }
      } finally {
        // Always end session if it exists
        if (session) {
          try {
            await session.endSession();
          } catch (sessionError) {
            console.error("Error ending session:", sessionError);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error creating todo in project:", error);

    // Handle specific error types
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
        details: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {}),
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate task detected",
        error: "DUPLICATE_TODO",
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "Internal server error while creating todo",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// ✅ IMPROVED: Remove todo with proper cleanup
// ✅ FIXED: Remove todo with proper cleanup - ACTUALLY DELETE THE TODO
// ✅ OPTIMIZED: Simplified and faster delete operation
// ✅ OPTIMIZED: Simplified and faster delete operation
const removeTodoFromProject = async (req, res) => {
  const { projectId, todoId } = req.params;
  const userId = req.user._id;

  try {
    console.log(`🗑️ Deleting todo: ${todoId} from project: ${projectId}`);

    // First verify permissions and todo existence (single query)
    // Don't use .lean() for project since we need the getUserRole method
    const [project, todo] = await Promise.all([
      Project.findById(projectId), // Need full document for getUserRole method
      Todo.findOne({ _id: todoId, project: projectId }).lean(),
    ]);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found in this project",
      });
    }

    // ✅ FIXED: Use the same getUserRole method as in your original code
    const userRole = project.getUserRole(userId);

    if (!userRole || userRole === "viewer") {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    // ✅ OPTIMIZED: Use Promise.all for parallel operations instead of transaction
    // This is much faster for simple operations like delete
    const [deletedTodo] = await Promise.all([
      Todo.findByIdAndDelete(todoId),
      Project.findByIdAndUpdate(
        projectId,
        {
          $pull: { todos: todoId },
          updatedAt: new Date(),
        },
        { new: false } // Don't return the document to save bandwidth
      ),
    ]);

    if (!deletedTodo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found or already deleted",
      });
    }

    console.log("✅ Todo deleted successfully:", todoId);

    // ✅ IMPROVED: Emit socket event immediately after successful deletion
    // Don't wait for project stats update
    emitTodoDeleted(projectId, todoId);

    // ✅ OPTIMIZED: Update project stats asynchronously (don't wait for it)
    // This prevents blocking the response
    setImmediate(async () => {
      try {
        const fullProject = await Project.findById(projectId);
        if (fullProject) {
          await fullProject.updateStats();
        }
      } catch (statsError) {
        console.error("Failed to update project stats:", statsError);
      }
    });

    return res.status(200).json({
      success: true,
      message: "Todo deleted successfully from project",
      data: { deletedTodoId: todoId },
    });
  } catch (error) {
    console.error("❌ Error deleting todo from project:", error);

    // ✅ IMPROVED: Better error handling without retries
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid todo or project ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error deleting todo from project",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// FIXED: Update todo in project
const updateTodoInProject = async (req, res) => {
  try {
    const { projectId, todoId } = req.params;
    const { task, description, priority, dueDate } = req.body;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const userRole = project.getUserRole(userId);
    if (!userRole || userRole === "viewer") {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to update todos in this project",
      });
    }

    // Ensure the todo belongs to this project
    const todo = await Todo.findOne({
      _id: todoId,
      project: projectId,
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found in this project",
      });
    }

    // Update fields if provided
    const updateFields = {};
    if (task !== undefined) updateFields.task = task.trim();
    if (description !== undefined) updateFields.description = description;
    if (priority !== undefined) updateFields.priority = priority;
    if (dueDate !== undefined) updateFields.dueDate = dueDate;

    const updatedTodo = await Todo.findByIdAndUpdate(todoId, updateFields, {
      new: true,
      runValidators: true,
    });

    emitTodoUpdated(projectId, updatedTodo);

    res.status(200).json({
      success: true,
      message: "Todo updated successfully",
      data: updatedTodo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating todo in project",
      error: error.message,
    });
  }
};

// FIXED: Toggle todo completion in project
// ✅ FIXED: Toggle todo completion in project with better error handling
// ✅ FIXED: Toggle todo completion with retry logic for write conflicts
const toggleTodoInProject = async (req, res) => {
  const { projectId, todoId } = req.params;
  const { isCompleted } = req.body;
  const userId = req.user._id;

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`🔄 Toggle attempt ${attempt}/${maxRetries} for todo:`, {
        projectId,
        todoId,
        isCompleted,
      });

      // Verify permissions and project existence
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const userRole = project.getUserRole(userId);
      if (!userRole || userRole === "viewer") {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions to toggle todos in this project",
        });
      }

      // Ensure the todo belongs to this project
      const todo = await Todo.findOne({
        _id: todoId,
        project: projectId,
      });

      if (!todo) {
        return res.status(404).json({
          success: false,
          message: "Todo not found in this project",
        });
      }

      // Update the completion status with retry-friendly options
      const newCompletionStatus =
        isCompleted !== undefined ? isCompleted : !todo.isCompleted;

      const updatedTodo = await Todo.findByIdAndUpdate(
        todoId,
        {
          isCompleted: newCompletionStatus,
          updatedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
          // Add options to handle write conflicts better
          writeConcern: { w: "majority", j: true },
          maxTimeMS: 10000,
        }
      );

      if (!updatedTodo) {
        throw new Error("Failed to update todo - todo may have been deleted");
      }

      console.log("✅ Todo toggled successfully:", {
        todoId,
        newStatus: updatedTodo.isCompleted,
      });

      // Update project stats asynchronously
      project
        .updateStats()
        .catch((err) => console.error("Failed to update project stats:", err));

      // Emit socket event AFTER successful database update
      emitTodoToggled(projectId, todoId, updatedTodo.isCompleted);

      return res.status(200).json({
        success: true,
        message: "Todo status updated successfully",
        data: updatedTodo,
      });
    } catch (error) {
      console.error(`❌ Toggle attempt ${attempt} failed:`, error.message);

      // Check if it's a retryable error
      const isRetryableError =
        error.code === 112 || // WriteConflict
        error.code === 11000 || // DuplicateKey
        error.errorLabels?.includes("TransientTransactionError") ||
        error.message?.includes("Write conflict");

      if (isRetryableError && attempt < maxRetries) {
        console.log(`⏳ Retrying toggle operation in ${attempt * 500}ms...`);
        // Shorter delay for toggle operations
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        continue;
      }

      // If it's not retryable or we've exhausted retries, return error
      console.error("❌ Final error toggling todo in project:", error);

      return res.status(500).json({
        success: false,
        message: "Error toggling todo in project",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
};

module.exports = {
  createProject,
  shareProject,
  requestProjectAccess,
  getAccessRequests,
  respondToAccessRequest,
  joinPublicProject,
  updateCollaboratorRole,
  removeCollaborator,
  getProjectById,
  getProjectsByUser,
  getPendingInvitations,
  respondToInvitation,
  updateProject,
  deleteProject,

  createTodoInProject,
  removeTodoFromProject,
  updateTodoInProject,
  toggleTodoInProject,
};
