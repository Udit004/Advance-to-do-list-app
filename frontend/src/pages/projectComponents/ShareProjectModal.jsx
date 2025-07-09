import React, { useState } from 'react';
import { X, UserPlus, Mail, Link as LinkIcon, Users, Copy, Check } from 'lucide-react';
import API from '../../api/config';

/**
 * Share Project Modal Component
 * Handles project sharing and collaboration invitations
 */
const ShareProjectModal = ({ project, onClose }) => {
  const [activeTab, setActiveTab] = useState('invite'); // 'invite' or 'collaborators'
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer'); // 'viewer' or 'editor'
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collaborators, setCollaborators] = useState(project.collaborators || []);

  /**
   * Handle email invitation
   */
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      // Fixed: Use /share endpoint instead of /invite
      const response = await API.post(`/projects/${project._id}/share`, {
        email: email.trim(),
        role
      });
      
      // Add to collaborators list
      setCollaborators(prev => [...prev, response.data.data.collaborator]);
      setEmail('');
      // You could add a success toast here
      console.log('Invitation sent successfully');
    } catch (error) {
      console.error('Error sending invitation:', error);
      // You could add an error toast here
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy project link to clipboard
   */
  const handleCopyLink = async () => {
    try {
      const projectUrl = `${window.location.origin}/project/${project._id}`;
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  /**
   * Remove collaborator
   */
  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!window.confirm('Are you sure you want to remove this collaborator?')) return;

    try {
      // Fixed: Use the correct endpoint structure
      await API.delete(`/projects/${project._id}/collaborators/${collaboratorId}`);
      setCollaborators(prev => prev.filter(c => c.userId !== collaboratorId));
    } catch (error) {
      console.error('Error removing collaborator:', error);
    }
  };

  /**
   * Update collaborator role
   */
  const handleRoleUpdate = async (collaboratorId, newRole) => {
    try {
      // Fixed: Use the correct endpoint structure
      await API.patch(`/projects/${project._id}/collaborators/${collaboratorId}/role`, {
        role: newRole
      });
      setCollaborators(prev => prev.map(c => 
        c.userId === collaboratorId ? { ...c, role: newRole } : c
      ));
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Share Project</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Project Info */}
        <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
          <h3 className="text-white font-semibold">{project.name}</h3>
          {project.description && (
            <p className="text-slate-400 text-sm mt-1">{project.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-slate-700/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'invite'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Invite People
          </button>
          <button
            onClick={() => setActiveTab('collaborators')}
            className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'collaborators'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Collaborators ({collaborators.length})
          </button>
        </div>

        {/* Invite Tab */}
        {activeTab === 'invite' && (
          <div className="space-y-4">
            {/* Copy Link */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/project/${project._id}`}
                  readOnly
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-600 hover:bg-slate-700 text-white'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Email Invitation */}
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Invite by Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter email address"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="viewer">Viewer - Can view only</option>
                  <option value="editor">Editor - Can edit and add tasks</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!email.trim() || loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          </div>
        )}

        {/* Collaborators Tab */}
        {activeTab === 'collaborators' && (
          <div className="space-y-3">
            {collaborators.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No collaborators yet</p>
                <p className="text-slate-500 text-sm">Invite people to start collaborating</p>
              </div>
            ) : (
              collaborators.map((collaborator) => (
                <div key={collaborator.userId || collaborator._id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {collaborator.username?.charAt(0).toUpperCase() || collaborator.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {collaborator.username || collaborator.email}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {collaborator.status === 'pending' ? 'Invitation pending' : collaborator.role}
                      </p>
                    </div>
                  </div>
                  
                  {project.userRole === 'owner' && (
                    <div className="flex items-center gap-2">
                      {collaborator.status === 'accepted' && (
                        <select
                          value={collaborator.role}
                          onChange={(e) => handleRoleUpdate(collaborator.userId, e.target.value)}
                          className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-xs"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                      )}
                      <button
                        onClick={() => handleRemoveCollaborator(collaborator.userId)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareProjectModal;