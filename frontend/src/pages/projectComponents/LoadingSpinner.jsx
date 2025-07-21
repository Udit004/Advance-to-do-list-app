import React from 'react';

/**
 * Enhanced Loading Spinner Component
 * YouTube-style skeleton loading animation for project dashboard
 */
const LoadingSpinner = () => {
  // Skeleton Card Component matching the actual project card design
  const SkeletonCard = ({ colorClass = "bg-blue-600" }) => (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 overflow-hidden">
      {/* Top Color Bar */}
      <div className={`${colorClass} h-1 w-full animate-pulse`} />
      
      <div className="p-6">
        {/* Project Title and Status Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-slate-600 rounded animate-pulse w-24"></div>
          <div className="h-5 bg-slate-600 rounded-full animate-pulse w-16 px-3 py-1"></div>
        </div>
        
        {/* Project Description */}
        <div className="h-4 bg-slate-600 rounded animate-pulse w-20 mb-6"></div>
        
        {/* Project Stats Row */}
        <div className="flex items-center gap-6 mb-6">
          {/* Tasks */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-slate-600 rounded animate-pulse"></div>
            <div className="h-4 bg-slate-600 rounded animate-pulse w-12"></div>
          </div>
          {/* Collaborators */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-slate-600 rounded animate-pulse"></div>
            <div className="h-4 bg-slate-600 rounded animate-pulse w-16"></div>
          </div>
          {/* Date */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="h-4 w-4 bg-slate-600 rounded animate-pulse"></div>
            <div className="h-4 bg-slate-600 rounded animate-pulse w-20"></div>
          </div>
        </div>
        
        {/* Progress Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-slate-600 rounded animate-pulse w-16"></div>
            <div className="h-4 bg-slate-600 rounded animate-pulse w-8"></div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 animate-pulse"></div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="h-10 bg-green-600/20 rounded-lg animate-pulse w-32"></div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-slate-600 rounded-lg animate-pulse"></div>
            <div className="h-8 w-8 bg-slate-600 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingSpinner;