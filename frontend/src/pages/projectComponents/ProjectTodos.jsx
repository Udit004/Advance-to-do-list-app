import { toast } from "react-hot-toast";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useSocket from "../../hooks/useSocket";
import { ArrowLeft, Target, Star, Plus, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/config";

// Import modular components from TodoList
import LoadingSpinner from "../todoComponents/LoadingSpinner";
import EmptyState from "../todoComponents/EmptyState";
import SearchInput from "../todoComponents/SearchInput";
import ProgressBar from "../todoComponents/ProgressBar";
import TodoFilters from "../todoComponents/TodoFilters";
import TodoForm from "../todoComponents/TodoForm";
import TodoItem from "../todoComponents/TodoItem";

const ProjectTodos = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const socket = useSocket(currentUser?.uid);
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  
  // New state for form visibility
  const [showForm, setShowForm] = useState(false);

  // Filter and search states (matching TodoList)
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [activeUsers, setActiveUsers] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

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

  // Filter todos based on search term and filter (matching TodoList logic)
  const filteredTodos = useMemo(() => {
    return todos.filter(task => {
      const term = searchTerm.toLowerCase();
      
      // Filter by completion status
      const matchFilter =
        filter === "completed"
          ? task.isCompleted
          : filter === "pending"
          ? !task.isCompleted
          : true;
      
      // Filter by search term
      const matchSearch =
        (task.task && task.task.toLowerCase().includes(term)) ||
        (task.description && task.description.toLowerCase().includes(term)) ||
        (task.list && task.list.toLowerCase().includes(term));

      return matchFilter && matchSearch;
    });
  }, [todos, searchTerm, filter]);

  // Computed values for components
  const totalTasks = todos.length;
  const completedTasks = todos.filter(task => task.isCompleted).length;

  // Toggle form visibility
  const toggleForm = useCallback(() => {
    setShowForm(prev => !prev);
    // Reset editing state when hiding form
    if (showForm) {
      setEditingTodo(null);
    }
  }, [showForm]);

  // Handle new task button click
  const handleNewTaskClick = useCallback(() => {
    if (!canEdit) {
      toast.error("You don't have permission to create tasks in this project");
      return;
    }
    setEditingTodo(null); // Ensure we're in create mode
    setShowForm(true);
  }, [canEdit]);

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

  useEffect(() => {
    if (!socket.isConnected || !project || !currentUser?.uid) return;
  
    console.log("🔧 Setting up project socket listeners for:", projectId);
    
    // Join project room
    socket.emit("joinProject", {
      projectId,
      userId: currentUser.uid,
      userInfo: {
        username: currentUser.displayName || currentUser.email || "Anonymous",
        email: currentUser.email,
        role: project.userRole || "viewer"
      }
    });
  
    // Listen for successful project join
    socket.on("projectJoined", (data) => {
      console.log("✅ Successfully joined project room:", data);
      setActiveUsers(data.activeUsers || []);
      setSocketConnected(true);
    });
  
    // Listen for other users joining
    socket.on("userJoinedProject", (data) => {
      console.log("👋 User joined project:", data.user);
      setActiveUsers(data.activeUsers || []);
    });
  
    // Listen for users leaving
    socket.on("userLeftProject", (data) => {
      console.log("👋 User left project:", data.userId);
      setActiveUsers(data.activeUsers || []);
    });
  
    // Listen for real-time todo events
    socket.on("todoCreated", (data) => {
      console.log("🆕 Todo created via socket:", data.todo);
      if (data.projectId === projectId && data.todo.user !== currentUser.uid) {
        setTodos((prev) => {
          // Check if todo already exists to prevent duplicates
          const exists = prev.find((todo) => todo._id === data.todo._id);
          if (!exists) {
            return [data.todo, ...prev];
          }
          return prev;
        });
        toast.success(`New task added by ${data.todo.createdBy || 'another user'}`, {
          icon: "✨",
          duration: 3000,
        });
      }
    });
  
    socket.on("todoUpdated", (data) => {
      console.log("📝 Todo updated via socket:", data.todo);
      if (data.projectId === projectId && data.todo.user !== currentUser.uid) {
        setTodos((prev) =>
          prev.map((todo) =>
            todo._id === data.todo._id ? { ...todo, ...data.todo } : todo
          )
        );
        toast.success("Task updated by another user", {
          icon: "🔄",
          duration: 2000,
        });
      }
    });
  
    socket.on("todoDeleted", (data) => {
      console.log("🗑️ Todo deleted via socket:", data.todoId);
      if (data.projectId === projectId) {
        setTodos((prev) => prev.filter((todo) => todo._id !== data.todoId));
        toast.success("Task removed by another user", {
          icon: "🗑️",
          duration: 2000,
        });
      }
    });
  
    socket.on("todoToggled", (data) => {
      console.log("✅ Todo toggled via socket:", data);
      if (data.projectId === projectId) {
        setTodos((prev) =>
          prev.map((todo) =>
            todo._id === data.todoId
              ? { ...todo, isCompleted: data.isCompleted }
              : todo
          )
        );
        toast.success(
          data.isCompleted
            ? "Task completed by another user"
            : "Task reopened by another user",
          {
            icon: data.isCompleted ? "✅" : "⏳",
            duration: 2000,
          }
        );
      }
    });
  
    // Listen for project errors
    socket.on("projectError", (error) => {
      console.error("❌ Project socket error:", error);
      toast.error(error.message || "Connection error");
    });
  
    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up project socket listeners");
      socket.off("projectJoined");
      socket.off("userJoinedProject");  
      socket.off("userLeftProject");
      socket.off("todoCreated");
      socket.off("todoUpdated");
      socket.off("todoDeleted");
      socket.off("todoToggled");
      socket.off("projectError");
  
      // Leave project room
      if (socket.isConnected) {
        socket.emit("leaveProject", {
          projectId,
          userId: currentUser.uid
        });
      }
    };
  }, [socket.isConnected, project, projectId, currentUser?.uid]);

  // Handle form submission for create/update (modified for project-specific API)
  const handleFormSubmit = useCallback(async (taskData, originalTodo) => {
    if (!currentUser?.uid) {
      console.error("User not authenticated");
      return;
    }

    // Check permissions
    if (!canEdit) {
      toast.error("You don't have permission to modify tasks in this project");
      return;
    }

    try {
      if (originalTodo) {
        // Update existing todo
        const response = await API.put(`/todos/update/${originalTodo._id}`, {
          ...taskData,
          user: currentUser.uid
        });
        
        // Update local state
        setTodos(prevTodos =>
          prevTodos.map(task =>
            task._id === originalTodo._id ? response.data : task
          )
        );
        setEditingTodo(null);
        setShowForm(false); // Hide form after successful update
        toast.success("Task updated successfully!");
      } else {
        // Create new todo using project-specific endpoint
        const response = await API.post(`/projects/${projectId}/todos/create`, {
          ...taskData,
          user: currentUser.uid
        });
        
        // Add new todo to local state
        const createdTodo = response.data.data;
        setTodos(prevTodos => [createdTodo, ...prevTodos]);
        setShowForm(false); // Hide form after successful creation
        toast.success("Task created successfully!");
      }
    } catch (error) {
      console.error("Error saving todo:", error);
      toast.error("Failed to save task. Please try again.");
    }
  }, [currentUser?.uid, canEdit, projectId]);

  // Handle cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingTodo(null);
    setShowForm(false);
  }, []);

  // Handle edit button click
  const handleEditClick = useCallback((task) => {
    if (!canEdit) {
      toast.error("You don't have permission to edit tasks in this project");
      return;
    }
    setEditingTodo(task);
    setShowForm(true);
  }, [canEdit]);

  // Handle task deletion (modified for project-specific API)
  const handleDelete = useCallback(async (id) => {
    if (!canEdit) {
      toast.error("You don't have permission to delete tasks in this project");
      return;
    }

    try {
      const todoToDelete = todos.find((t) => t._id === id);
      
      // Optimistically update UI
      setTodos(prevTasks => prevTasks.filter(task => task._id !== id));
      
      // Make API call
      await API.delete(`/projects/${projectId}/todos/${id}`);
      
      toast.success(`Task "${todoToDelete?.task}" removed from project`, {
        icon: "🗑️",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error deleting todo:", error);
      toast.error("Failed to remove task from project");
      
      // Revert on error
      fetchProjectData();
    }
  }, [todos, projectId, canEdit, fetchProjectData]);

  // Handle task completion toggle
  const handleToggleComplete = useCallback(async (id, isChecked) => {
    try {
      const response = await API.patch(`/todos/toggle/${id}`, { isCompleted: isChecked });
      setTodos(prevTasks =>
        prevTasks.map(task =>
          task._id === id ? response.data.data : task
        )
      );
      
      toast.success(
        isChecked ? "Task marked as complete!" : "Task marked as incomplete!",
        {
          icon: isChecked ? "✅" : "⏳",
          duration: 2000,
        }
      );
    } catch (error) {
      console.error("Error toggling todo:", error);
      toast.error("Failed to update task status");
      
      // Revert on error
      fetchProjectData();
    }
  }, [fetchProjectData]);

  // Handle search input change
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []);

  // Loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Unauthenticated state
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Project Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/TodoDashboard")}
            className="p-2 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              {project?.title || "Project Tasks"}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-400">
                {project?.description || "Collaborative task management"}
              </p>
              {socketConnected && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs font-medium">
                    {activeUsers.length} active
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Add New Task Button - Only show if user can edit */}
          {canEdit && (
            <button
              onClick={handleNewTaskClick}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
            >
              <Plus className="w-5 h-5" />
              New Task
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <ProgressBar totalTasks={totalTasks} completedTasks={completedTasks} />
        
        {/* Search Input */}
        <SearchInput 
          searchTerm={searchTerm} 
          onSearchChange={handleSearchChange} 
        />

        {/* Todo Form - Show with animation when toggled */}
        <AnimatePresence>
          {showForm && canEdit && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <TodoForm 
                editingTodo={editingTodo}
                onSubmit={handleFormSubmit}
                onCancel={handleCancelEdit}
                currentUser={currentUser}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show message if user cannot edit */}
        {!canEdit && (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-yellow-400 text-center">
              You have view-only access to this project
            </p>
          </div>
        )}

        {/* Filters */}
        <TodoFilters 
          currentFilter={filter} 
          onFilterChange={handleFilterChange} 
        />

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTodos.length === 0 ? (
            <EmptyState searchTerm={searchTerm} filter={filter} />
          ) : (
            filteredTodos.map(task => (
              <TodoItem
                key={task._id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditClick}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Active Users Display */}
        {activeUsers.length > 0 && (
          <div className="mt-8 p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50">
            <h3 className="text-slate-300 font-medium mb-3">Active Users</h3>
            <div className="flex flex-wrap gap-2">
              {activeUsers.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 rounded-full border border-slate-600/50"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-slate-300 text-sm">
                    {user.username} 
                    <span className="text-slate-500 ml-1">({user.role})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTodos;