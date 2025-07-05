import React from 'react';
import { UserPlus } from 'lucide-react';

/**
 * Pending Invitations Component
 * Displays and handles project invitations
 */
const PendingInvitations = ({ invitations, onRespond }) => {
  // Don't render if no invitations
  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/30 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <UserPlus className="w-5 h-5 text-yellow-400" />
        <h3 className="text-white font-semibold">Pending Invitations</h3>
        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
          {invitations.length}
        </span>
      </div>
      
      <div className="space-y-2">
        {invitations.map((invitation) => (
          <div key={invitation._id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
            <div className="flex-1">
              <p className="text-white font-medium">{invitation.name}</p>
              {invitation.description && (
                <p className="text-slate-400 text-sm">{invitation.description}</p>
              )}
              <p className="text-slate-500 text-xs mt-1">
                Invited by {invitation.inviterName || 'Someone'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => onRespond(invitation._id, 'accept')}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => onRespond(invitation._id, 'decline')}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingInvitations;