const express = require('express');
console.log('Request received by todolist router');
const router = express.Router();
const todoController = require('../controller/todoController');
const Notification = require('../models/notificationModel');
const authMiddleware = require('../middleware/authMiddleware'); // Import the auth middleware
const { io } = require('../index'); // Import io

// Get all todos for a user
router.get('/todos/:uid', todoController.getTodosByUser);

// Create a new todo
router.post('/create', authMiddleware, todoController.createTodo); // Apply authMiddleware

// Toggle todo completion status
router.patch('/toggle/:id', authMiddleware, todoController.toggleTodoStatus); // Apply authMiddleware

// Update todo priority
router.patch('/priority/:id', authMiddleware, todoController.updateTodoPriority); // Apply authMiddleware

// Update a todo
router.put('/update/:id', authMiddleware, async (req, res) => { // Apply authMiddleware
    try {
        const todoId = req.params.id;
        const updates = req.body;
        const Todo = require('../models/todo');

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
});

// Delete a todo
router.delete('/delete/:id', authMiddleware, async (req, res) => { // Apply authMiddleware
    try {
        const todoId = req.params.id;
        const Todo = require('../models/todo');

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
});

module.exports = router;
