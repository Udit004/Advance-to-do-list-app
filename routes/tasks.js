const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Routes
router.get('/tasks', taskController.getAllTasks);
router.post('/tasks', taskController.addTask);
router.delete('/tasks/:id', taskController.deleteTask);  // Use dynamic ID here

module.exports = router;
