import React from 'react';
import { Plus } from 'lucide-react';

/**
 * Dashboard Header Component
 * Displays title, description and create button
 */
const DashboardHeader = ({ onCreateProject }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Project Dashboard</h1>
          <p className="text-slate-400">Manage your collaborative projects and tasks</p>
        </div>
        <button
          onClick={onCreateProject}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;