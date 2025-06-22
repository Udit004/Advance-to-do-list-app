import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Sparkles, Plus, RotateCcw, X, Calendar, Flag, Folder, CheckCircle, AlertTriangle, Search, Filter, Trash2, Clock, BarChart3 } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API from '../api/config';

const AICreator = () => {
  const { currentUser } = useContext(AuthContext);
  
  // AI Creator States
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedTask, setGeneratedTask] = useState(null);
  const [error, setError] = useState('');
  
  // Todo List States
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [todoLoading, setTodoLoading] = useState(false);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    if (!currentUser || !currentUser.uid) {
      setTodoLoading(false);
      return;
    }
    
    try {
      setTodoLoading(true);
      const response = await API.get(`/todos/${currentUser.uid}`);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setTodoLoading(false);
    }
  }, [currentUser]);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // AI Task Generation
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!prompt.trim()) {
      setError('Please enter a prompt to generate a task.');
      return;
    }
  
    setLoading(true);
    setError('');
    setGeneratedTask(null);
  
    try {
      // Call your backend using axios instance (API)
      const response = await API.post('/ai', { prompt: prompt.trim() });
  
      if (response?.data) {
        setGeneratedTask(response.data);
        setPrompt('');
      } else {
        throw new Error('Invalid response from AI service');
      }
    } catch (err) {
      console.error('AI Creator Error:', err);
      setError(
        err.response?.data?.error ||
        err.message ||
        'Failed to generate task. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };
  

  // Add generated task to todo list
  const handleAddToTodoList = async () => {
    if (!generatedTask || !currentUser?.uid) return;
  
    try {
      // Map AI's category to your schema's list enum
      const categoryMap = {
        personal: 'general',
        work: 'work',
        college: 'education',
        other: 'general'
      };
  
      const mappedCategory = categoryMap[generatedTask.category?.toLowerCase()] || 'general';
  
      const taskData = {
        task: generatedTask.title,
        description: generatedTask.description || '',
        dueDate: generatedTask.dueDate || '',
        priority: ['low', 'medium', 'high'].includes(generatedTask.priority?.toLowerCase())
          ? generatedTask.priority.toLowerCase()
          : 'medium',
        list: mappedCategory,
        user: currentUser.uid,
        isCompleted: false
      };
  
      const response = await API.post('/todos/create', taskData);
      setTasks(prevTasks => [...prevTasks, response.data]);
      setGeneratedTask(null);
      setError('');
    } catch (error) {
      console.error("Error adding task to todo list:", error);
      setError("Failed to add task to todo list. Please try again.");
    }
  };
  
  // Todo List Functions
  const handleToggleComplete = useCallback(async (id, isChecked) => {
    try {
      const response = await API.patch(`/todos/toggle/${id}`, { isCompleted: isChecked });
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === id ? response.data : task
        )
      );
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await API.delete(`/todos/delete/${id}`);
      setTasks(prevTasks => prevTasks.filter(task => task._id !== id));
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  }, []);

  // Utility Functions
  const formatDueDate = (dateString) => {
    if (!dateString) return 'No due date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.log(err);
      return 'Invalid date';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'work': return '💼';
      case 'personal': return '👤';
      case 'college': return '🎓';
      case 'other': return '📝';
      default: return '📋';
    }
  };

  // Computed values
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const term = searchTerm.toLowerCase();
    
    const matchFilter =
      filter === "completed"
        ? task.isCompleted
        : filter === "pending"
        ? !task.isCompleted
        : true;
    
    const matchSearch =
      (task.task && task.task.toLowerCase().includes(term)) ||
      (task.description && task.description.toLowerCase().includes(term)) ||
      (task.list && task.list.toLowerCase().includes(term));

    return matchFilter && matchSearch;
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-red-400 text-xl font-medium">Please log in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-purple-400 mr-3 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              AI Task Creator
            </h1>
            <Sparkles className="w-8 h-8 text-purple-400 ml-3 animate-pulse" />
          </div>
          <p className="text-slate-400 text-lg italic font-light max-w-2xl mx-auto">
            "Speak your task into the ether, and let the AI write it in time."
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Left Column - AI Creator */}
          <div className="space-y-6">
            {/* AI Input Section */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 hover:border-slate-600 transition-all duration-300">
              <div className="space-y-6">
                <div>
                  <label htmlFor="promptTextarea" className="block text-lg font-semibold text-slate-200 mb-3">
                    Describe Your Task
                  </label>
                  <textarea
                    id="promptTextarea"
                    className="w-full h-32 p-4 bg-slate-700/50 border border-slate-600 rounded-xl resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 text-slate-200 placeholder-slate-400"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Example: Remind me to submit my assignment by tomorrow evening at 6 PM. It's for my computer science class and it's really important."
                    disabled={loading}
                  />
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={loading || !prompt.trim()}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform ${
                    loading || !prompt.trim()
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 active:scale-95'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Generating Task...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Task
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/30 p-4 rounded-xl">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-300">Error</h3>
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                  <button
                    onClick={() => setError('')}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Generated Task Preview */}
            {generatedTask && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-6 h-6 text-white mr-3" />
                      <h3 className="text-xl font-bold text-white">Generated Task Preview</h3>
                    </div>
                    <button
                      onClick={() => setGeneratedTask(null)}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold text-slate-200 mb-2">
                      {generatedTask.title}
                    </h4>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wide">
                      Description
                    </h5>
                    <p className="text-slate-300 leading-relaxed">
                      {generatedTask.description || 'No description provided'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                        <h6 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                          Due Date
                        </h6>
                      </div>
                      <p className="text-sm font-semibold text-slate-200">
                        {formatDueDate(generatedTask.dueDate)}
                      </p>
                    </div>
                    
                    <div className="bg-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <Flag className="w-4 h-4 text-slate-400 mr-2" />
                        <h6 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                          Priority
                        </h6>
                      </div>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(generatedTask.priority)}`}>
                        {generatedTask.priority?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    
                    <div className="bg-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <Folder className="w-4 h-4 text-slate-400 mr-2" />
                        <h6 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                          Category
                        </h6>
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getCategoryIcon(generatedTask.category)}</span>
                        <span className="text-sm font-semibold text-slate-200">
                          {generatedTask.category?.charAt(0).toUpperCase() + generatedTask.category?.slice(1) || 'Other'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={() => setGeneratedTask(null)}
                      className="flex-1 sm:flex-none px-6 py-3 border border-slate-600 text-slate-300 rounded-xl font-medium hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-200 flex items-center justify-center"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Generate Another
                    </button>
                    <button
                      onClick={handleAddToTodoList}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Todo List
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Todo List */}
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 text-purple-400 mr-2" />
                  <h3 className="text-lg font-semibold text-slate-200">Progress</h3>
                </div>
                <span className="text-sm text-slate-400">
                  {completedTasks}/{totalTasks} completed
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-slate-400">
                {progressPercentage.toFixed(0)}% of tasks completed
              </p>
            </div>

            {/* Search and Filter */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <div className="flex space-x-2">
                    {['all', 'pending', 'completed'].map((filterType) => (
                      <button
                        key={filterType}
                        onClick={() => setFilter(filterType)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                          filter === filterType
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                        }`}
                      >
                        {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks List */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-purple-400 mr-2" />
                Your Tasks
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {todoLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="text-slate-400">
                      {searchTerm ? 'No tasks match your search' : 'No tasks found'}
                    </p>
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <div key={task._id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 hover:border-slate-500 transition-all duration-200">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={task.isCompleted}
                          onChange={(e) => handleToggleComplete(task._id, e.target.checked)}
                          className="mt-1 w-4 h-4 text-purple-600 bg-slate-700 border-slate-500 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {task.task}
                          </h4>
                          {task.description && (
                            <p className={`text-xs mt-1 ${task.isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center mt-2 space-x-2">
                            {task.dueDate && (
                              <div className="flex items-center text-xs text-slate-400">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDueDate(task.dueDate)}
                              </div>
                            )}
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                              {task.priority?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDelete(task._id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-2xl p-8 text-center shadow-2xl border border-slate-700">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-slate-200">AI is crafting your perfect task...</p>
              <p className="text-sm text-slate-400 mt-2">This may take a moment</p>
            </div>
          </div>
        )}

      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

export default AICreator;