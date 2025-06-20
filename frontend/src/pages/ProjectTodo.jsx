import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/config';
import { Button } from '../components/ui/button';

const ProjectTodo = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    task: '',
    description: '',
    dueDate: '',
    priority: '',
  });
  const [editingTodo, setEditingTodo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid || !projectId) {
        setLoading(false);
        return;
      }
      try {
        // Fetch project details
        const projectResponse = await API.get(`/projects/${projectId}`);
        setProject(projectResponse.data);

        // Fetch todos for the project
        const todosResponse = await API.get(`/todos/${currentUser.uid}?project=${projectId}`);
        setTasks(todosResponse.data);
      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, projectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTodo) {
        const response = await API.put(
          `/todos/update/${editingTodo._id}`,
          formData
        );
        if (response.data) {
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task._id === editingTodo._id ? response.data : task
            )
          );
        }
        setEditingTodo(null);
      } else {
        const response = await API.post('/todos/create', {
          ...formData,
          user: currentUser.uid,
          project: projectId, // Associate todo with the project
        });
        setTasks((prevTasks) => [...prevTasks, response.data.data]);
      }
      setFormData({
        task: '',
        description: '',
        dueDate: '',
        priority: '',
      });
    } catch (error) {
      console.error('Error saving todo:', error);
    }
  };

  const handleEditClick = (task) => {
    setEditingTodo(task);
    setFormData({
      task: task.task,
      description: task.description,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 16)
        : '',
      priority: task.priority,
    });
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/todos/delete/${id}`);
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleToggleComplete = async (id, isChecked) => {
    try {
      const response = await API.patch(`/todos/toggle/${id}`, {
        isCompleted: isChecked,
      });
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === id ? { ...task, isCompleted: isChecked } : task
        )
      );
      console.log('Todo updated:', response.data);
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="text-white text-lg">Loading project todos...</span>
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
          <p className="text-slate-300 mb-6">Please log in to access project todos.</p>
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

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Project Not Found</h2>
          <p className="text-slate-300 mb-6">The project you are looking for does not exist or you do not have access.</p>
          <Link 
            to="/projects" 
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-slate-900 font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            Go to Projects List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative p-4">
      <h1 className="text-3xl font-bold text-white mb-6">Project: {project.name} Todos</h1>

      <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-lg border border-slate-700/50">
        <h2 className="text-2xl font-semibold text-white mb-4">{editingTodo ? 'Edit Todo' : 'Add New Todo'}</h2>
        <div className="mb-4">
          <label htmlFor="task" className="block text-slate-300 text-sm font-bold mb-2">Task:</label>
          <input
            type="text"
            id="task"
            name="task"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-200"
            value={formData.task}
            onChange={handleChange}
            placeholder="Enter task name"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="description" className="block text-slate-300 text-sm font-bold mb-2">Description (Optional):</label>
          <textarea
            id="description"
            name="description"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-200 h-24"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter task description"
          ></textarea>
        </div>
        <div className="mb-4">
          <label htmlFor="dueDate" className="block text-slate-300 text-sm font-bold mb-2">Due Date (Optional):</label>
          <input
            type="datetime-local"
            id="dueDate"
            name="dueDate"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-200"
            value={formData.dueDate}
            onChange={handleChange}
          />
        </div>
        <div className="mb-6">
          <label htmlFor="priority" className="block text-slate-300 text-sm font-bold mb-2">Priority:</label>
          <select
            id="priority"
            name="priority"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-200"
            value={formData.priority}
            onChange={handleChange}
            required
          >
            <option value="">Select Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-all duration-200"
        >
          {editingTodo ? 'Update Todo' : 'Add Todo'}
        </button>
        {editingTodo && (
          <button
            type="button"
            onClick={() => setEditingTodo(null)}
            className="ml-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-all duration-200"
          >
            Cancel Edit
          </button>
        )}
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.length === 0 ? (
          <p className="text-slate-400 text-lg col-span-full">No todos for this project. Add one above!</p>
        ) : (
          tasks.map((task) => (
            <div key={task._id} className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-slate-700/50 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{task.task}</h3>
                {task.description && <p className="text-slate-400 text-sm mb-4">{task.description}</p>}
                <p className="text-slate-500 text-xs">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
                <p className="text-slate-500 text-xs">Priority: {task.priority}</p>
                <p className="text-slate-500 text-xs">Status: {task.isCompleted ? 'Completed' : 'Pending'}</p>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button onClick={() => handleEditClick(task)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Edit</Button>
                <Button onClick={() => handleDelete(task._id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Delete</Button>
                <Button onClick={() => handleToggleComplete(task._id, !task.isCompleted)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                  {task.isCompleted ? 'Mark Pending' : 'Mark Complete'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectTodo;