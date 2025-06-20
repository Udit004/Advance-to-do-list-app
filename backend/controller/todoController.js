// Import Mongoose model
const Todo = require('../models/todo');
const Notification = require('../models/notificationModel');
const { io } = require('../index');
const transporter = require('../config/email'); // Import the transporter

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
      user: req.body.user,
      list: req.body.list || "general" // Add this line to include the list property
    });

    // Save to database
    const savedTodo = await newTodo.save();
    await Notification.create({
      user: savedTodo.user,
      todoId: savedTodo._id,
      message: `new todo created: "${savedTodo.task}"`, // Use savedTodo.task
      type: 'new_todo',
      read: false
    });
    io.emit('newNotification', { userId: savedTodo.user, message: `Your todo "${savedTodo.task}" is created` });

    await transporter.sendMail({
      from: process.env.EMAIL_USER, // Correct environment variable
      to: req.user.email,
      subject: 'New Todo Created',
      html: `<p>A new task <strong>${newTodo.task}</strong> has been created!</p>` // Use newTodo.task
    });
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
    const projectId = req.query.project; // Get project ID from query parameter
    const excludeProjectTodos = req.query.excludeProjectTodos === 'true'; // New parameter

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let query = { user: userId };
    if (projectId) {
      query.project = projectId; // Add project filter if projectId is provided
    } else if (excludeProjectTodos) {
      query.project = { $exists: false }; // Exclude todos with a project field
    }

    const todos = await Todo.find(query);

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
    console.log('Toggle todo status for ID:', todoId);

    // Validate MongoDB ID format
    if (!todoId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid todo ID format"
      });
    }

    const todo = await Todo.findById(todoId);
    console.log('Found todo:', todo);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found"
      });
    }

    todo.isCompleted = !todo.isCompleted;
    todo.completeDate = todo.isCompleted ? new Date() : null;

    const updatedTodo = await todo.save();
    console.log('Updated todo:', updatedTodo);
    if (updatedTodo.isCompleted) { // Only create/update notification when marking as complete
      await Notification.findOneAndUpdate(
        {
          user: updatedTodo.user,
          todoId: updatedTodo._id,
          type: 'todo_completed'
        },
        {
          $set: {
            message: `Todo completed: "${updatedTodo.task}"`, // Use updatedTodo.task
            read: false // Mark as unread when re-completing
          }
        },
        {
          upsert: true, // Create if not found
          new: true,    // Return the updated/created document
          setDefaultsOnInsert: true // Apply schema defaults for new documents
        }
      );
      io.emit('newNotification', { userId: updatedTodo.user, message: `Your todo "${updatedTodo.task}" is completed` });

      // Send email for task completion
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: req.user.email,
          subject: 'Todo Completed',
          html: `<p>Your task <strong>${updatedTodo.task}</strong> has been marked as completed!</p>`
        });
      } catch (emailError) {
        console.error('Error sending todo completion email:', emailError);
        // Continue processing even if email sending fails
      }
    }
    res.status(200).json({
      success: true,
      message: "Todo status updated",
      data: updatedTodo
    });
  } catch (error) {
    console.error('Error in toggleTodoStatus:', error);
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
    console.log('Update priority for ID:', todoId, 'New priority:', priority);

    // Validate MongoDB ID format
    if (!todoId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid todo ID format"
      });
    }

    // Validate priority value
    if (!priority || !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority value. Must be 'low', 'medium', or 'high'."
      });
    }

    const todo = await Todo.findById(todoId);
    console.log('Found todo:', todo);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found"
      });
    }

    todo.priority = priority;
    const updatedTodo = await todo.save();
    console.log('Updated todo:', updatedTodo);

    res.status(200).json({
      success: true,
      message: "Todo priority updated",
      data: updatedTodo
    });
  } catch (error) {
    console.error('Error in updateTodoPriority:', error);
    res.status(500).json({
      success: false,
      message: "Error updating todo priority",
      error: error.message
    });
  }
};



// PUT - Update a todo
const updateTodo = async (req, res) => {
  try {
    const todoId = req.params.id;
    const updates = req.body;

    const updatedTodo = await Todo.findByIdAndUpdate(
      todoId,
      updates,
      { new: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(updatedTodo);
    await Notification.create({
      user: updatedTodo.user,
      todoId: updatedTodo._id,
      message: `Todo Updated: "${updatedTodo.task}"`, // Use updatedTodo.task
      type: 'todo_updated',
      read: false
    });
    io.emit('newNotification', { userId: updatedTodo.user, message: `Your todo "${updatedTodo.task}" is update` }); // Use updatedTodo.user and updatedTodo.task

  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE - Delete a todo
const deleteTodo = async (req, res) => {
  try {
    const todoId = req.params.id;

    const deletedTodo = await Todo.findByIdAndDelete(todoId);

    if (!deletedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });

    await Notification.create({
      user: deletedTodo.user,
      todoId: deletedTodo._id,
      message: `Todo Deleted: "${deletedTodo.task}"`, // Use deletedTodo.task
      type: 'todo_deleted',
      read: false
    });
    io.emit('newNotification', { userId: deletedTodo.user, message: `Your todo "${deletedTodo.task}" is delete` }); // Use deletedTodo.user and deletedTodo.task

  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createTodo,
  getTodosByUser,
  toggleTodoStatus,
  updateTodoPriority,
  updateTodo,
  deleteTodo,
};