import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
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
  Copy,
  ExternalLink,
  Star,
  Clock,
  Settings,
  Download,
  Archive,
  Tag,
  Activity,
  TrendingUp,
  Bookmark,
} from "lucide-react";

/**
 * Enhanced Project Card Component
 * Displays individual project information with improved visibility and user experience
 */
const ProjectCard = ({ project, viewMode = 'grid', onDelete, onShare, onCopyJoinLink }) => {  const [showDropdown, setShowDropdown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(project.isFavorite || false);
  const dropdownRef = useRef(null);

  // Color configuration with enhanced gradients
  const colorOptions = [
    {
      name: "blue",
      bg: "from-blue-500 via-blue-600 to-indigo-600",
      glow: "shadow-blue-500/20",
      accent: "text-blue-400",
      light: "bg-blue-500/10",
    },
    {
      name: "green",
      bg: "from-emerald-500 via-green-600 to-teal-600",
      glow: "shadow-emerald-500/20",
      accent: "text-emerald-400",
      light: "bg-emerald-500/10",
    },
    {
      name: "purple",
      bg: "from-purple-500 via-violet-600 to-indigo-600",
      glow: "shadow-purple-500/20",
      accent: "text-purple-400",
      light: "bg-purple-500/10",
    },
    {
      name: "orange",
      bg: "from-orange-500 via-amber-600 to-yellow-600",
      glow: "shadow-orange-500/20",
      accent: "text-orange-400",
      light: "bg-orange-500/10",
    },
    {
      name: "red",
      bg: "from-red-500 via-rose-600 to-pink-600",
      glow: "shadow-red-500/20",
      accent: "text-red-400",
      light: "bg-red-500/10",
    },
    {
      name: "indigo",
      bg: "from-indigo-500 via-blue-600 to-purple-600",
      glow: "shadow-indigo-500/20",
      accent: "text-indigo-400",
      light: "bg-indigo-500/10",
    },
    {
      name: "pink",
      bg: "from-pink-500 via-rose-600 to-red-600",
      glow: "shadow-pink-500/20",
      accent: "text-pink-400",
      light: "bg-pink-500/10",
    },
    {
      name: "gray",
      bg: "from-slate-500 via-gray-600 to-zinc-600",
      glow: "shadow-slate-500/20",
      accent: "text-slate-400",
      light: "bg-slate-500/10",
    },
  ];

  const getColorConfig = (colorName) => {
    return colorOptions.find((c) => c.name === colorName) || colorOptions[0];
  };

  const colorConfig = getColorConfig(project.color);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Handle project sharing - UPDATED
   */
// Handle share button click
const handleShare = () => {
  setShowDropdown(false);
  onShare(project);
};

// Handle copy join link
const handleCopyJoinLink = async () => {
  setShowDropdown(false);
  try {
    await onCopyJoinLink(project._id);
    // Optional: Add toast notification here
  } catch (error) {
    console.error('Failed to copy join link:', error);
  }
};


  /**
   * Handle bookmark toggle
   */
  const handleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    // Here you would typically call an API to update the favorite status
    console.log("Toggle bookmark for project:", project._id);
  };

  /**
   * Handle edit project
   */
  const handleEdit = () => {
    console.log("Edit project:", project._id);
    setShowDropdown(false);
  };

  /**
   * Handle archive project
   */
  const handleArchive = () => {
    console.log("Archive project:", project._id);
    setShowDropdown(false);
  };

  /**
   * Handle export project
   */
  const handleExport = () => {
    console.log("Export project:", project._id);
    setShowDropdown(false);
  };

  /**
   * Format date to relative time
   */
  const getRelativeTime = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - new Date(date));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      <div
        className={`group relative bg-gradient-to-br from-slate-800/90 via-slate-800/70 to-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/60 transition-all duration-500 hover:shadow-2xl hover:border-slate-600/60 hover:-translate-y-1 ${
          viewMode === "list"
            ? "flex items-center min-h-[120px]"
            : "flex flex-col h-full min-h-[320px]"
        }
          ${isHovered ? `${colorConfig.glow} shadow-xl` : ""} ${
          showDropdown ? "z-50" : "z-0"
        }
         ${isHovered ? `${colorConfig.glow} shadow-xl` : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Enhanced Color Bar with Pulse Effect */}
        <div
          className={`bg-gradient-to-r ${
            colorConfig.bg
          } relative overflow-hidden ${
            viewMode === "list" ? "w-2 h-full" : "h-2 w-full"
          } ${isHovered ? "shadow-lg" : ""}`}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          {isHovered && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          )}
        </div>

        {/* Hover Overlay Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Bookmark Button - Always Visible */}
        <button
          onClick={handleBookmark}
          className={`absolute top-4 right-4 z-20 p-2 rounded-xl backdrop-blur-sm transition-all duration-300 transform hover:scale-110 ${
            isBookmarked
              ? `bg-yellow-500/20 border border-yellow-500/40 ${colorConfig.glow}`
              : "bg-slate-700/50 border border-slate-600/50 hover:bg-slate-600/50"
          }`}
        >
          <Star
            className={`w-4 h-4 transition-colors ${
              isBookmarked
                ? "text-yellow-400 fill-yellow-400"
                : "text-slate-400 hover:text-yellow-400"
            }`}
          />
        </button>

        <div
          className={`relative p-6 z-10 ${
            viewMode === "list"
              ? "flex-1 flex items-center gap-6"
              : "flex-1 flex flex-col"
          }`}
        >
          <div className={viewMode === "list" ? "flex-1" : "flex-1"}>
            {/* Enhanced Project Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-slate-100 transition-colors duration-200 line-clamp-1">
                    {project.name}
                  </h3>

                  {/* Status Badges - More Prominent */}
                  <div className="flex items-center gap-2">
                    {project.isPublic ? (
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                        <Globe className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-medium">
                          Public
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 bg-slate-500/20 rounded-lg border border-slate-500/30">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-400 font-medium">
                          Private
                        </span>
                      </div>
                    )}

                    {project.userRole === "owner" && (
                      <div className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 text-xs font-medium rounded-lg border border-blue-500/30">
                        Owner
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Tags - New Feature */}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <div className="flex gap-1 flex-wrap">
                      {project.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 ${colorConfig.light} ${colorConfig.accent} text-xs rounded-md border border-current/20`}
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="px-2 py-1 bg-slate-600/20 text-slate-400 text-xs rounded-md">
                          +{project.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Description */}
            {project.description && (
              <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2 group-hover:text-slate-300 transition-colors duration-200">
                {project.description}
              </p>
            )}

            {/* Enhanced Stats Grid - More Visible */}
            <div
              className={`grid gap-3 mb-4 ${
                viewMode === "list" ? "grid-cols-4" : "grid-cols-2"
              }`}
            >
              <div className="flex items-center gap-2 bg-slate-700/40 rounded-xl px-3 py-2 border border-slate-600/30">
                <CheckCircle2 className={`w-4 h-4 ${colorConfig.accent}`} />
                <div className="flex flex-col">
                  <span className="text-slate-300 font-semibold text-sm">
                    {project.stats?.completedTodos || 0}/
                    {project.stats?.totalTodos || 0}
                  </span>
                  <span className="text-slate-500 text-xs">Tasks</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-700/40 rounded-xl px-3 py-2 border border-slate-600/30">
                <Users className="w-4 h-4 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-slate-300 font-semibold text-sm">
                    {project.collaborators?.filter(
                      (c) => c.status === "accepted"
                    ).length || 0}
                  </span>
                  <span className="text-slate-500 text-xs">Members</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-700/40 rounded-xl px-3 py-2 border border-slate-600/30">
                <Clock className="w-4 h-4 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-slate-300 font-semibold text-xs">
                    {getRelativeTime(project.updatedAt)}
                  </span>
                  <span className="text-slate-500 text-xs">Updated</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-700/40 rounded-xl px-3 py-2 border border-slate-600/30">
                <Activity className="w-4 h-4 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-slate-300 font-semibold text-sm">
                    {project.activityScore || "Low"}
                  </span>
                  <span className="text-slate-500 text-xs">Activity</span>
                </div>
              </div>
            </div>

            {/* Enhanced Progress Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${colorConfig.accent}`} />
                  <span className="text-slate-400 font-medium">Progress</span>
                </div>
                <span className={`${colorConfig.accent} font-bold text-lg`}>
                  {project.completionPercentage || 0}%
                </span>
              </div>
              <div className="relative w-full bg-slate-700/60 rounded-full h-3 overflow-hidden border border-slate-600/50">
                <div
                  className={`bg-gradient-to-r ${colorConfig.bg} h-3 rounded-full transition-all duration-1000 ease-out relative`}
                  style={{ width: `${project.completionPercentage || 0}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/40 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Actions - Always Visible */}
          <div
            className={`flex items-center gap-2 ${
              viewMode === "list" ? "ml-6" : ""
            }`}
          >
            {/* Primary Action */}
            <Link
              to={`/project/${project._id}/todos`}
              className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r ${
                colorConfig.bg
              } hover:shadow-lg text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 group/link ${
                viewMode === "grid" ? "flex-1 justify-center" : ""
              }`}
            >
              <Eye className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
              {viewMode === "grid" ? "Open Project" : "Open"}
            </Link>

            {/* Quick Action Buttons - Always Visible */}
            <div className="flex items-center gap-1">
              {/* UPDATED: Share button with enhanced functionality */}
              <button
                onClick={handleShare}
                className="p-2.5 hover:bg-slate-700/50 rounded-xl transition-all duration-200 hover:scale-110 group/btn border border-transparent hover:border-slate-600/50"
                title="Share Project"
              >
                <Share2 className="w-4 h-4 text-slate-400 group-hover/btn:text-blue-400 transition-colors" />
              </button>

              {/* UPDATED: Copy join link button */}
              <button
                onClick={handleCopyJoinLink}
                className="p-2.5 hover:bg-slate-700/50 rounded-xl transition-all duration-200 hover:scale-110 group/btn border border-transparent hover:border-slate-600/50"
                title="Copy Join Link"
              >
                <Copy
                  className={`w-4 h-4 transition-colors ${
                    copied
                      ? "text-emerald-400"
                      : "text-slate-400 group-hover/btn:text-emerald-400"
                  }`}
                />
              </button>

              {/* Advanced Options Dropdown */}
              <div className="relative z-40" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 border ${
                    showDropdown
                      ? "bg-slate-700/70 border-slate-600/50 text-white"
                      : "hover:bg-slate-700/50 border-transparent hover:border-slate-600/50 text-slate-400"
                  }`}
                  title="More Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/60 rounded-xl shadow-2xl z-[60] min-w-[200px] overflow-hidden animate-in slide-in-from-top-5 duration-300">
                    <div className="p-2">
                      {/* View Options */}
                      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700/50">
                        Share Options
                      </div>

                      {/* UPDATED: Enhanced share options */}
                      <button
                        onClick={handleShare}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:text-white"
                      >
                        <UserPlus className="w-4 h-4" />
                        Invite Members
                      </button>

                      <button
                        onClick={handleCopyJoinLink}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:text-white"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Copy Join Link
                      </button>

                      <div className="h-px bg-slate-700/50 my-2"></div>
                      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Actions
                      </div>

                      <button
                        onClick={handleExport}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:text-white"
                      >
                        <Download className="w-4 h-4" />
                        Export Project
                      </button>

                      {project.userRole === "owner" && (
                        <>
                          <button
                            onClick={handleEdit}
                            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:text-white"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit Project
                          </button>

                          <button
                            onClick={handleArchive}
                            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:text-white"
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </button>

                          <div className="h-px bg-slate-700/50 my-2"></div>

                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this project?')) {
                                onDelete(project._id);
                              }
                              setShowDropdown(false);
                            }}
                            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Project
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Toast notification for copy action */}
        {copied && (
          <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-up z-50">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Join link copied to clipboard!
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProjectCard;
