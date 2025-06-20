const express = require('express');
console.log('Request received by todolist router');
const router = express.Router();
const todoController = require('../controller/todoController');
const Notification = require('../models/notificationModel');
const authMiddleware = require('../middleware/authMiddleware'); // Import the auth middleware
const { io } = require('../index'); // Import io

// Get all todos for a user
router.get('/:uid', todoController.getTodosByUser);

// Create a new todo
router.post('/create', authMiddleware, todoController.createTodo); // Apply authMiddleware

// Toggle todo completion status
router.patch('/toggle/:id', authMiddleware, todoController.toggleTodoStatus); // Apply authMiddleware

// Update todo priority
router.patch('/priority/:id', authMiddleware, todoController.updateTodoPriority); // Apply authMiddleware

// Update a todo
router.put('/update/:id', authMiddleware, todoController.updateTodo); // Apply authMiddleware

// Delete a todo
router.delete('/delete/:id', authMiddleware, todoController.deleteTodo); // Apply authMiddleware

module.exports = router;
