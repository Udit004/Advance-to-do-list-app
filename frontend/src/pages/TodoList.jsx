import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import API from "../api/config";



const TodoList = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [editingTodo, setEditingTodo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    task: "",
    description: "",
    dueDate: "",
    priority: "",
    list: ""
  });

  useEffect(() => {
    const fetchTodos = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await API.get(`/todos/${currentUser.uid}?excludeProjectTodos=true`);
        setTasks(response.data);
      } catch (error) {
        console.error("Error fetching todos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTodos();
  }, [currentUser]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.isCompleted).length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isdueToday = (taskDueDate) => {
    if (!taskDueDate) return false;
    const today = new Date();
    const due = new Date(taskDueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return today.getTime() === due.getTime();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="text-white text-lg">Loading your tasks...</span>
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
          <p className="text-slate-300 mb-6">Please log in to access your tasks.</p>
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

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = () => {
      if (filter === "completed") {
        return task.isCompleted;
      } else if (filter === "pending") {
        return !task.isCompleted;
      } else {
        return true; // 'all' filter
      }
    };
    const matchesSearch = () => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return (
        task.task.toLowerCase().includes(lowerCaseSearchTerm) ||
        task.description.toLowerCase().includes(lowerCaseSearchTerm) ||
        task.list.toLowerCase().includes(lowerCaseSearchTerm)
      );
    };
    return matchesFilter() && matchesSearch();
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData);
    try {
      if (editingTodo) {
        const response = await API.put(
          `/todolist/update/${editingTodo._id}`,
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
        console.log("Todo updated successfully", response.data);
        console.log("Response from update:", response);
      } else {
        const response = await API.post("/todolist/create", {
          ...formData,
          user: currentUser?.uid,
        });
        setTasks((prevTasks) => [...prevTasks, response.data.data]);
        console.log("Todo created successfully", response.data);
        console.log("Response from create:", response);
      }
      setFormData({
        task: "",
        description: "",
        dueDate: "",
        priority: "",
        list: "",
      });
    } catch (error) {
      console.error("Error creating todo:", error);
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
  };

  const handleDelete = async (id) => {
    try {
      const DeleteTodo = await API.delete(`/todolist/delete/${id}`);
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== id));
      console.log("Todo deleted successfully", DeleteTodo);
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const handleToggleComplete = async (id, isChecked) => {
    try {
      const response = await API.patch(`/todolist/toggle/${id}`, {
        isCompleted: isChecked,
      });
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === id ? { ...task, isCompleted: isChecked } : task
        )
      );
      console.log("Todo toggled successfully", response);
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {/* Ambient lighting effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Todo Section */}
        <section className="mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
            <h1 className="text-3xl font-bold text-center mb-8">
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Create Todo Task
              </span>
            </h1>
            
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
              autoComplete="off"
            >
              {/* Task Input */}
              <div>
                <label
                  htmlFor="task"
                  className="block text-sm font-semibold mb-2 text-slate-300"
                >
                  Task<span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  id="task"
                  name="task"
                  type="text"
                  value={formData.task}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your task"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold mb-2 text-slate-300"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Add a detailed description of your task"
                  required
                />
              </div>

              {/* Form Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Due Date */}
                <div>
                  <label
                    htmlFor="dueDate"
                    className="block text-sm font-semibold mb-2 text-slate-300"
                  >
                    Due Date<span className="text-red-400 ml-1">*</span>
                  </label>
                  <input
                    id="dueDate"
                    name="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all duration-200 [color-scheme:dark]"
                    required
                  />
                </div>

                {/* Priority */}
                <div>
                  <label
                    htmlFor="priority"
                    className="block text-sm font-semibold mb-2 text-slate-300"
                  >
                    Priority<span className="text-red-400 ml-1">*</span>
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="" disabled className="bg-slate-800">
                      Select priority
                    </option>
                    <option value="low" className="bg-slate-800">
                      Low
                    </option>
                    <option value="medium" className="bg-slate-800">
                      Medium
                    </option>
                    <option value="high" className="bg-slate-800">
                      High
                    </option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="list"
                    className="block text-sm font-semibold mb-2 text-slate-300"
                  >
                    Category
                  </label>
                  <select
                    id="list"
                    name="list"
                    value={formData.list}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all duration-200"
                  >
                    <option value="" disabled className="bg-slate-800">
                      Select category
                    </option>
                    <option value="general" className="bg-slate-800">
                      General
                    </option>
                    <option value="groceries" className="bg-slate-800">
                      Groceries
                    </option>
                    <option value="work" className="bg-slate-800">
                      Work
                    </option>
                    <option value="house" className="bg-slate-800">
                      House
                    </option>
                    <option value="education" className="bg-slate-800">
                      Education
                    </option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3 font-semibold rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 text-slate-900 hover:from-orange-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-orange-500/25"
                >
                  {editingTodo ? "Update Task" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

        {/* Tasks Display Section */}
        <section>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
            <h2 className="text-3xl font-bold text-center mb-8">
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Your Tasks
              </span>
            </h2>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              {/* Filter Buttons */}
              <div className="flex gap-3">
                {['all', 'completed', 'pending'].map((filterType) => (
                  <button
                    key={filterType}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      filter === filterType
                        ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-slate-900"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50"
                    }`}
                    onClick={() => setFilter(filterType)}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by title, category, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Progress Section */}
            <div className="mb-8 p-6 bg-slate-700/30 rounded-xl border border-slate-600/50">
              <h3 className="text-xl font-bold text-white mb-3">
                Task Progress
              </h3>
              <p className="text-slate-300 mb-4">
                {completedTasks} of {totalTasks} tasks completed
              </p>
              <div className="w-full bg-slate-600/50 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-3 rounded-full text-xs flex items-center justify-center text-white font-bold transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {progressPercentage > 15 && `${Math.round(progressPercentage)}%`}
                </div>
              </div>
            </div>

            {/* Tasks List */}
            
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-lg">No tasks found</p>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`p-6 rounded-xl backdrop-blur-sm border transition-all duration-200 hover:scale-[1.01] ${
                      isdueToday(task.dueDate)
                        ? "bg-red-900/30 border-red-500/50 shadow-lg shadow-red-500/10"
                        : "bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/40"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <input
                            type="checkbox"
                            checked={task.isCompleted}
                            onChange={(e) =>
                              handleToggleComplete(task._id, e.target.checked)
                            }
                            className="w-5 h-5 rounded border-slate-400 bg-slate-700/50 checked:bg-green-500 checked:border-transparent focus:ring-green-500 focus:ring-offset-0 transition-all duration-200"
                          />
                          <h3 className={`text-xl font-semibold ${
                            task.isCompleted ? "text-slate-400 line-through" : "text-white"
                          }`}>
                            {task.task}
                          </h3>
                        </div>
                        
                        <p className="text-slate-300 mb-4 leading-relaxed">
                          {task.description}
                        </p>
                        
                        {/* Task Meta */}
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                            'bg-green-500/20 text-green-300 border border-green-500/30'
                          }`}>
                            {task.priority?.toUpperCase()}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium">
                            {task.list?.toUpperCase()}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-slate-600/50 text-slate-300 border border-slate-500/30 text-xs font-medium">
                            Due: {new Date(task.dueDate).toLocaleDateString("en-GB")} {" "}
                            {new Date(task.dueDate).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isdueToday(task.dueDate) && (
                            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-medium animate-pulse">
                              DUE TODAY
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 md:flex-col">
                        <button
                          onClick={() => handleEditClick(task)}
                          className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 transition-all duration-200 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all duration-200 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            
          
        </div>
      </section>
    </div>
  );
};
export default TodoList;
