import React from 'react';
import { Search, Grid3X3, List } from 'lucide-react';

/**
 * Search and Filters Component
 * Handles project search, filtering, and view mode selection
 */
const SearchAndFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus, 
  viewMode, 
  setViewMode 
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>
      
      {/* Filters and View Controls */}
      <div className="flex gap-2">
        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="all">All Projects</option>
          <option value="owned">Owned by Me</option>
          <option value="shared">Shared with Me</option>
        </select>
        
        {/* View Mode Toggle */}
        <div className="flex bg-slate-800/50 border border-slate-600 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-colors ${
              viewMode === 'grid' 
                ? 'text-blue-400 bg-slate-700/50' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
            title="Grid View"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${
              viewMode === 'list' 
                ? 'text-blue-400 bg-slate-700/50' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
            title="List View"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilters;