// components/todo/TodoFilters.jsx
import React from 'react';

const TodoFilters = ({ currentFilter, onFilterChange }) => {
  const filters = [
    { key: "all", label: "All Tasks", icon: "📋" },
    { key: "pending", label: "Pending", icon: "⏳" },
    { key: "completed", label: "Completed", icon: "✅" }
  ];

  return (
    <div className="flex justify-center gap-2 sm:gap-4 mb-8 px-4 sm:px-0">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base flex-1 sm:flex-initial justify-center ${
            currentFilter === filter.key 
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105" 
              : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50"
          }`}
        >
          <span className="text-sm sm:text-base">{filter.icon}</span>
          <span className="hidden xs:inline sm:inline">{filter.label}</span>
          <span className="xs:hidden sm:hidden">
            {filter.key === 'all' ? 'All' : filter.key === 'pending' ? 'Pending' : 'Done'}
          </span>
        </button>
      ))}
    </div>
  );
};

export default TodoFilters;