import React, { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Mail,
  Link as LinkIcon,
  Users,
  Copy,
  Check,
  Settings,
  Globe,
  Lock,
  Clock,
  AlertCircle,
  Send,
} from "lucide-react";
import API from "../../api/config";

/**
 * Enhanced Share Project Modal Component
 * Handles project sharing, collaboration invitations, and access requests
 */
const ShareProjectModal = ({ project, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState("invite"); // 'invite', 'collaborators', 'requests', 'settings'
  const [email, setEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [role, setRole] = useState("viewer");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collaborators, setCollaborators] = useState(
    project.collaborators || []
  );
  const [accessRequests, setAccessRequests] = useState([]);
  const [shareSettings, setShareSettings] = useState(
    project.shareSettings || {}
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (activeTab === "requests" && project.userPermissions?.canManage) {
      fetchAccessRequests();
    }
  }, [activeTab]);

  /**
   * Fetch pending access requests
   */
  const fetchAccessRequests = async () => {
    try {
      const response = await API.get(
        `/projects/${project._id}/access-requests`
      );
      setAccessRequests(response.data.data || []);
    } catch (error) {
      console.error("Error fetching access requests:", error);
    }
  };

  /**
   * Handle email invitation (single or bulk)
   */
  const handleInvite = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailList = bulkEmails
      ? bulkEmails
          .split(/[,\n]/)
          .map((e) => e.trim())
          .filter((e) => e)
      : [email.trim()];

    if (emailList.length === 0) return;

    setLoading(true);
    try {
      const response = await API.post(`/projects/${project._id}/share`, {
        emails: emailList,
        role,
        message,
        sendEmail: true,
      });

      // Update collaborators list with successful invitations
      const successful = response.data.data.successful || [];
      const newCollaborators = successful.map((invite) => ({
        userId: `temp_${Date.now()}_${Math.random()}`, // Temporary ID
        email: invite.email,
        username: invite.username,
        role: invite.role,
        status: "pending",
        invitedAt: new Date(),
        invitedBy: "current_user",
      }));

      setCollaborators((prev) => [...prev, ...newCollaborators]);

      // Show results
      if (response.data.data.errors?.length > 0) {
        console.warn("Some invitations failed:", response.data.data.errors);
        // You could show a toast with errors here
      }

      // Reset form
      setEmail("");
      setBulkEmails("");
      setMessage("");

      // Call onUpdate if provided
      if (onUpdate) onUpdate();
      setSuccess(`Successfully sent ${successful.length} invitation(s)`);
    } catch (error) {
      console.error("Error sending invitation:", error);
      setError(error.response?.data?.message || "Failed to send invitations");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy project link to clipboard
   */
  const handleCopyLink = async () => {
    try {
      const projectUrl = `${window.location.origin}/join/${project._id}`;
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  /**
   * Remove collaborator
   */
  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!window.confirm("Are you sure you want to remove this collaborator?"))
      return;

    try {
      await API.delete(
        `/projects/${project._id}/collaborators/${collaboratorId}`
      );
      setCollaborators((prev) =>
        prev.filter((c) => c.userId !== collaboratorId)
      );
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error removing collaborator:", error);
    }
  };

  /**
   * Update collaborator role
   */
  const handleRoleUpdate = async (collaboratorId, newRole) => {
    try {
      await API.patch(
        `/projects/${project._id}/collaborators/${collaboratorId}/role`,
        {
          role: newRole,
        }
      );
      setCollaborators((prev) =>
        prev.map((c) =>
          c.userId === collaboratorId ? { ...c, role: newRole } : c
        )
      );
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  /**
   * Respond to access request
   */
  const handleAccessRequestResponse = async (requestId, action) => {
    try {
      await API.post(
        `/projects/${project._id}/access-requests/${requestId}/respond`,
        {
          action,
        }
      );

      // Remove from requests list
      setAccessRequests((prev) => prev.filter((r) => r._id !== requestId));

      // If approved, refresh collaborators
      if (action === "approve") {
        // You might want to refresh the entire project data here
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error responding to access request:", error);
    }
  };

  /**
   * Update share settings
   */
  const handleSettingsUpdate = async (newSettings) => {
    try {
      await API.patch(`/projects/${project._id}/settings`, {
        shareSettings: newSettings,
      });
      setShareSettings(newSettings);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const roleOptions = [
    {
      value: "viewer",
      label: "Viewer",
      description: "Can view project and todos",
    },
    {
      value: "editor",
      label: "Editor",
      description: "Can edit todos and project content",
    },
    {
      value: "admin",
      label: "Admin",
      description: "Can manage collaborators and settings",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Share Project</h2>
            <p className="text-slate-400 text-sm mt-1">
              Collaborate with your team
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Project Info */}
        <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <h3 className="text-white font-semibold">{project.name}</h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                project.isPublic
                  ? "bg-green-500/20 text-green-400"
                  : "bg-orange-500/20 text-orange-400"
              }`}
            >
              {project.isPublic ? (
                <Globe className="w-3 h-3" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
              {project.isPublic ? "Public" : "Private"}
            </span>
          </div>
          {project.description && (
            <p className="text-slate-400 text-sm mt-2">{project.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-slate-700/50 rounded-lg p-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("invite")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "invite"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Invite People
          </button>
          <button
            onClick={() => setActiveTab("collaborators")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "collaborators"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Team ({collaborators.filter((c) => c.status === "accepted").length})
          </button>
          {project.userPermissions?.canManage && (
            <>
              <button
                onClick={() => setActiveTab("requests")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "requests"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Clock className="w-4 h-4" />
                Requests ({accessRequests.length})
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "settings"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </>
          )}
        </div>

        {/* Invite Tab */}
        {activeTab === "invite" && (
          <div className="space-y-6">
            {/* Share Link */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/join/${project._id}`}
                  readOnly
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-slate-600 hover:bg-slate-700 text-white"
                  }`}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                {project.isPublic
                  ? "Anyone with this link can join as a viewer"
                  : "People with this link can request access"}
              </p>
            </div>

            {/* Email Invitation Form */}
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Single Email */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Single Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setBulkEmails(""); // Clear bulk when typing single
                    }}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter email address"
                    disabled={loading || bulkEmails.length > 0}
                  />
                </div>

                {/* Bulk Emails */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Bulk Emails
                  </label>
                  <textarea
                    value={bulkEmails}
                    onChange={(e) => {
                      setBulkEmails(e.target.value);
                      setEmail(""); // Clear single when typing bulk
                    }}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 h-20 resize-none"
                    placeholder="Enter multiple emails separated by commas or new lines"
                    disabled={loading || email.length > 0}
                  />
                </div>
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
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 h-20 resize-none"
                  placeholder="Add a personal message to your invitation..."
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={(!email.trim() && !bulkEmails.trim()) || loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </form>
            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}
          </div>
        )}

        {/* Collaborators Tab */}
        {activeTab === "collaborators" && (
          <div className="space-y-3">
            {collaborators.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No collaborators yet</p>
                <p className="text-slate-500 text-sm">
                  Invite people to start collaborating
                </p>
              </div>
            ) : (
              collaborators.map((collaborator) => (
                <div
                  key={collaborator.userId || collaborator._id}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {collaborator.username?.charAt(0).toUpperCase() ||
                          collaborator.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {collaborator.username || collaborator.email}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`px-2 py-1 rounded-full ${
                            collaborator.status === "accepted"
                              ? "bg-green-500/20 text-green-400"
                              : collaborator.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {collaborator.status}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-400 capitalize">
                          {collaborator.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {project.userPermissions?.canManage &&
                    collaborator.status === "accepted" && (
                      <div className="flex items-center gap-2">
                        <select
                          value={collaborator.role}
                          onChange={(e) =>
                            handleRoleUpdate(
                              collaborator.userId,
                              e.target.value
                            )
                          }
                          className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-xs"
                        >
                          {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            handleRemoveCollaborator(collaborator.userId)
                          }
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

        {/* Access Requests Tab */}
        {activeTab === "requests" && project.userPermissions?.canManage && (
          <div className="space-y-3">
            {accessRequests.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No pending requests</p>
                <p className="text-slate-500 text-sm">
                  Access requests will appear here
                </p>
              </div>
            ) : (
              accessRequests.map((request) => (
                <div
                  key={request._id}
                  className="p-4 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {request.username?.charAt(0).toUpperCase() ||
                              request.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {request.username || request.email}
                          </p>
                          <p className="text-slate-400 text-xs">
                            Requested{" "}
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {request.message && (
                        <p className="text-slate-300 text-sm bg-slate-600/50 rounded p-2 mt-2">
                          "{request.message}"
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() =>
                          handleAccessRequestResponse(request._id, "approve")
                        }
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleAccessRequestResponse(request._id, "reject")
                        }
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && project.userPermissions?.canManage && (
          <div className="space-y-6">
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Sharing Settings</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">
                      Public Access
                    </p>
                    <p className="text-slate-400 text-xs">
                      Allow anyone with the link to join
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={project.isPublic}
                    onChange={(e) =>
                      handleSettingsUpdate({
                        ...shareSettings,
                        isPublic: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">
                      Require Approval
                    </p>
                    <p className="text-slate-400 text-xs">
                      New members need approval to join
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={shareSettings.requireApproval}
                    onChange={(e) =>
                      handleSettingsUpdate({
                        ...shareSettings,
                        requireApproval: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Default Role for New Members
                  </label>
                  <select
                    value={shareSettings.defaultRole || "viewer"}
                    onChange={(e) =>
                      handleSettingsUpdate({
                        ...shareSettings,
                        defaultRole: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-yellow-400 font-semibold text-sm">
                    Privacy Notice
                  </h4>
                  <p className="text-yellow-300 text-xs mt-1">
                    Changing project visibility will affect how others can
                    access your project. Public projects can be discovered and
                    joined by anyone with the link.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareProjectModal;
