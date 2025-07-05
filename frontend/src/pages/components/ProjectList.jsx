import React from 'react';
import { FolderOpen } from 'lucide-react';
import ProjectCard from './ProjectCard';

/**
 * Project List Component
 * Displays projects in a list layout
 */
const ProjectList = ({ projects }) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-lg mb-2">No projects found</p>
        <p className="text-slate-500 text-sm">Try adjusting your search terms or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectCard 
          key={project._id} 
          project={project} 
          viewMode="list"
        />
      ))}
    </div>
  );
};

export default ProjectList;