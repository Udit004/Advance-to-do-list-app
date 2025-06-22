// components/todo/AIPriorityPredictor.jsx
import React from 'react';

const AIPriorityPredictor = ({ predictedPriority, isPredicting }) => {
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high": return "🔴";
      case "medium": return "🟡";
      case "low": return "🟢";
      default: return "⚪";
    }
  };

  const getPriorityGradient = (priority) => {
    switch (priority) {
      case "high": return "bg-gradient-to-r from-red-600 to-red-500";
      case "medium": return "bg-gradient-to-r from-yellow-600 to-yellow-500";
      case "low": return "bg-gradient-to-r from-green-600 to-green-500";
      default: return "bg-gradient-to-r from-slate-600 to-slate-500";
    }
  };

  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🤖</span>
        <label className="text-purple-300 font-semibold text-lg">AI Priority Prediction</label>
      </div>
      
      <div className="flex items-center gap-4">
        {isPredicting ? (
          <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg flex-1">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-400 border-t-transparent"></div>
            <span className="text-slate-300">Analyzing task...</span>
          </div>
        ) : (
          <div className={`flex items-center gap-3 p-3 rounded-lg font-semibold text-white flex-1 ${getPriorityGradient(predictedPriority)}`}>
            <span className="text-xl">{getPriorityIcon(predictedPriority)}</span>
            <span>
              {predictedPriority 
                ? `${predictedPriority.charAt(0).toUpperCase() + predictedPriority.slice(1)} Priority` 
                : "Enter task details for prediction"
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPriorityPredictor;