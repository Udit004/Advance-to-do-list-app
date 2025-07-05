import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * Create Project Modal Component
 * Handles project creation form
 */
const CreateProjectModal = ({ onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: 'blue',
    isPublic: false,
    tags: []
  });

  // Color options for project themes
  const colorOptions = [
    { name: 'blue', bg: 'from-blue-500 to-blue-600', border: 'border-blue-500' },
    { name: 'green', bg: 'from-green-500 to-green-600', border: 'border-green-500' },
    { name: 'purple', bg: 'from-purple-500 to-purple-600', border: 'border-purple-500' },
    { name: 'orange', bg: 'from-orange-500 to-orange-600', border: 'border-orange-500' },
    { name: 'red', bg: 'from-red-500 to-red-600', border: 'border-red-500' },
    { name: 'indigo', bg: 'from-indigo-500 to-indigo-600', border: 'border-indigo-500' },
    { name: 'pink', bg: 'from-pink-500 to-pink-600', border: 'border-pink-500' },
    { name: 'gray', bg: 'from-gray-500 to-gray-600', border: 'border-gray-500' }
  ];

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    setLoading(true);
    try {
      await onSubmit(newProject);
      // Reset form
      setNewProject({ name: '', description: '', color: 'blue', isPublic: false, tags: [] });
    } catch (error) {
      console.error('Error creating project:', error);
      // You could add error handling here (toast notification, etc.)
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (field, value) => {
    setNewProject(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={newProject.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Enter project name"
              required
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 h-24 resize-none transition-colors"
              placeholder="Enter project description (optional)"
              disabled={loading}
            />
          </div>

          {/* Color Theme */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Color Theme
            </label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => handleInputChange('color', color.name)}
                  className={`w-8 h-8 rounded-full bg-gradient-to-r ${color.bg} transition-all ${
                    newProject.color === color.name 
                      ? 'ring-2 ring-white scale-110' 
                      : 'hover:scale-105'
                  }`}
                  disabled={loading}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Public Project Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={newProject.isPublic}
              onChange={(e) => handleInputChange('isPublic', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              disabled={loading}
            />
            <label htmlFor="isPublic" className="text-slate-300 text-sm">
              Make project public
              <span className="block text-xs text-slate-500">
                Public projects can be viewed by anyone
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!newProject.name.trim() || loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;