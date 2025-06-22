// components/todo/EmptyState.jsx
import React from 'react';

const EmptyState = ({ searchTerm, filter }) => {
  const getEmptyStateContent = () => {
    if (searchTerm) {
      return {
        icon: "🔍",
        title: "No matching tasks found",
        subtitle: `Try adjusting your search for "${searchTerm}"`
      };
    }
    
    if (filter === "completed") {
      return {
        icon: "✅",
        title: "No completed tasks yet",
        subtitle: "Complete some tasks to see them here!"
      };
    }
    
    if (filter === "pending") {
      return {
        icon: "⏳",
        title: "No pending tasks",
        subtitle: "Great job! You're all caught up!"
      };
    }
    
    return {
      icon: "📝",
      title: "No tasks found",
      subtitle: "Create your first task to get started!"
    };
  };

  const { icon, title, subtitle } = getEmptyStateContent();

  return (
    <div className="text-center py-16 text-slate-400">
      <div className="text-6xl mb-4">{icon}</div>
      <p className="text-xl font-medium text-slate-300">{title}</p>
      <p className="text-slate-500 mt-2">{subtitle}</p>
    </div>
  );
};

export default EmptyState;