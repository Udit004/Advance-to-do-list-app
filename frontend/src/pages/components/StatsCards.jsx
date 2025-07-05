import React from 'react';
import { FolderOpen, Users, Clock, TrendingUp } from 'lucide-react';

/**
 * Statistics Cards Component
 * Displays project statistics in card format
 */
const StatsCards = ({ projects, pendingInvitations }) => {
  // Calculate average completion percentage
  const avgCompletion = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + (p.completionPercentage || 0), 0) / projects.length)
    : 0;

  // Count collaborations (projects where user is not owner)
  const collaborationsCount = projects.filter(p => p.userRole !== 'owner').length;

  const stats = [
    {
      title: 'Total Projects',
      value: projects.length,
      icon: FolderOpen,
      color: 'blue',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400'
    },
    {
      title: 'Collaborations',
      value: collaborationsCount,
      icon: Users,
      color: 'green',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400'
    },
    {
      title: 'Pending Invites',
      value: pendingInvitations.length,
      icon: Clock,
      color: 'orange',
      bgColor: 'bg-orange-500/20',
      textColor: 'text-orange-400'
    },
    {
      title: 'Avg Completion',
      value: `${avgCompletion}%`,
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">{stat.title}</p>
                <p className="text-white text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;