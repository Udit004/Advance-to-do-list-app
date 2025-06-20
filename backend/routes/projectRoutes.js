const express = require('express');
const router = express.Router();
const projectController = require('../controller/projectController');
const protect = require('../middleware/authMiddleware');
const isPaidUser = require('../middleware/isPaidMiddleware');

// Create a new project
router.post('/create', protect, projectController.createProject);

// Get all projects for a user
router.get('/user/:uid', protect, projectController.getProjectsByUser);

// Get a single project by ID
router.get('/:id', protect, projectController.getProjectById);

// Update a project
router.put('/update/:id', protect, projectController.updateProject);

// Delete a project
router.delete('/delete/:id', protect, projectController.deleteProject);

module.exports = router;