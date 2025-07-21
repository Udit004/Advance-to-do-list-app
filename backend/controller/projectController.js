const Project = require("../models/projectModel");
const Todo = require("../models/todo"); // Your existing Todo model
const User = require("../models/userProfileModel"); // Assuming you have a User model


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
    const userId = req.user && req.user._id; // From auth middleware

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
// Get all projects for a user (owned + collaborated + public)
const getProjectsByUser = async (req, res) => {
  try {
    // Handle both cases: /user and /user/:uid
    const userId = req.params.uid || req.user._id;
    const { includePublic = false, status = "all" } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Build query conditions
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

    // Include public projects if requested
    if (includePublic) {
      conditions.$or.push({ isPublic: true });
    }

    const projects = await Project.find(conditions)
      .populate("todos", "task isCompleted priority dueDate")
      .sort({ updatedAt: -1 });

    // Add user's role to each project
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
      "task description isCompleted priority dueDate createdAt updatedAt"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check access permissions
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


// Add existing todo to project
const addTodoToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { todoId } = req.body;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const userRole = project.getUserRole(userId);
    if (!userRole || userRole === "viewer") {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }

    const todo = await Todo.findById(todoId);
    if (!todo || todo.user !== userId) {
      return res
        .status(404)
        .json({ success: false, message: "Todo not found or access denied" });
    }

    if (project.todos.includes(todoId)) {
      return res
        .status(400)
        .json({ success: false, message: "Todo already in this project" });
    }

    // ✅ Assign project to todo
    todo.project = projectId;
    await todo.save();

    // Add to project
    project.todos.push(todoId);
    await project.save();
    await project.updateStats();

    // NEW: Emit socket event for real-time collaboration
    const todoData = await Todo.findById(todoId);
    emitTodoCreated(projectId, todoData);

    res.status(200).json({
      success: true,
      message: "Todo added to project successfully",
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding todo to project",
      error: error.message,
    });
  };
};


// MODIFY: Add socket emission to removeTodoFromProject function
// Replace the existing removeTodoFromProject function with this updated version
const removeTodoFromProject = async (req, res) => {
  try {
    const { projectId, todoId } = req.params;
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
        message: "Insufficient permissions",
      });
    }

    project.todos = project.todos.filter((id) => id.toString() !== todoId);
    await project.save();
    await project.updateStats();
    
    const todo = await Todo.findById(todoId);
    if (todo) {
      todo.project = null;
      await todo.save();
    }

    // NEW: Emit socket event for real-time collaboration
    emitTodoDeleted(projectId, todoId);

    res.status(200).json({
      success: true,
      message: "Todo removed from project successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing todo from project",
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

    // Only owner can share projects
    if (project.owner !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only project owner can share projects",
      });
    }

    // Find user by email (assuming you have a User model)
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
    const { action } = req.body; // 'accept' or 'decline'
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

// Delete a project
const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
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

    // Only owner can delete project
    if (project.owner !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only project owner can delete projects",
      });
    }

    await Project.findByIdAndDelete(projectId);

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting project",
      error: error.message,
    });
  }
};

// NEW: Create todo directly in project (add this new function)
const createTodoInProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { task, description, priority, dueDate } = req.body;
    const userId = req.user._id;

    // Check project access and permissions
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
        message: "Insufficient permissions to create todos in this project",
      });
    }

    if (!task || !task.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task content is required",
      });
    }

    // Create the todo
    const newTodo = new Todo({
      task: task.trim(),
      description: description || "",
      priority: priority || "medium",
      dueDate: dueDate || null,
      user: userId,
      project: projectId,
      list: "general", // or get from request
      isCompleted: false,
    });

    const savedTodo = await newTodo.save();

    // Add to project
    project.todos.push(savedTodo._id);
    await project.save();
    await project.updateStats();

    // Populate the todo data for socket emission
    const populatedTodo = await Todo.findById(savedTodo._id);

    // NEW: Emit socket event for real-time collaboration
    emitTodoCreated(projectId, populatedTodo);

    res.status(201).json({
      success: true,
      message: "Todo created successfully",
      data: populatedTodo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating todo in project",
      error: error.message,
    });
  }
};

// NEW: Update todo in project (add this new function)
const updateTodoInProject = async (req, res) => {
  try {
    const { projectId, todoId } = req.params;
    const { task, description, priority, dueDate } = req.body;
    const userId = req.user._id;

    // Check project access and permissions
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

    // Find and update the todo
    const todo = await Todo.findById(todoId);
    if (!todo || !project.todos.includes(todoId)) {
      return res.status(404).json({
        success: false,
        message: "Todo not found in this project",
      });
    }

    // Update fields if provided
    if (task !== undefined) todo.task = task.trim();
    if (description !== undefined) todo.description = description;
    if (priority !== undefined) todo.priority = priority;
    if (dueDate !== undefined) todo.dueDate = dueDate;

    const updatedTodo = await todo.save();

    // NEW: Emit socket event for real-time collaboration
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

// NEW: Toggle todo completion in project (add this new function)
const toggleTodoInProject = async (req, res) => {
  try {
    const { projectId, todoId } = req.params;
    const { isCompleted } = req.body;
    const userId = req.user._id;

    // Check project access and permissions
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

    // Find and toggle the todo
    const todo = await Todo.findById(todoId);
    if (!todo || !project.todos.includes(todoId)) {
      return res.status(404).json({
        success: false,
        message: "Todo not found in this project",
      });
    }

    todo.isCompleted = isCompleted !== undefined ? isCompleted : !todo.isCompleted;
    const updatedTodo = await todo.save();

    // Update project stats
    await project.updateStats();

    // NEW: Emit socket event for real-time collaboration
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
}

