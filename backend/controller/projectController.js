const Project = require("../models/projectModel");
const Todo = require("../models/todo");
const User = require("../models/userProfileModel");
const mongoose = require("mongoose");

const { 
  emitTodoCreated, 
  emitTodoUpdated, 
  emitTodoDeleted, 
  emitTodoToggled 
} = require("../socket");

// Create a new project
const createProject = async (req, res) => {
  try {
    const { name, description, isPublic, color, tags } = req.body;
    const userId = req.user && req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed. Owner ID is missing.",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    const newProject = new Project({
      name,
      description,
      owner: userId,
      isPublic: isPublic || false,
      color: color || "blue",
      tags: tags || [],
    });

    const savedProject = await newProject.save();

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: savedProject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating project",
      error: error.message,
    });
  }
};

// Get all projects for a user (owned + collaborated + public)
const getProjectsByUser = async (req, res) => {
  try {
    const userId = req.params.uid || req.user._id;
    const { includePublic = false, status = "all" } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const conditions = {
      $or: [
        { owner: userId },
        {
          "collaborators.userId": userId,
          "collaborators.status":
            status === "all" ? { $in: ["pending", "accepted"] } : status,
        },
      ],
    };

    if (includePublic) {
      conditions.$or.push({ isPublic: true });
    }

    const projects = await Project.find(conditions)
      .populate("todos", "task isCompleted priority dueDate")
      .sort({ updatedAt: -1 });

    const projectsWithRole = projects.map((project) => {
      const projectObj = project.toObject();
      projectObj.userRole = project.getUserRole(userId);
      return projectObj;
    });

    res.status(200).json({
      success: true,
      data: projectsWithRole,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching projects",
      error: error.message,
    });
  }
};

// Get a single project by ID with access control
const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user._id;

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


// Share project with another user
const shareProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, role = "editor" } = req.body;
    const userId = req.user._id;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only project owner can share projects",
      });
    }

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    try {
      await project.addCollaborator({
        userId: targetUser._id || targetUser.uid,
        email: targetUser.email,
        username: targetUser.username || targetUser.displayName,
        role,
      });

      res.status(200).json({
        success: true,
        message: "Project shared successfully",
        data: {
          collaborator: {
            email: targetUser.email,
            username: targetUser.username || targetUser.displayName,
            role,
          },
        },
      });
    } catch (error) {
      if (error.message === "User is already a collaborator") {
        return res.status(400).json({
          success: false,
          message: "User is already a collaborator on this project",
        });
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sharing project",
      error: error.message,
    });
  }
};

// Accept/Decline project invitation
const respondToInvitation = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { action } = req.body;
    const userId = req.user._id;

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

    const collaborator = project.collaborators.find(
      (collab) => collab.userId === userId && collab.status === "pending"
    );

    if (!collaborator) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found or already responded",
      });
    }

    collaborator.status = action === "accept" ? "accepted" : "declined";
    await project.save();

    res.status(200).json({
      success: true,
      message: `Invitation ${action}ed successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error responding to invitation",
      error: error.message,
    });
  }
};

// Get user's pending invitations
const getPendingInvitations = async (req, res) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({
      "collaborators.userId": userId,
      "collaborators.status": "pending",
    }).select("name description owner createdAt");

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pending invitations",
      error: error.message,
    });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, description, isPublic, color, tags } = req.body;
    const userId = req.user._id;

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

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { name, description, isPublic, color, tags },
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

// FIXED: Delete project with proper cleanup of todos
const deleteProject = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const projectId = req.params.id;
    const userId = req.user._id;

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

      if (project.owner !== userId) {
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
    console.log(`Project ${projectId} deleted by user ${userId}`);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting project",
      error: error.message,
    });
    console.error(`Error deleting project ${projectId}:`, error);
  } finally {
    await session.endSession();
  }
};


// // FIXED: Add existing todo to project with proper bidirectional relationship
// const addTodoToProject = async (req, res) => {
//   const session = await mongoose.startSession();
  
//   try {
//     const { projectId } = req.params;
//     const { todoId } = req.body;
//     const userId = req.user._id;

//     await session.withTransaction(async () => {
//       const project = await Project.findById(projectId).session(session);
//       if (!project) {
//         throw new Error("Project not found");
//       }

//       const userRole = project.getUserRole(userId);
//       if (!userRole || userRole === "viewer") {
//         throw new Error("Insufficient permissions");
//       }

//       const todo = await Todo.findById(todoId).session(session);
//       if (!todo || todo.user.toString() !== userId.toString()) {
//         throw new Error("Todo not found or access denied");
//       }

//       if (project.todos.includes(todoId)) {
//         throw new Error("Todo already in this project");
//       }

//       // Update both sides of the relationship
//       await Todo.findByIdAndUpdate(
//         todoId,
//         { project: projectId },
//         { session, new: true }
//       );

//       await Project.findByIdAndUpdate(
//         projectId,
//         { $push: { todos: todoId } },
//         { session, new: true }
//       );

//       // Update project stats
//       await project.updateStats();
//     });

//     // Fetch updated data after transaction
//     const updatedTodo = await Todo.findById(todoId);
//     const updatedProject = await Project.findById(projectId);

//     emitTodoCreated(projectId, updatedTodo);

//     res.status(200).json({
//       success: true,
//       message: "Todo added to project successfully",
//       data: {
//         project: updatedProject,
//         todo: updatedTodo
//       },
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message || "Error adding todo to project",
//       error: error.message,
//     });
//   } finally {
//     await session.endSession();
//   }
// };

// FIXED: Remove todo from project with proper bidirectional cleanup
// IMPROVED: Create todo with duplicate prevention

// ✅ FIXED: createTodoInProject function with proper project association

const createTodoInProject = async (req, res) => {
  let session = null;
  
  try {
    const { projectId } = req.params;
    const { task, description, priority, dueDate, list } = req.body;
    const userId = req.user._id;

    console.log('🚀 Creating todo in project:', { projectId, userId, task });

    // Validate required fields
    if (!task || !task.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task is required",
        error: "MISSING_TASK"
      });
    }

    // First, verify project exists and user has permissions (outside transaction)
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
        error: "PROJECT_NOT_FOUND"
      });
    }

    const userRole = project.getUserRole(userId);
    if (!userRole || userRole === "viewer") {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to create todos in this project",
        error: "INSUFFICIENT_PERMISSIONS"
      });
    }

    // Check for duplicate todos (outside transaction for better performance)
    const existingTodo = await Todo.findOne({
      task: task.trim(),
      project: projectId,
      user: userId,
      isCompleted: false
    });

    if (existingTodo) {
      return res.status(409).json({
        success: false,
        message: "A similar task already exists in this project",
        error: "DUPLICATE_TODO"
      });
    }

    // Try with transaction first
    try {
      session = await mongoose.startSession();
      
      const result = await session.withTransaction(async () => {
        // Create todo with explicit project association
        const newTodo = new Todo({
          task: task.trim(),
          description: description || '',
          priority: priority || 'medium',
          dueDate: dueDate || null,
          list: list || 'General',
          user: userId,
          project: projectId,
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Save the todo
        const savedTodo = await newTodo.save({ session });
        
        // Add todo to project's todos array
        await Project.findByIdAndUpdate(
          projectId,
          { 
            $addToSet: { todos: savedTodo._id },
            updatedAt: new Date()
          },
          { session, new: true }
        );

        return savedTodo;
      }, {
        // Transaction options
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
        maxCommitTimeMS: 10000
      });

      console.log('✅ Todo created successfully with transaction:', result._id);

      // Populate the todo with user info for response and socket emission
      const populatedTodo = await Todo.findById(result._id)
        .populate('user', 'displayName email');

      // Update project stats asynchronously (don't wait for it)
      project.updateStats().catch(err => 
        console.error('Failed to update project stats:', err)
      );

      // Emit socket event with populated data
      const socketData = {
        ...populatedTodo.toObject(),
        createdBy: populatedTodo.user?.displayName || populatedTodo.user?.email || 'Anonymous'
      };

      // Emit to all users in the project room
      emitTodoCreated(projectId, socketData);

      // Return success response
      return res.status(201).json({
        success: true,
        message: "Todo created successfully in project",
        data: populatedTodo,
      });

    } catch (transactionError) {
      console.warn('⚠️ Transaction failed, falling back to non-transaction approach:', transactionError.message);
      
      // Fallback: Create without transaction
      const newTodo = new Todo({
        task: task.trim(),
        description: description || '',
        priority: priority || 'medium',
        dueDate: dueDate || null,
        list: list || 'General',
        user: userId,
        project: projectId,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Save the todo (without transaction)
      const savedTodo = await newTodo.save();
      
      // Add todo to project's todos array (without transaction)
      await Project.findByIdAndUpdate(
        projectId,
        { 
          $addToSet: { todos: savedTodo._id },
          updatedAt: new Date()
        },
        { new: true }
      );

      console.log('✅ Todo created successfully without transaction:', savedTodo._id);

      // Populate the todo with user info
      const populatedTodo = await Todo.findById(savedTodo._id)
        .populate('user', 'displayName email');

      // Update project stats asynchronously
      project.updateStats().catch(err => 
        console.error('Failed to update project stats:', err)
      );

      // Emit socket event
      const socketData = {
        ...populatedTodo.toObject(),
        createdBy: populatedTodo.user?.displayName || populatedTodo.user?.email || 'Anonymous'
      };

      emitTodoCreated(projectId, socketData);

      return res.status(201).json({
        success: true,
        message: "Todo created successfully in project",
        data: populatedTodo,
      });
    }

  } catch (error) {
    console.error('❌ Error creating todo in project:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
        details: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate task detected",
        error: "DUPLICATE_TODO"
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "Internal server error while creating todo",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  } finally {
    // Always end session if it exists
    if (session) {
      try {
        await session.endSession();
      } catch (sessionError) {
        console.error('Error ending session:', sessionError);
      }
    }
  }
};


// ✅ IMPROVED: Remove todo with proper cleanup
const removeTodoFromProject = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const { projectId, todoId } = req.params;
    const userId = req.user._id;

    await session.withTransaction(async () => {
      const project = await Project.findById(projectId).session(session);
      if (!project) {
        throw new Error("Project not found");
      }

      const userRole = project.getUserRole(userId);
      if (!userRole || userRole === "viewer") {
        throw new Error("Insufficient permissions");
      }

      // ✅ VERIFY TODO EXISTS AND BELONGS TO PROJECT
      const todo = await Todo.findOne({
        _id: todoId,
        project: projectId
      }).session(session);

      if (!todo) {
        throw new Error("Todo not found in this project");
      }

      // Remove from both sides of the relationship
      await Project.findByIdAndUpdate(
        projectId,
        { $pull: { todos: todoId } },
        { session }
      );

      await Todo.findByIdAndUpdate(
        todoId,
        { $unset: { project: 1 } },
        { session }
      );

      // Update project stats
      await project.updateStats();
    });

    emitTodoDeleted(projectId, todoId);

    res.status(200).json({
      success: true,
      message: "Todo removed from project successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error removing todo from project",
      error: error.message,
    });
  } finally {
    await session.endSession();
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
      project: projectId 
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

    const updatedTodo = await Todo.findByIdAndUpdate(
      todoId,
      updateFields,
      { new: true, runValidators: true }
    );

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
const toggleTodoInProject = async (req, res) => {
  try {
    const { projectId, todoId } = req.params;
    const { isCompleted } = req.body;
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
        message: "Insufficient permissions to toggle todos in this project",
      });
    }

    // Ensure the todo belongs to this project
    const todo = await Todo.findOne({ 
      _id: todoId, 
      project: projectId 
    });
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found in this project",
      });
    }

    todo.isCompleted = isCompleted !== undefined ? isCompleted : !todo.isCompleted;
    const updatedTodo = await todo.save();

    // Update project stats
    await project.updateStats();

    emitTodoToggled(projectId, todoId, todo.isCompleted);

    res.status(200).json({
      success: true,
      message: "Todo status updated successfully",
      data: updatedTodo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error toggling todo in project",
      error: error.message,
    });
  }
};

module.exports = {
  createProject,
  getProjectsByUser,
  getProjectById,
  removeTodoFromProject,
  shareProject,
  respondToInvitation,
  getPendingInvitations,
  updateProject,
  deleteProject,
  createTodoInProject,
  updateTodoInProject,
  toggleTodoInProject
};