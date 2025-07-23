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
  const [showForm, setShowForm] = useState(false);
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

  // Filter todos based on search term and filter
  const filteredTodos = useMemo(() => {
    return todos.filter((task) => {
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
  }, [todos, searchTerm, filter]);

  const totalTasks = todos.length;
  const completedTasks = todos.filter((task) => task.isCompleted).length;

  const toggleForm = useCallback(() => {
    setShowForm((prev) => !prev);
    if (showForm) {
      setEditingTodo(null);
    }
  }, [showForm]);

  const handleNewTaskClick = useCallback(() => {
    if (!canEdit) {
      toast.error("You don't have permission to create tasks in this project");
      return;
    }

    if (creating) {
      toast.error("Please wait, already creating a task");
      return;
    }

    setEditingTodo(null);
    setShowForm(true);
  }, [canEdit, creating]);

  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.get(`/projects/${projectId}`);
      const projectData = response.data.data;
      setProject(projectData);

      // Only include todos that belong to this project
      const projectTodos = (projectData.todos || []).filter((todo) => {
        const todoProjectId = todo.project?._id || todo.project;
        return todoProjectId === projectId;
      });

      setTodos(projectTodos);
    } catch (error) {
      console.error("Error fetching project:", error);
      if (error.response?.status === 403) {
        navigate("/TodoDashboard");
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
        role: project.userRole || "viewer",
      },
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

    // ✅ FIXED: Single todo creation handler
    socket.on("todoCreated", (data) => {
      console.log("🆕 Todo created via socket:", data);

      // Only process if it's for this project and not from current user
      if (data.projectId === projectId && data.todo.user !== currentUser.uid) {
        setTodos((prev) => {
          // Prevent duplicates by ID
          const exists = prev.find((todo) => todo._id === data.todo._id);
          if (exists) {
            console.log("Todo already exists, not adding duplicate");
            return prev;
          }

          // Also check for similar tasks (extra safety)
          const similarExists = prev.find(
            (todo) =>
              todo.task.toLowerCase() === data.todo.task.toLowerCase() &&
              todo.user === data.todo.user &&
              Math.abs(
                new Date(todo.createdAt) - new Date(data.todo.createdAt)
              ) < 5000
          );

          if (similarExists) {
            console.log("Similar todo already exists, not adding duplicate");
            return prev;
          }

          // ✅ ENSURE TODO HAS PROJECT ASSOCIATION
          const todoWithProject = {
            ...data.todo,
            project: data.projectId, // Ensure project is set
          };

          return [todoWithProject, ...prev];
        });

        toast.success(`New task added by ${data.createdBy || "another user"}`, {
          icon: "✨",
          duration: 3000,
        });
      }
    });

    // ✅ FIXED: Single todo update handler
    socket.on("todoUpdated", (data) => {
      console.log("📝 Todo updated via socket:", data);

      if (data.projectId === projectId && data.todo.user !== currentUser.uid) {
        setTodos((prev) => {
          const todoExists = prev.find((todo) => todo._id === data.todo._id);
          if (!todoExists) {
            console.log("Todo not found for update, ignoring");
            return prev;
          }

          return prev.map((todo) =>
            todo._id === data.todo._id
              ? { ...todo, ...data.todo, project: data.projectId } // Ensure project is maintained
              : todo
          );
        });

        toast.success("Task updated by another user", {
          icon: "🔄",
          duration: 2000,
        });
      }
    });

    // ✅ IMPROVED: Socket handlers with better error handling and state management
    socket.on("todoDeleted", (data) => {
      console.log("🗑️ Todo deleted via socket:", data);
      if (data.projectId === projectId) {
        setTodos((prev) => {
          const filteredTodos = prev.filter((todo) => todo._id !== data.todoId);
          console.log(
            `Removed todo ${data.todoId}, remaining: ${filteredTodos.length}`
          );
          return filteredTodos;
        });

        toast.success("Task deleted by another user", {
          icon: "🗑️",
          duration: 2000,
        });
      }
    });

    // ✅ IMPROVED: Socket handlers with better error handling and state management
    socket.on("todoDeleted", (data) => {
      console.log("🗑️ Todo deleted via socket:", data);
      if (data.projectId === projectId) {
        setTodos((prev) => {
          const filteredTodos = prev.filter((todo) => todo._id !== data.todoId);
          console.log(
            `Removed todo ${data.todoId}, remaining: ${filteredTodos.length}`
          );
          return filteredTodos;
        });

        toast.success("Task deleted by another user", {
          icon: "🗑️",
          duration: 2000,
        });
      }
    });

    socket.on("todoToggled", (data) => {
      console.log("✅ Todo toggled via socket:", data);
      if (data.projectId === projectId) {
        setTodos((prev) => {
          const updatedTodos = prev.map((todo) =>
            todo._id === data.todoId
              ? {
                  ...todo,
                  isCompleted: data.isCompleted,
                  updatedAt: new Date(),
                }
              : todo
          );

          console.log(`Toggled todo ${data.todoId} to ${data.isCompleted}`);
          return updatedTodos;
        });

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

      if (socket.isConnected) {
        socket.emit("leaveProject", {
          projectId,
          userId: currentUser.uid,
        });
      }
    };
  }, [socket.isConnected, project, projectId, currentUser?.uid]);

  // ✅ IMPROVED: Enhanced form submission with better project association
  const handleFormSubmit = useCallback(
    async (taskData, originalTodo) => {
      if (!currentUser?.uid) {
        console.error("User not authenticated");
        return;
      }

      if (!canEdit) {
        toast.error(
          "You don't have permission to modify tasks in this project"
        );
        return;
      }

      if (creating) {
        console.log(
          "Already creating/updating todo, ignoring duplicate request"
        );
        return;
      }

      try {
        setCreating(true);

        if (originalTodo) {
          // Update existing todo
          const response = await API.put(
            `/projects/${projectId}/todos/${originalTodo._id}`,
            {
              ...taskData,
              user: currentUser.uid,
              project: projectId, // ✅ Explicitly set project
            }
          );

          const updatedTodo = response.data.data;

          setTodos((prevTodos) =>
            prevTodos.map((task) =>
              task._id === originalTodo._id ? updatedTodo : task
            )
          );

          setEditingTodo(null);
          setShowForm(false);
          toast.success("Task updated successfully!");
        } else {
          // Check for duplicates before creating
          const trimmedTask = taskData.task.trim().toLowerCase();
          const duplicateExists = todos.some(
            (todo) =>
              todo.task.toLowerCase() === trimmedTask &&
              !todo.isCompleted &&
              todo.user === currentUser.uid
          );

          if (duplicateExists) {
            toast.error("A similar task already exists in this project");
            return;
          }

          // ✅ Create new todo with explicit project association
          const response = await API.post(
            `/projects/${projectId}/todos/create`,
            {
              ...taskData,
              user: currentUser.uid,
              project: projectId, // ✅ Explicitly set project
            }
          );

          const createdTodo = response.data.data;

          setTodos((prevTodos) => {
            // Double check for duplicates in state
            const exists = prevTodos.find(
              (todo) => todo._id === createdTodo._id
            );
            if (exists) {
              console.log("Todo already exists in state, not adding duplicate");
              return prevTodos;
            }
            return [createdTodo, ...prevTodos];
          });

          setShowForm(false);
          toast.success("Task created successfully!");
        }
      } catch (error) {
        console.error("Error saving todo:", error);

        if (error.response?.data?.error === "DUPLICATE_TODO") {
          toast.error("This task already exists in the project");
        } else {
          toast.error("Failed to save task. Please try again.");
        }
      } finally {
        setCreating(false);
      }
    },
    [currentUser?.uid, canEdit, projectId, creating, todos]
  );

  // Rest of your component methods remain the same...
  const handleToggleComplete = useCallback(
    async (id, isChecked) => {
      if (!canEdit) {
        toast.error(
          "You don't have permission to modify tasks in this project"
        );
        return;
      }

      try {
        console.log("🔄 Toggling todo:", { id, isChecked });

        // Optimistically update UI first
        setTodos((prevTasks) =>
          prevTasks.map((task) =>
            task._id === id
              ? { ...task, isCompleted: isChecked, updatedAt: new Date() }
              : task
          )
        );

        // Make API call
        const response = await API.patch(
          `/projects/${projectId}/todos/${id}/toggle`,
          {
            isCompleted: isChecked,
          }
        );

        console.log("✅ Todo toggled successfully via API");

        // Update with server response to ensure consistency
        setTodos((prevTasks) =>
          prevTasks.map((task) => (task._id === id ? response.data.data : task))
        );

        toast.success(
          isChecked ? "Task marked as complete!" : "Task marked as incomplete!",
          {
            icon: isChecked ? "✅" : "⏳",
            duration: 2000,
          }
        );
      } catch (error) {
        console.error("❌ Error toggling todo:", error);

        // Revert optimistic update on error
        setTodos((prevTasks) =>
          prevTasks.map((task) =>
            task._id === id
              ? { ...task, isCompleted: !isChecked } // Revert
              : task
          )
        );

        toast.error("Failed to update task status");

        // Optionally refresh data
        fetchProjectData();
      }
    },
    [projectId, canEdit, fetchProjectData]
  );

  const handleDelete = useCallback(
  async (id) => {
    if (!canEdit) {
      toast.error(
        "You don't have permission to delete tasks in this project"
      );
      return;
    }

    const todoToDelete = todos.find((t) => t._id === id);
    if (!todoToDelete) {
      toast.error("Task not found");
      return;
    }

    try {
      console.log('🗑️ Deleting todo:', id);

      // Show loading state
      const loadingToast = toast.loading("Deleting task...");

      // Make API call to delete from database
      const response = await API.delete(`/projects/${projectId}/todos/${id}`);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      console.log('✅ Todo deleted successfully from API:', response.data);

      // Update local state immediately after successful API call
      setTodos((prevTasks) => {
        const filteredTasks = prevTasks.filter((task) => task._id !== id);
        console.log(`Local state updated: removed todo ${id}, remaining: ${filteredTasks.length}`);
        return filteredTasks;
      });

      toast.success(`Task "${todoToDelete.task}" deleted successfully`, {
        icon: "🗑️",
        duration: 3000,
      });

    } catch (error) {
      console.error("❌ Error deleting todo:", error);
      
      // Dismiss any loading toast
      toast.dismiss();
      
      // Show specific error message based on response
      if (error.response?.status === 404) {
        toast.error("Task not found or already deleted");
        // Remove from local state if it doesn't exist on server
        setTodos((prevTasks) => prevTasks.filter((task) => task._id !== id));
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to delete this task");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again in a moment.");
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Failed to delete task. Please try again.");
      }
      
      // Only refresh data if it's not a 404 (task not found)
      if (error.response?.status !== 404) {
        console.log("Refreshing project data due to delete error...");
        fetchProjectData();
      }
    }
  },
  [todos, projectId, canEdit, fetchProjectData]
);

  const handleCancelEdit = useCallback(() => {
    setEditingTodo(null);
    setShowForm(false);
  }, []);

  const handleEditClick = useCallback(
    (task) => {
      if (!canEdit) {
        toast.error("You don't have permission to edit tasks in this project");
        return;
      }
      setEditingTodo(task);
      setShowForm(true);
    },
    [canEdit]
  );

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
          <p className="text-red-400 text-xl font-medium">
            Please log in to continue
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8 space-y-1">
      <div className="max-w-4xl mx-auto">
        {/* Project Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8 px-4 sm:px-0">
          {/* Top row with back button and active users */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/TodoDashboard")}
              className="p-2.5 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {socketConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs font-medium whitespace-nowrap">
                  {activeUsers.length} online
                </span>
              </div>
            )}
          </div>

          {/* Project title and description */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent leading-tight">
              {project?.name || "Project Tasks"}
            </h1>

            {(project?.description || "Collaborative task management") && (
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
                {project?.description || "Collaborative task management"}
              </p>
            )}
          </div>
        </div>

        {/* Add New Task Button - Only show if user can edit */}
        {canEdit && (
          <button
            onClick={handleNewTaskClick}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25 w-full sm:w-auto text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            New Task
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-4 sm:px-0 my-4">
        <ProgressBar totalTasks={totalTasks} completedTasks={completedTasks} />
      </div>

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
      <TodoFilters currentFilter={filter} onFilterChange={handleFilterChange} />

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTodos.length === 0 ? (
          <EmptyState searchTerm={searchTerm} filter={filter} />
        ) : (
          filteredTodos.map((task) => (
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
  );
};

export default ProjectTodos;
