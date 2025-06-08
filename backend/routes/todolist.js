const express = require('express');
const router = express.Router();
const todoController = require('../controller/todoController');
const Notification = require('../models/notificationModel'); 
// Get all todos for a user
router.get('/todos/:uid', todoController.getTodosByUser);

// Create a new todo
router.post('/create', todoController.createTodo);

// Toggle todo completion status
router.patch('/toggle/:id', todoController.toggleTodoStatus);

// Update todo priority
router.patch('/priority/:id', todoController.updateTodoPriority);

// Update a todo
router.put('/update/:id', async (req, res) => {
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
            message: `Todo Updated: "${updatedTodo.task}"`,
            type: 'todo_updated',
            read: false
        });
        io.emit('newNotification', { userId: todo.user, message: `Your todo "${todo.task}" is update` });

    } catch (error) {
        console.error('Error updating todo:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a todo
router.delete('/delete/:id', async (req, res) => {
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
            message: `Todo Updated: "${deletedTodo.task}"`,
            type: 'todo_deleted',
            read: false
        });
        io.emit('newNotification', { userId: todo.user, message: `Your todo "${todo.task}" is delete` });

    } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
