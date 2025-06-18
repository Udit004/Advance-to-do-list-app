const Project = require('../models/projectModel');

// Create a new project
const createProject = async (req, res) => {
  try {
    const { name, description, owner, members } = req.body;

    if (!name || !owner) {
      return res.status(400).json({ message: 'Project name and owner are required' });
    }

    const newProject = new Project({
      name,
      description,
      owner,
      members: members || []
    });

    const savedProject = await newProject.save();
    res.status(201).json({ success: true, message: 'Project created successfully', data: savedProject });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating project', error: error.message });
  }
};

// Get all projects for a user (either as owner or member)
const getProjectsByUser = async (req, res) => {
  try {
    const userId = req.params.uid;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const projects = await Project.find({
      $or: [{ owner: userId }, { members: userId }]
    });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching projects', error: error.message });
  }
};

// Get a single project by ID
const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching project', error: error.message });
  }
};

// Update a project
const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, description, members } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { name, description, members },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ success: true, message: 'Project updated successfully', data: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating project', error: error.message });
  }
};

// Delete a project
const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const deletedProject = await Project.findByIdAndDelete(projectId);

    if (!deletedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting project', error: error.message });
  }
};

module.exports = {
  createProject,
  getProjectsByUser,
  getProjectById,
  updateProject,
  deleteProject
};