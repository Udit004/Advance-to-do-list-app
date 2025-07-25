import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/config';
import { 
  Users, 
  Lock, 
  Globe, 
  UserPlus, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Clock,
  Shield,
  Eye,
  Edit,
  Crown
} from 'lucide-react';

const JoinProject = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [status, setStatus] = useState(null); // 'joined', 'requested', 'error', 'already_member'
  const [error, setError] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);

  useEffect(() => {
    fetchProjectInfo();
  }, [projectId]);

  const fetchProjectInfo = async () => {
    try {
      // Try to get public project info first
      const response = await API.get(`/projects/${projectId}/public`);
      setProject(response.data.data);
      
      // Check if user already has access
      if (currentUser) {
        try {
          const accessResponse = await API.get(`/projects/${projectId}`);
          if (accessResponse.data.success) {
            // User already has access
            setStatus('already_member');
            return;
          }
        } catch (accessError) {
          // User doesn't have access, which is expected for joining flow
          console.log('User needs to join/request access');
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      if (error.response?.status === 404) {
        setError('Project not found');
      } else {
        setError('Unable to load project information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPublicProject = async () => {
    if (!currentUser) {
      navigate('/login', { 
        state: { returnUrl: `/join/${projectId}` }
      });
      return;
    }

    setJoining(true);
    try {
      await API.post(`/projects/${projectId}/join`);
      setStatus('joined');
      setTimeout(() => {
        navigate(`/project/${projectId}/todos`);
      }, 2000);
    } catch (error) {
      console.error('Error joining project:', error);
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes('already have access')) {
        setStatus('already_member');
      } else {
        setError(error.response?.data?.message || 'Failed to join project');
      }
    } finally {
      setJoining(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!currentUser) {
      navigate('/login', { 
        state: { returnUrl: `/join/${projectId}` }
      });
      return;
    }

    if (!showMessageInput) {
      setShowMessageInput(true);
      return;
    }

    setRequesting(true);
    try {
      await API.post(`/projects/${projectId}/request-access`, {
        message: requestMessage.trim()
      });
      setStatus('requested');
    } catch (error) {
      console.error('Error requesting access:', error);
      if (error.response?.status === 400) {
        const message = error.response.data.message;
        if (message.includes('already has access')) {
          setStatus('already_member');
        } else if (message.includes('already pending')) {
          setError('You have already requested access to this project');
        } else {
          setError(message);
        }
      } else {
        setError('Failed to request access');
      }
    } finally {
      setRequesting(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4" />;
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'editor':
        return <Edit className="w-4 h-4" />;
      case 'viewer':
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'viewer':
        return 'Can view project and todos';
      case 'editor':
        return 'Can edit todos and project content';
      case 'admin':
        return 'Can manage collaborators and settings';
      default:
        return 'Can view project content';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading project information...</p>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Unable to Load Project</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/TodoDashboard')}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/TodoDashboard')}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </button>
          <h1 className="text-3xl font-bold text-white">Join Project</h1>
        </div>

        {/* Project Info Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{project?.name}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                  project?.isPublic 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {project?.isPublic ? (
                    <>
                      <Globe className="w-4 h-4" />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Private
                    </>
                  )}
                </span>
              </div>
              
              {project?.description && (
                <p className="text-slate-300 mb-4">{project.description}</p>
              )}
              
              <div className="text-sm text-slate-400">
                Created by <span className="text-slate-300 font-medium">{project?.ownerName}</span>
              </div>

              {/* Default Role Info */}
              {project?.shareSettings?.defaultRole && (
                <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    {getRoleIcon(project.shareSettings.defaultRole)}
                    <span className="text-slate-300 font-medium">
                      You'll join as: {project.shareSettings.defaultRole}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">
                    {getRoleDescription(project.shareSettings.defaultRole)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {status === 'joined' && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="text-green-400 font-semibold">Successfully Joined!</h3>
                  <p className="text-green-300 text-sm">Redirecting you to the project...</p>
                </div>
              </div>
            </div>
          )}

          {status === 'requested' && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-blue-400 font-semibold">Access Request Sent</h3>
                  <p className="text-blue-300 text-sm">
                    Your request has been sent to the project owner. You'll be notified when they respond.
                  </p>
                  {requestMessage && (
                    <div className="mt-2 p-2 bg-slate-600/50 rounded text-blue-200 text-xs">
                      <strong>Your message:</strong> "{requestMessage}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === 'already_member' && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-blue-400 font-semibold">You're Already a Member</h3>
                  <p className="text-blue-300 text-sm">
                    You already have access to this project.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="text-red-400 font-semibold">Error</h3>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!status && !error && (
            <div className="space-y-4">
              {!currentUser ? (
                <div className="text-center">
                  <p className="text-slate-300 mb-4">You need to log in to join this project</p>
                  <button
                    onClick={() => navigate('/login', { 
                      state: { returnUrl: `/join/${projectId}` }
                    })}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Log In to Continue
                  </button>
                </div>
              ) : project?.isPublic ? (
                <div className="text-center">
                  <p className="text-slate-300 mb-4">
                    This is a public project. You can join it directly.
                  </p>
                  <button
                    onClick={handleJoinPublicProject}
                    disabled={joining}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {joining ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Joining...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        Join Project
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-slate-300 mb-4">
                    This is a private project. You need to request access from the owner.
                  </p>
                  
                  {showMessageInput && (
                    <div className="mb-4">
                      <label className="block text-slate-300 text-sm font-medium mb-2 text-left">
                        Message to Project Owner (Optional)
                      </label>
                      <textarea
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 h-20 resize-none"
                        placeholder="Tell the owner why you'd like to join this project..."
                      />
                    </div>
                  )}
                  
                  <button
                    onClick={handleRequestAccess}
                    disabled={requesting}
                    className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {requesting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Requesting...
                      </>
                    ) : showMessageInput ? (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Send Request
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        Request Access
                      </>
                    )}
                  </button>
                  
                  {showMessageInput && (
                    <button
                      onClick={() => setShowMessageInput(false)}
                      className="ml-3 px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action buttons for existing members or completed actions */}
          {(status === 'requested' || status === 'already_member' || error) && (
            <div className="text-center mt-6 space-x-3">
              {status === 'already_member' && (
                <button
                  onClick={() => navigate(`/project/${projectId}/todos`)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Go to Project
                </button>
              )}
              <button
                onClick={() => navigate('/TodoDashboard')}
                className="px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="bg-slate-800/30 rounded-lg p-4 text-center">
          <p className="text-slate-400 text-sm">
            {project?.isPublic 
              ? "Public projects allow anyone with the link to join directly."
              : project?.shareSettings?.requireApproval
              ? "This project requires owner approval for all new members."
              : "Private projects require approval from the owner before you can access them."
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinProject;