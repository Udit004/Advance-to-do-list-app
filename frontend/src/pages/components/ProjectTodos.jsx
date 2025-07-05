import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/config';
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle, 
  Circle, 
  Calendar, 
  Flag, 
  Trash2, 
  Edit3,
  Users,
  Settings
} from 'lucide-react';

const ProjectTodos = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTodo, setNewTodo] = useState({
    task: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  });

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const response = await API.get(`/projects/${projectId}`);
      setProject(response.data.data);
      setTodos(response.data.data.todos || []);
    } catch (error) {
      console.error('Error fetching project:', error);
      if (error.response?.status === 403) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.task.trim()) return;

    try {
      // First create the todo
      const todoResponse = await API.post('/todos/create', {
        ...newTodo,
        user: currentUser.uid
      });

      // Then add it to the project
      await API.post(`/projects/${projectId}/todos`, {
        todoId: todoResponse.data.data._id
      });

      // Refresh project data
      await fetchProjectData();
      
      // Reset form
      setNewTodo({
        task: '',
        description: '',
        priority: 'medium',
        dueDate: ''
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const handleToggleTodo = async (todoId, isCompleted) => {
    try {
      await API.patch(`/todos/${todoId}`, {
        isCompleted: !isCompleted
      });
      
      // Update local state
      setTodos(todos.map(todo => 
        todo._id === todoId ? { ...todo, isCompleted: !isCompleted } : todo
      ));
      
      // Update project stats
      await fetchProjectData();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId) => {
    if (!window.confirm('Are you sure you want to remove this todo from the project?')) return;

    try {
      await API.delete(`/projects/${projectId}/todos/${todoId}`);
      await fetchProjectData();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const canEdit = project && (project.userRole === 'owner' || project.userRole === 'editor');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Project Not Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              <p className="text-slate-400">{project.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-slate-500">
                  {todos.length} tasks • {project.completionPercentage || 0}% complete
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${project.userRole === 'owner' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                  {project.userRole}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            )}
          </div>
        </div>

        {/* Create Todo Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Create New Task</h3>
              
              <form onSubmit={handleCreateTodo} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={newTodo.task}
                    onChange={(e) => setNewTodo({ ...newTodo, task: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTodo.description}
                    onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Priority
                    </label>
                    <select
                      value={newTodo.priority}
                      onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newTodo.dueDate}
                      onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Create Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {todos.length > 0 && (
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm">Progress</span>
              <span className="text-slate-300 text-sm">{project.completionPercentage || 0}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.completionPercentage || 0}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Todos List */}
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="text-center py-12">
              <Circle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No tasks yet</p>
              <p className="text-slate-500 text-sm">
                {canEdit ? 'Create your first task to get started' : 'No tasks have been added to this project'}
              </p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo._id}
                className={`p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 transition-all duration-200 ${
                  todo.isCompleted ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => canEdit && handleToggleTodo(todo._id, todo.isCompleted)}
                    className={`mt-1 transition-colors ${canEdit ? 'hover:scale-110' : 'cursor-default'}`}
                    disabled={!canEdit}
                  >
                    {todo.isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h3 className={`font-medium ${todo.isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {todo.task}
                    </h3>
                    {todo.description && (
                      <p className="text-slate-400 text-sm mt-1">{todo.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(todo.priority)}`}>
                        <Flag className="w-3 h-3 inline mr-1" />
                        {todo.priority}
                      </span>
                      
                      {todo.dueDate && (
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(todo.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {canEdit && (
                    <button
                      onClick={() => handleDeleteTodo(todo._id)}
                      className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectTodos;