import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/config';
import { Link } from 'react-router-dom';

const ProjectList = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }
      try {
        const response = await API.get(`/projects/user/${currentUser.uid}`);
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [currentUser]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const response = await API.post('/projects/create', {
        name: newProjectName,
        description: newProjectDescription,
        owner: currentUser.uid,
      });
      setProjects([...projects, response.data.data]);
      setNewProjectName('');
      setNewProjectDescription('');
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="text-white text-lg">Loading projects...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-slate-300 mb-6">Please log in to access your projects.</p>
          <Link 
            to="/login" 
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-slate-900 font-semibold rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all duration-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative p-4">
      <h1 className="text-3xl font-bold text-white mb-6">Your Projects</h1>

      <form onSubmit={handleCreateProject} className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-lg border border-slate-700/50">
        <h2 className="text-2xl font-semibold text-white mb-4">Create New Project</h2>
        <div className="mb-4">
          <label htmlFor="newProjectName" className="block text-slate-300 text-sm font-bold mb-2">Project Name:</label>
          <input
            type="text"
            id="newProjectName"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-200"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Enter project name"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="newProjectDescription" className="block text-slate-300 text-sm font-bold mb-2">Description (Optional):</label>
          <textarea
            id="newProjectDescription"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-200 h-24"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            placeholder="Enter project description"
          ></textarea>
        </div>
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-all duration-200"
        >
          Create Project
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <p className="text-slate-400 text-lg col-span-full">No projects found. Create one above!</p>
        ) : (
          projects.map((project) => (
            <div key={project._id} className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-slate-700/50 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{project.name}</h3>
                {project.description && <p className="text-slate-400 text-sm mb-4">{project.description}</p>}
                <p className="text-slate-500 text-xs">Created: {new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="mt-4">
                <Link
                  to={`/project/${project._id}/todos`}
                  className="inline-block bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-all duration-200"
                >
                  View Project Todos
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectList;