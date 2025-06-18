const express = require('express');
const router = express.Router();
const projectController = require('../controller/projectController');
const protect = require('../middleware/authMiddleware');
const isPaidUser = require('../middleware/isPaidMiddleware');

// Create a new project
router.post('/create', protect, isPaidUser, projectController.createProject);

// Get all projects for a user
router.get('/user/:uid', protect, isPaidUser, projectController.getProjectsByUser);

// Get a single project by ID
router.get('/:id', protect, isPaidUser, projectController.getProjectById);

// Update a project
router.put('/update/:id', protect, isPaidUser, projectController.updateProject);

// Delete a project
router.delete('/delete/:id', protect, isPaidUser, projectController.deleteProject);

module.exports = router;