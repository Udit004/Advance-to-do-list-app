// components/todo/ProgressBar.jsx
import React from 'react';

const ProgressBar = ({ completedTasks, totalTasks }) => {
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="mb-8 p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-300 font-medium">Progress</span>
        <span className="text-purple-400 font-semibold">
          {completedTasks} of {totalTasks} tasks ({Math.round(progressPercentage)}%)
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;