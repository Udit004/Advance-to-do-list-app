import React from 'react';

/**
 * Loading Spinner Component
 * Displays loading state with spinner animation
 */
const LoadingSpinner = ({ message = "Loading projects..." }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="text-white text-lg">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;