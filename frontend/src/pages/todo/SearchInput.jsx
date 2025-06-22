// components/todo/SearchInput.jsx
import React from 'react';

const SearchInput = ({ searchTerm, onSearchChange }) => (
  <div className="mb-6 relative">
    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
      <span className="text-slate-400 text-xl">🔍</span>
    </div>
    <input
      type="text"
      placeholder="Search tasks..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full pl-12 pr-4 py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
    />
  </div>
);

export default SearchInput;