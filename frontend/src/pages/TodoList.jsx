import React, { useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import useTodoStore from "../stores/useTodoStore"; // Adjust path as needed

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
  
  // Zustand store selectors
  const {
    // State
    tasks,
    filter,
    editingTodo,
    searchTerm,
    loading,
    showForm,
    error,
    
    // Computed functions
    getTotalTasks,
    getCompletedTasks,
    getFilteredTasks,
    
    // Actions
    fetchTasks,
    setFilter,
    setSearchTerm,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    startEditing,
    startCreating,
    cancelForm,
    reset
  } = useTodoStore();

  // Get computed values
  const totalTasks = getTotalTasks();
  const completedTasks = getCompletedTasks();
  const filteredTasks = getFilteredTasks();

  // Fetch tasks on component mount and user change
  useEffect(() => {
    if (currentUser) {
      fetchTasks(currentUser);
    } else {
      reset(); // Clear store when user logs out
    }
  }, [currentUser, fetchTasks, reset]);

  // Handle form submission for create/update from TodoForm
  const handleFormSubmit = async (taskData, originalTodo) => {
    console.log("TodoList: currentUser.uid before API call:", currentUser?.uid);

    if (originalTodo) {
      // Update existing todo
      await updateTodo(taskData, originalTodo, currentUser);
    } else {
      // Create new todo
      await createTodo(taskData, currentUser);
    }
  };

  // Handle task deletion
  const handleDelete = async (id) => {
    await deleteTodo(id);
  };

  // Handle task completion toggle
  const handleToggleComplete = async (id, isChecked) => {
    await toggleTodoComplete(id, isChecked);
  };

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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Progress Bar */}
        <ProgressBar totalTasks={totalTasks} completedTasks={completedTasks} />
        
        {/* Action Bar - Search and Add Button */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          {/* Search Input - takes up available space */}
          <div className="flex-1">
            <SearchInput 
              searchTerm={searchTerm} 
              onSearchChange={setSearchTerm} 
            />
          </div>
          
          {/* Add Todo Button */}
          <button
            onClick={startCreating}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 min-w-fit"
          >
            <span className="text-lg">➕</span>
            <span>Add New Task</span>
          </button>
        </div>

        {/* Todo Form Modal - Only show when needed */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-200">
                    {editingTodo ? 'Edit Task' : 'Add New Task'}
                  </h2>
                  <button
                    onClick={cancelForm}
                    className="text-slate-400 hover:text-slate-300 transition-colors p-2 hover:bg-slate-700 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <TodoForm 
                  editingTodo={editingTodo}
                  onSubmit={handleFormSubmit}
                  onCancel={cancelForm}
                  currentUser={currentUser}
                />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <TodoFilters 
          currentFilter={filter} 
          onFilterChange={setFilter} 
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
                onEdit={startEditing}
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