// components/todo/TodoFilters.jsx
import React from 'react';

const TodoFilters = ({ currentFilter, onFilterChange }) => {
  const filters = [
    { key: "all", label: "All Tasks", icon: "📋" },
    { key: "pending", label: "Pending", icon: "⏳" },
    { key: "completed", label: "Completed", icon: "✅" }
  ];

  return (
    <div className="flex justify-center gap-4 mb-8">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
            currentFilter === filter.key 
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105" 
              : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50"
          }`}
        >
          <span>{filter.icon}</span>
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default TodoFilters;
