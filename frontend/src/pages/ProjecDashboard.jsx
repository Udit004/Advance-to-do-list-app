import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/config';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import child components
import DashboardHeader from './components/DashboardHeader';
import StatsCards from './components/StatsCards';
import PendingInvitations from './components/PendingInvitations';
import SearchAndFilters from './components/SearchAndFilters';
import CreateProjectModal from './components/CreateProjectModal';
import ProjectGrid from './components/ProjectGrid';
import ProjectList from './components/ProjectList';
import LoadingSpinner from './components/LoadingSpinner';

/**
 * Main ProjectDashboard Component
 * Handles project data fetching and state management
 */
const ProjectDashboard = () => {
  const { currentUser } = useAuth();
  
  // State management
  const [projects, setProjects] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'owned', 'shared'
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [currentUser]);

  /**
   * Fetch projects and invitations from API
   */
  const fetchData = async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      const [projectsResponse, invitationsResponse] = await Promise.all([
        API.get(`/projects/user/${currentUser.uid}?includePublic=true`),
        API.get('/projects/invitations/pending')
      ]);
      
      setProjects(projectsResponse.data.data || []);
      setPendingInvitations(invitationsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle project creation
   */
  const handleCreateProject = async (projectData) => {
    try {
      const response = await API.post('/projects/create', projectData);
      setProjects([response.data.data, ...projects]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error; // Re-throw to handle in modal
    }
  };

  /**
   * Handle invitation responses (accept/decline)
   */
  const handleInvitationResponse = async (projectId, action) => {
    try {
      await API.post(`/projects/${projectId}/respond`, { action });
      setPendingInvitations(prev => prev.filter(inv => inv._id !== projectId));
      if (action === 'accept') {
        fetchData(); // Refresh to show newly accepted project
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
    }
  };

  /**
   * Filter projects based on search term and status
   */
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (filterStatus) {
      case 'owned':
        return project.userRole === 'owner';
      case 'shared':
        return project.userRole !== 'owner';
      default:
        return true;
    }
  });

  // Loading state - NOW USING LoadingSpinner COMPONENT
  if (loading) {
    return <LoadingSpinner />;
  }

  // Authentication required state
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-slate-300 mb-6">Please log in to access your projects.</p>
          <Link 
            to="/login" 
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-slate-900 font-semibold rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all duration-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Header - USING COMPONENT */}
        <DashboardHeader onCreateProject={() => setShowCreateForm(true)} />

        {/* Statistics Cards - USING COMPONENT */}
        <StatsCards 
          projects={projects}
          pendingInvitations={pendingInvitations}
        />

        {/* Pending Invitations - USING COMPONENT */}
        <PendingInvitations 
          invitations={pendingInvitations}
          onRespond={handleInvitationResponse}
        />

        {/* Search and Filters - USING COMPONENT */}
        <SearchAndFilters 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Create Project Modal - USING COMPONENT */}
        {showCreateForm && (
          <CreateProjectModal 
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleCreateProject}
          />
        )}

        {/* Projects Display - USING BOTH COMPONENTS */}
        {viewMode === 'grid' ? (
          <ProjectGrid projects={filteredProjects} />
        ) : (
          <ProjectList projects={filteredProjects} />
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;