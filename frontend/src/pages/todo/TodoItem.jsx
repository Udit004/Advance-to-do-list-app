// components/todo/TodoItem.jsx
import React from 'react';

const TodoItem = ({ 
  task, 
  onToggleComplete, 
  onEdit, 
  onDelete 
}) => {
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high": return "🔴";
      case "medium": return "🟡";
      case "low": return "🟢";
      default: return "⚪";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "work": return "💼";
      case "groceries": return "🛒";
      case "house": return "🏠";
      case "education": return "📚";
      case "general": return "📝";
      default: return "📋";
    }
  };

  const isDueToday = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return today.getTime() === due.getTime();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  };

  const getBorderColor = () => {
    if (task.isCompleted) return "border-green-500/30 bg-green-900/10";
    if (isOverdue(task.dueDate)) return "border-red-500/70 shadow-red-500/20 shadow-lg";
    
    switch (task.priority) {
      case "high": return "border-red-500/50 shadow-red-500/10 shadow-lg";
      case "medium": return "border-yellow-500/50 shadow-yellow-500/10 shadow-lg";
      default: return "border-green-500/50 shadow-green-500/10 shadow-lg";
    }
  };

  return (
    <div className={`group p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border transition-all duration-300 hover:bg-slate-800/70 hover:transform hover:scale-[1.02] ${getBorderColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-2xl">{getCategoryIcon(task.list)}</span>
            <h3 className={`text-xl font-semibold ${
              task.isCompleted ? "text-green-400 line-through" : "text-white"
            } ${isDueToday(task.dueDate) ? "text-yellow-400" : ""} ${
              isOverdue(task.dueDate) && !task.isCompleted ? "text-red-400" : ""
            }`}>
              {task.task}
            </h3>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              task.priority === "high" 
                ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                : task.priority === "medium" 
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
                : "bg-green-500/20 text-green-400 border border-green-500/30"
            }`}>
              {getPriorityIcon(task.priority)} {task.priority.toUpperCase()}
            </div>
            {isOverdue(task.dueDate) && !task.isCompleted && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30 font-medium">
                OVERDUE
              </span>
            )}
          </div>
          
          <p className="text-slate-300 mb-3 leading-relaxed">{task.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
            <div className="flex items-center gap-2">
              <span>⏰</span>
              <span>Due: {new Date(task.dueDate).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🏷️</span>
              <span className="capitalize">{task.list}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 ml-6">
          <label className="flex items-center gap-2 cursor-pointer group-hover:scale-110 transition-transform">
            <input
              type="checkbox"
              checked={task.isCompleted}
              onChange={(e) => onToggleComplete(task._id, e.target.checked)}
              className="w-5 h-5 rounded border-2 border-slate-500 checked:bg-green-500 checked:border-green-500 transition-colors"
            />
            <span className="text-slate-300 font-medium">Complete</span>
          </label>
          
          <button
            onClick={() => onEdit(task)}
            className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors font-medium border border-blue-500/30"
          >
            ✏️ Edit
          </button>
          
          <button
            onClick={() => onDelete(task._id)}
            className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors font-medium border border-red-500/30"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoItem;