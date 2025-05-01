// Import Mongoose model
const Todo = require('../models/todo');

// POST - Create new todo
const createTodo = async (req, res) => {
  try {
    // Validate request body
    if (!req.body.task) {
      return res.status(400).json({ message: "Task is required" });
    }

    // Create new todo document
    const newTodo = new Todo({
      task: req.body.task,
      isCompleted: req.body.isCompleted || false,
      description: req.body.description || "",
      dueDate: req.body.dueDate || null,
      priority: req.body.priority || "medium",
      user: req.body.user
    });

    // Save to database
    const savedTodo = await newTodo.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: "Todo created successfully",
      data: savedTodo
    });

  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      message: "Error creating todo",
      error: error.message
    });
  }
};

// GET - Get all todos for a user
const getTodosByUser = async (req, res) => {
  try {
    const userId = req.params.uid;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const todos = await Todo.find({ user: userId });

    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching todos",
      error: error.message
    });
  }
};

// PATCH - Toggle todo completion status
const toggleTodoStatus = async (req, res) => {
  try {
    const todoId = req.params.id;

    const todo = await Todo.findById(todoId);

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    todo.isCompleted = !todo.isCompleted;
    todo.completeDate = todo.isCompleted ? new Date() : null;

    const updatedTodo = await todo.save();

    res.status(200).json({
      success: true,
      message: "Todo status updated",
      data: updatedTodo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating todo status",
      error: error.message
    });
  }
};

// PATCH - Update todo priority
const updateTodoPriority = async (req, res) => {
  try {
    const todoId = req.params.id;
    const { priority } = req.body;

    // Validate priority value
    if (!priority || !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority value. Must be 'low', 'medium', or 'high'."
      });
    }

    const todo = await Todo.findById(todoId);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found"
      });
    }

    todo.priority = priority;
    const updatedTodo = await todo.save();

    res.status(200).json({
      success: true,
      message: "Todo priority updated",
      data: updatedTodo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating todo priority",
      error: error.message
    });
  }
};

module.exports = {
  createTodo,
  getTodosByUser,
  toggleTodoStatus,
  updateTodoPriority
};