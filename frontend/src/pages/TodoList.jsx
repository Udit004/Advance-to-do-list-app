import React, { useState, useEffect, useContext, useCallback } from "react";
import API from "../api/config";
import AuthContext from "../context/AuthContext";

// Import modular components
import LoadingSpinner from "./todoComponents/LoadingSpinner";
import EmptyState from "./todoComponents/EmptyState";
import SearchInput from "./todoComponents/SearchInput";
import ProgressBar from "./todoComponents/ProgressBar";
import TodoFilters from "./todoComponents/TodoFilters";
import TodoForm from "./todoComponents/TodoForm";
import TodoItem from "./todoComponents/TodoItem";

// Main TodoList Component
const TodoList = () => {
  console.log("TodoList component rendered.");
  
  const { currentUser } = useContext(AuthContext);
  
  // State management
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [editingTodo, setEditingTodo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false); // NEW: Form visibility state

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    if (!currentUser || !currentUser.uid) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await API.get(`/todos/${currentUser.uid}?excludeProjectTodos=true`);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch tasks on component mount and user change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle form submission for create/update from TodoForm
  const handleFormSubmit = async (taskData, originalTodo) => {
    if (!currentUser?.uid) {
      console.error("User not authenticated");
      return;
    }
    console.log("TodoList: currentUser.uid before API call:", currentUser?.uid);

    try {
      if (originalTodo) {
        // Update existing todo
        const response = await API.put(`/todos/update/${originalTodo._id}`, {
          ...taskData,
          user: currentUser.uid
        });
        
        // Update local state with the response data
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === originalTodo._id ? response.data : task
          )
        );
        setEditingTodo(null);
        setShowForm(false); // Hide form after edit
      } else {
        // Create new todo
        const response = await API.post('/todos/create', {
          ...taskData,
          user: currentUser.uid
        });
        
        // Add new todo to local state
        setTasks(prevTasks => [...prevTasks, response.data]);
        setShowForm(false); // Hide form after create
      }
    } catch (error) {
      console.error("Error saving todo:", error);
    }
  };

  // Handle cancel editing/creating
  const handleCancelEdit = useCallback(() => {
    setEditingTodo(null);
    setShowForm(false); // Hide form on cancel
  }, []);

  // Handle edit button click
  const handleEditClick = useCallback((task) => {
    setEditingTodo(task);
    setShowForm(true); // Show form for editing
  }, []);

  // Handle add new todo button click
  const handleAddClick = useCallback(() => {
    setEditingTodo(null);
    setShowForm(true);
  }, []);

  // Handle task deletion
  const handleDelete = useCallback(async (id) => {
    try {
      await API.delete(`/todos/delete/${id}`);
      setTasks(prevTasks => prevTasks.filter(task => task._id !== id));
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  }, []);

  // Handle task completion toggle
  const handleToggleComplete = useCallback(async (id, isChecked) => {
    try {
      const response = await API.patch(`/todos/toggle/${id}`, { isCompleted: isChecked });
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === id ? response.data.data : task
        )
      );
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []);

  // Computed values
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.isCompleted).length;

  // Filter tasks based on search term and filter
  const filteredTasks = tasks.filter(task => {
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
            AI-Powered Todo List
          </h1>
          <p className="text-slate-400 text-lg">
            Intelligent task management with ML-powered priority prediction
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressBar totalTasks={totalTasks} completedTasks={completedTasks} />
        
        {/* Action Bar - Search and Add Button */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          {/* Search Input - takes up available space */}
          <div className="flex-1">
            <SearchInput 
              searchTerm={searchTerm} 
              onSearchChange={handleSearchChange} 
            />
          </div>
          
          {/* Add Todo Button */}
          <button
            onClick={handleAddClick}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 min-w-fit"
          >
            <span className="text-lg">➕</span>
            <span>Add New Task</span>
          </button>
        </div>

        {/* Todo Form - Only show when needed */}
        {showForm && (
          <div className="mb-6">
            <TodoForm 
              editingTodo={editingTodo}
              onSubmit={handleFormSubmit}
              onCancel={handleCancelEdit}
              currentUser={currentUser}
            />
          </div>
        )}

        {/* Filters */}
        <TodoFilters 
          currentFilter={filter} 
          onFilterChange={handleFilterChange} 
        />

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <EmptyState searchTerm={searchTerm} filter={filter} />
          ) : (
            filteredTasks.map(task => (
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
      </div>
    </div>
  );
};

export default TodoList;