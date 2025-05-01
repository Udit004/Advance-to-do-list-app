const express = require('express');
const router = express.Router();
const todoController = require('../controller/todoController');

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
    } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
