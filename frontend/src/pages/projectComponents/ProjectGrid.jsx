import React from 'react';
import { FolderOpen } from 'lucide-react';
import ProjectCard from './ProjectCard';

/**
 * Project Grid Component
 * Displays projects in a grid layout
 */
const ProjectGrid = ({ projects, onDelete }) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-lg mb-2">No projects found</p>
        <p className="text-slate-500 text-sm">Create your first project to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard 
          key={project._id} 
          project={project} 
          viewMode="grid"
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ProjectGrid;