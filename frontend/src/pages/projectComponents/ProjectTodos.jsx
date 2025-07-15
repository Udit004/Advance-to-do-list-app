import { toast } from "react-hot-toast";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Target,
  Star,
  Plus,
  Circle,
  CheckCircle,
  Flag,
  Calendar,
  Edit3,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/config";

const ProjectTodos = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editTodoId, setEditTodoId] = useState(null);

  // Memoize form states to prevent unnecessary re-renders
  const [newTodo, setNewTodo] = useState({
    task: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });

  const [editTodoData, setEditTodoData] = useState({
    task: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });

  // Memoize calculated values
  const completionPercentage = useMemo(() => {
    if (todos.length === 0) return 0;
    const completed = todos.filter((todo) => todo.isCompleted).length;
    return Math.round((completed / todos.length) * 100);
  }, [todos]);

  const canEdit = useMemo(() => {
    return (
      project && (project.userRole === "owner" || project.userRole === "editor")
    );
  }, [project]);

  // Optimize fetchProjectData with useCallback to prevent unnecessary re-renders
  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.get(`/projects/${projectId}`);
      const projectData = response.data.data;
      setProject(projectData);
      setTodos(projectData.todos || []);
    } catch (error) {
      console.error("Error fetching project:", error);
      if (error.response?.status === 403) {
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Define cancelEditTodo before using it in other functions
  const cancelEditTodo = useCallback(() => {
    setEditTodoId(null);
    setEditTodoData({
      task: "",
      description: "",
      priority: "medium",
      dueDate: "",
    });
  }, []);

  // Optimize todo creation with better error handling
  const handleCreateTodo = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newTodo.task.trim() || creating) return;

      setCreating(true);
      const loadingToast = toast.loading("Creating task...");

      try {
        const todoPayload = {
          task: newTodo.task,
          description: newTodo.description,
          priority: newTodo.priority,
          dueDate: newTodo.dueDate,
          user: currentUser.uid,
          list: "general",
        };

        const todoResponse = await API.post("/todos/create", todoPayload);
        const createdTodo = todoResponse.data;

        if (!createdTodo._id && !createdTodo.id) {
          throw new Error("No todo ID returned from server");
        }

        const todoId = createdTodo._id || createdTodo.id;
        const newTodoItem = {
          ...createdTodo,
          _id: todoId,
        };

        // Optimistically update UI
        setTodos((prev) => [...prev, newTodoItem]);

        // Reset form
        setNewTodo({
          task: "",
          description: "",
          priority: "medium",
          dueDate: "",
        });
        setShowCreateForm(false);

        toast.success("Task created successfully!", { id: loadingToast });

        // Add to project (can fail silently)
        try {
          await API.post(`/projects/${projectId}/todos`, { todoId });
        } catch (projectError) {
          console.error("Error adding todo to project:", projectError);
        }
      } catch (error) {
        console.error("Error creating todo:", error);
        toast.error("Failed to create task. Please try again.", {
          id: loadingToast,
        });
      } finally {
        setCreating(false);
      }
    },
    [newTodo, creating, currentUser.uid, projectId]
  );

const handleToggleTodo = useCallback(
  async (todoId) => {
    try {
      const todo = todos.find((t) => t._id === todoId);
      if (!todo) return;

      const newStatus = !todo.isCompleted;

      // Optimistically update UI
      setTodos((prev) =>
        prev.map((todo) =>
          todo._id === todoId ? { ...todo, isCompleted: newStatus } : todo
        )
      );

      // Make API call with explicit headers
      await API.patch(`/todos/toggle/${todoId}`, 
        { isCompleted: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      toast.success(
        newStatus ? "Task marked as complete!" : "Task marked as incomplete!",
        {
          icon: newStatus ? "✅" : "⏳",
          duration: 2000,
        }
      );
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update task status");

      // Revert on error
      const originalTodo = todos.find((t) => t._id === todoId);
      if (originalTodo) {
        setTodos((prev) =>
          prev.map((todo) =>
            todo._id === todoId
              ? { ...todo, isCompleted: originalTodo.isCompleted }
              : todo
          )
        );
      }
    }
  },
  [todos]
);

  const handleDeleteTodo = useCallback(
    async (todoId) => {
      // if (
      //   !window.confirm(
      //     "Are you sure you want to remove this todo from the project?"
      //   )
      // )
      //   return;

      try {
        const todoToDelete = todos.find((t) => t._id === todoId);

        // Optimistically update UI
        setTodos((prev) => prev.filter((todo) => todo._id !== todoId));

        // Make API call
        await API.delete(`/projects/${projectId}/todos/${todoId}`);

        toast.success(`Task "${todoToDelete?.task}" removed from project`, {
          icon: "🗑️",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error deleting todo:", error);
        toast.error("Failed to remove task from project");

        // Revert on error
        setTodos((prev) => [...prev, todoToDelete]);
      }
    },
    [todos, projectId]
  );

  const handleUpdateTodo = useCallback(
    async (e) => {
      e.preventDefault();
      if (!editTodoData.task.trim()) return;

      const loadingToast = toast.loading("Updating task...");

      try {
        const originalTodos = todos;

        // Optimistically update UI
        setTodos((prev) =>
          prev.map((todo) =>
            todo._id === editTodoId ? { ...todo, ...editTodoData } : todo
          )
        );

        // Make API call
        await API.put(`/todos/update/${editTodoId}`, editTodoData);

        toast.success("Task updated successfully!", { id: loadingToast });
        cancelEditTodo();
      } catch (error) {
        console.error("Error updating todo:", error);
        toast.error("Failed to update task", { id: loadingToast });

        // Revert on error
        setTodos(originalTodos);
        cancelEditTodo();
      }
    },
    [editTodoData, editTodoId, todos, cancelEditTodo]
  );

  // Memoize priority color function
  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case "high":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "low":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  }, []);

  // Memoize date formatting
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  }, []);

  // Start edit functionality
  const startEditTodo = useCallback((todo) => {
    setEditTodoId(todo._id);
    setEditTodoData({
      task: todo.task,
      description: todo.description || "",
      priority: todo.priority || "medium",
      dueDate: todo.dueDate ? todo.dueDate.slice(0, 10) : "",
    });
    setShowCreateForm(false);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-32 w-32 border-4 border-blue-500 border-t-transparent"
        />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            Project Not Found
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/TodoDashboard")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
          >
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/TodoDashboard")}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-400" />
            </motion.button>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
              >
                {project.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-slate-400"
              >
                {project.description}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4 mt-2"
              >
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {todos.length} tasks • {completionPercentage}% complete
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs border ${
                    project.userRole === "owner"
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "bg-green-500/20 text-green-400 border-green-500/30"
                  }`}
                >
                  <Star className="w-3 h-3 inline mr-1" />
                  {project.userRole}
                </span>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2"
          >
            {canEdit && (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </motion.button>
            )}
          </motion.div>
        </motion.div>

        {/* Create Todo Form Modal */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  Create New Task
                </h3>

                <form onSubmit={handleCreateTodo} className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      value={newTodo.task}
                      onChange={(e) =>
                        setNewTodo({ ...newTodo, task: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      placeholder="Enter task title"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={newTodo.description}
                      onChange={(e) =>
                        setNewTodo({ ...newTodo, description: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
                      placeholder="Enter task description"
                      rows={3}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">
                        Priority
                      </label>
                      <select
                        value={newTodo.priority}
                        onChange={(e) =>
                          setNewTodo({ ...newTodo, priority: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
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
                        onChange={(e) =>
                          setNewTodo({ ...newTodo, dueDate: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-2 pt-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={creating}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {creating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Create Task"
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </motion.button>
                  </motion.div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        {todos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 p-4 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                Progress
              </span>
              <span className="text-slate-300 text-sm">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full relative"
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Todos List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {todos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Circle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              </motion.div>
              <p className="text-slate-400 text-lg mb-2">No tasks yet</p>
              <p className="text-slate-500 text-sm">
                {canEdit
                  ? "Create your first task to get started"
                  : "No tasks have been added to this project"}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {todos.map((todo) => (
                <motion.div
                  key={todo._id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
                  layout
                  className={`p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 transition-all duration-200 hover:bg-slate-800/70 hover:border-slate-600/50 ${
                    todo.isCompleted ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => canEdit && handleToggleTodo(todo._id)}
                      className={`mt-1 transition-colors ${
                        canEdit ? "hover:scale-110" : "cursor-default"
                      }`}
                      disabled={!canEdit}
                    >
                      <AnimatePresence mode="wait">
                        {todo.isCompleted ? (
                          <motion.div
                            key="completed"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                            }}
                          >
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="incomplete"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                            }}
                          >
                            <Circle className="w-5 h-5 text-slate-400" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <div className="flex-1">
                      {editTodoId === todo._id ? (
                        <motion.form
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onSubmit={handleUpdateTodo}
                          className="space-y-2"
                        >
                          <input
                            type="text"
                            value={editTodoData.task}
                            onChange={(e) =>
                              setEditTodoData({
                                ...editTodoData,
                                task: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                            required
                          />
                          <textarea
                            value={editTodoData.description}
                            onChange={(e) =>
                              setEditTodoData({
                                ...editTodoData,
                                description: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <select
                              value={editTodoData.priority}
                              onChange={(e) =>
                                setEditTodoData({
                                  ...editTodoData,
                                  priority: e.target.value,
                                })
                              }
                              className="px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                            <input
                              type="date"
                              value={editTodoData.dueDate}
                              onChange={(e) =>
                                setEditTodoData({
                                  ...editTodoData,
                                  dueDate: e.target.value,
                                })
                              }
                              className="px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                            />
                          </div>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="submit"
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                            >
                              Save
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={cancelEditTodo}
                              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                            >
                              Cancel
                            </motion.button>
                          </div>
                        </motion.form>
                      ) : (
                        <>
                          <h3
                            className={`font-medium transition-all duration-200 ${
                              todo.isCompleted
                                ? "text-slate-500 line-through"
                                : "text-white"
                            }`}
                          >
                            {todo.task}
                          </h3>
                          {todo.description && (
                            <p className="text-slate-400 text-sm mt-1">
                              {todo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs border ${getPriorityColor(
                                todo.priority
                              )}`}
                            >
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
                        </>
                      )}
                    </div>

                    {canEdit && (
                      <div className="flex flex-col gap-1">
                        <motion.button
                          whileHover={{
                            scale: 1.1,
                            backgroundColor: "rgba(59, 130, 246, 0.2)",
                          }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => startEditTodo(todo)}
                          className="p-2 rounded-lg transition-all duration-200 text-blue-400"
                          disabled={editTodoId === todo._id}
                        >
                          <Edit3 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{
                            scale: 1.1,
                            backgroundColor: "rgba(239, 68, 68, 0.2)",
                          }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteTodo(todo._id)}
                          className="p-2 rounded-lg transition-all duration-200 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProjectTodos;
