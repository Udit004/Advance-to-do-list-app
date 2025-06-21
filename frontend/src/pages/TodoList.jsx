import React, { useState, useEffect, useContext } from "react";
import API from "../api/config";

import AuthContext from "../context/AuthContext";

const TodoList = () => {
  const { currentUser } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [editingTodo, setEditingTodo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [predictedPriority, setPredictedPriority] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const [formData, setFormData] = useState({
    task: "",
    description: "",
    dueDate: "",
    priority: "",
    list: "",
  });

  // Predict Priority using Flask ML Model (mock for demo)
  const predictPriority = async (task, description) => {
    try {
      setIsPredicting(true);
      
      const mlModelUrl = import.meta.env.MODE === 'development' 
        ? "http://127.0.0.1:5000/predict" 
          : "https://advance-to-do-list-app-priority-ml-model.onrender.com/predict";
      const response = await API.post(mlModelUrl, { task, description });
      const predicted = response.data.priority;
      
      setPredictedPriority(predicted);
      return predicted;
    } catch (error) {
      console.error("Priority prediction error:", error);
      setPredictedPriority("low");
      return "low";
    } finally {
      setIsPredicting(false);
    }
  };

  // Auto-trigger prediction when task or description changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (formData.task || formData.description) {
        predictPriority(formData.task, formData.description);
      }
    }, 700);
    return () => clearTimeout(debounce);
  }, [formData.task, formData.description]);

  // Remove the API fetch useEffect for demo - Replace with actual API call
  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentUser || !currentUser.uid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await API.get(`/todos/${currentUser.uid}`);
        setTasks(response.data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [currentUser]);

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
      let taskPriority = formData.priority;

      // Use predicted if none selected manually
      if (!taskPriority) {
        taskPriority = predictedPriority || "low";
      }

      taskPriority = taskPriority.toLowerCase();

      const taskPayload = {
        ...formData,
        user: currentUser?.uid,
        priority: taskPriority,
        isCompleted: editingTodo ? editingTodo.isCompleted : false
      };

      if (editingTodo) {
        const response = await API.put(`/todos/update/${editingTodo._id}`, taskPayload);
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task._id === editingTodo._id ? response.data : task
          )
        );
        setEditingTodo(null);
      } else {
        const response = await API.post('/todos/create', taskPayload);
        setTasks((prev) => [...prev, response.data]);
      }

      setFormData({
        task: "",
        description: "",
        dueDate: "",
        priority: "",
        list: "",
      });
      setPredictedPriority("");
    } catch (error) {
      console.error("Error creating/updating todo:", error);
    }
  };

  const handleEditClick = (task) => {
    setEditingTodo(task);
    setFormData({
      task: task.task,
      description: task.description,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 16)
        : "",
      priority: task.priority,
      list: task.list,
    });
    setPredictedPriority(task.priority);
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/todos/delete/${id}`);
      setTasks((prev) => prev.filter((task) => task._id !== id));
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const handleToggleComplete = async (id, isChecked) => {
    try {
      const response = await API.patch(`/todos/toggle/${id}`, { isCompleted: isChecked });
      setTasks((prev) =>
        prev.map((task) =>
          task._id === id ? response.data : task
        )
      );
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.isCompleted).length;
  const progressPercentage =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const isDueToday = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return today.getTime() === due.getTime();
  };

  const filteredTasks = tasks.filter((task) => {
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

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high": return "🔴";
      case "medium": return "🟡";
      case "low": return "🟢";
      default: return "⚪";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "work": return "💼";
      case "groceries": return "🛒";
      case "house": return "🏠";
      case "education": return "📚";
      case "general": return "📝";
      default: return "📋";
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading your tasks...</p>
        </div>
      </div>
    );

  if (!currentUser)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-red-400 text-xl font-medium">Please log in to continue</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
            AI-Powered Todo List
          </h1>
          <p className="text-slate-400 text-lg">Intelligent task management with ML-powered priority prediction</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-300 font-medium">Progress</span>
            <span className="text-purple-400 font-semibold">
              {completedTasks} of {totalTasks} tasks ({Math.round(progressPercentage)}%)
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="text-slate-400 text-xl">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Add/Edit Task Form */}
        <div className="mb-8 p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
            {editingTodo ? "✏️ Edit Task" : "➕ Add New Task"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-slate-300 font-medium mb-2">Task Title</label>
              <input
                name="task"
                value={formData.task}
                onChange={handleChange}
                placeholder="What needs to be done?"
                required
                className="w-full p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-slate-300 font-medium mb-2">Due Date</label>
              <input
                name="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={handleChange}
                required
                className="w-full p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-slate-300 font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add more details about your task..."
              required
              rows="3"
              className="w-full p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 resize-none"
            ></textarea>
          </div>

          {/* AI Prediction Section */}
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🤖</span>
              <label className="text-purple-300 font-semibold text-lg">AI Priority Prediction</label>
            </div>
            
            <div className="flex items-center gap-4">
              {isPredicting ? (
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg flex-1">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-400 border-t-transparent"></div>
                  <span className="text-slate-300">Analyzing task...</span>
                </div>
              ) : (
                <div className={`flex items-center gap-3 p-3 rounded-lg font-semibold text-white flex-1 ${
                  predictedPriority === "high" 
                    ? "bg-gradient-to-r from-red-600 to-red-500" 
                    : predictedPriority === "medium" 
                    ? "bg-gradient-to-r from-yellow-600 to-yellow-500" 
                    : "bg-gradient-to-r from-green-600 to-green-500"
                }`}>
                  <span className="text-xl">{getPriorityIcon(predictedPriority)}</span>
                  <span>{predictedPriority ? `${predictedPriority.charAt(0).toUpperCase() + predictedPriority.slice(1)} Priority` : "Enter task details for prediction"}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-slate-300 font-medium mb-2">Override Priority (optional)</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
              >
                <option value="">🤖 Use AI Prediction</option>
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">Category</label>
              <select
                name="list"
                value={formData.list}
                onChange={handleChange}
                required
                className="w-full p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
              >
                <option value="" disabled>Select category</option>
                <option value="general">📝 General</option>
                <option value="work">💼 Work</option>
                <option value="groceries">🛒 Groceries</option>
                <option value="house">🏠 House</option>
                <option value="education">📚 Education</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            {editingTodo ? "Update Task" : "Create Task"}
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          {[
            { key: "all", label: "All Tasks", icon: "📋" },
            { key: "pending", label: "Pending", icon: "⏳" },
            { key: "completed", label: "Completed", icon: "✅" }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                filter === f.key 
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105" 
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50"
              }`}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-xl font-medium">No tasks found</p>
              <p className="text-slate-500">Create your first task to get started!</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task._id}
                className={`group p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border transition-all duration-300 hover:bg-slate-800/70 hover:transform hover:scale-[1.02] ${
                  task.isCompleted 
                    ? "border-green-500/30 bg-green-900/10" 
                    : task.priority === "high"
                    ? "border-red-500/50 shadow-red-500/10 shadow-lg"
                    : task.priority === "medium"
                    ? "border-yellow-500/50 shadow-yellow-500/10 shadow-lg"
                    : "border-green-500/50 shadow-green-500/10 shadow-lg"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getCategoryIcon(task.list)}</span>
                      <h3 className={`text-xl font-semibold ${
                        task.isCompleted ? "text-green-400 line-through" : "text-white"
                      } ${isDueToday(task.dueDate) ? "text-yellow-400" : ""}`}>
                        {task.task}
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        task.priority === "high" 
                          ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                          : task.priority === "medium" 
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
                          : "bg-green-500/20 text-green-400 border border-green-500/30"
                      }`}>
                        {getPriorityIcon(task.priority)} {task.priority.toUpperCase()}
                      </div>
                    </div>
                    
                    <p className="text-slate-300 mb-3 leading-relaxed">{task.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>⏰</span>
                        <span>Due: {new Date(task.dueDate).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🏷️</span>
                        <span className="capitalize">{task.list}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 ml-6">
                    <label className="flex items-center gap-2 cursor-pointer group-hover:scale-110 transition-transform">
                      <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={(e) => handleToggleComplete(task._id, e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-slate-500 checked:bg-green-500 checked:border-green-500 transition-colors"
                      />
                      <span className="text-slate-300 font-medium">Complete</span>
                    </label>
                    
                    <button
                      onClick={() => handleEditClick(task)}
                      className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors font-medium border border-blue-500/30"
                    >
                      ✏️ Edit
                    </button>
                    
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors font-medium border border-red-500/30"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoList;