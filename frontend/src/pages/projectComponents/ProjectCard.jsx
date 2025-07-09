import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, 
  Lock, 
  CheckCircle2, 
  Users, 
  Calendar, 
  Eye, 
  Share2, 
  MoreVertical,
  UserPlus,
  Edit3,
  Trash2,
  Copy
} from 'lucide-react';
import ShareProjectModal from './ShareProjectModal';

/**
 * Project Card Component
 * Displays individual project information in card format
 */
const ProjectCard = ({ project, viewMode = 'grid' }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Color configuration
  const colorOptions = [
    { name: 'blue', bg: 'from-blue-500 to-blue-600' },
    { name: 'green', bg: 'from-green-500 to-green-600' },
    { name: 'purple', bg: 'from-purple-500 to-purple-600' },
    { name: 'orange', bg: 'from-orange-500 to-orange-600' },
    { name: 'red', bg: 'from-red-500 to-red-600' },
    { name: 'indigo', bg: 'from-indigo-500 to-indigo-600' },
    { name: 'pink', bg: 'from-pink-500 to-pink-600' },
    { name: 'gray', bg: 'from-gray-500 to-gray-600' }
  ];

  const getColorConfig = (colorName) => {
    return colorOptions.find(c => c.name === colorName) || colorOptions[0];
  };

  const colorConfig = getColorConfig(project.color);

  /**
   * Handle project sharing
   */
  const handleShare = () => {
    setShowShareModal(true);
    setShowDropdown(false);
  };

  /**
   * Handle copying project link
   */
  const handleCopyLink = async () => {
    try {
      const projectUrl = `${window.location.origin}/project/${project._id}/todos`;
      await navigator.clipboard.writeText(projectUrl);
      // You could add a toast notification here
      console.log('Project link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
    setShowDropdown(false);
  };

  /**
   * Handle project deletion
   */
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      // Implement delete functionality
      console.log('Delete project:', project._id);
    }
    setShowDropdown(false);
  };

  return (
    <>
      <div
        className={`bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 overflow-hidden hover:shadow-xl transition-all duration-300 ${
          viewMode === 'list' ? 'flex items-center' : 'flex flex-col'
        }`}
      >
        {/* Color Bar */}
        <div className={`bg-gradient-to-r ${colorConfig.bg} h-2 w-full ${viewMode === 'list' ? 'w-2 h-full' : ''}`} />
        
        <div className={`p-6 ${viewMode === 'list' ? 'flex-1 flex items-center justify-between' : 'flex-1'}`}>
          <div className={viewMode === 'list' ? 'flex items-center gap-4 flex-1' : ''}>
            <div className={viewMode === 'list' ? 'flex-1' : ''}>
              {/* Project Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-white">{project.name}</h3>
                  {project.isPublic ? (
                    <Globe className="w-4 h-4 text-green-400" title="Public Project" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400" title="Private Project" />
                  )}
                </div>
                {project.userRole === 'owner' && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                    Owner
                  </span>
                )}
              </div>
              
              {/* Description */}
              {project.description && (
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{project.description}</p>
              )}
              
              {/* Project Stats */}
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{project.stats?.completedTodos || 0}/{project.stats?.totalTodos || 0} tasks</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{project.collaborators?.filter(c => c.status === 'accepted').length || 0} collaborators</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-slate-300">{project.completionPercentage || 0}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r ${colorConfig.bg} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${project.completionPercentage || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons - List View */}
            {viewMode === 'list' && (
              <div className="flex items-center gap-2">
                <Link
                  to={`/project/${project._id}/todos`}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-medium rounded-lg transition-all duration-200"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Link>
                <button 
                  onClick={handleShare}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Share Project"
                >
                  <Share2 className="w-4 h-4 text-slate-400" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 min-w-[150px]">
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </button>
                      {project.userRole === 'owner' && (
                        <>
                          <button
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Grid View */}
          {viewMode === 'grid' && (
            <div className="flex items-center justify-between">
              <Link
                to={`/project/${project._id}/todos`}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-medium rounded-lg transition-all duration-200 flex-1 justify-center"
              >
                <Eye className="w-4 h-4" />
                View Project
              </Link>
              <div className="flex items-center gap-1 ml-3">
                <button 
                  onClick={handleShare}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Share Project"
                >
                  <Share2 className="w-4 h-4 text-slate-400" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 min-w-[150px]">
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </button>
                      {project.userRole === 'owner' && (
                        <>
                          <button
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Project Modal */}
      {showShareModal && (
        <ShareProjectModal 
          project={project}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
};

export default ProjectCard;