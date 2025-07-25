const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    // FIX: Change from ObjectId to String to support Firebase UIDs
    type: String, // Changed from mongoose.Schema.Types.ObjectId
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: 'blue'
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Enhanced collaboration features
  collaborators: [{
    userId: {
      type: String, // Firebase UID or MongoDB ObjectId
      required: true
    },
    email: {
      type: String,
      required: true
    },
    username: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    invitedBy: {
      type: String, // User ID who sent the invitation
      required: true
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: {
      type: Date
    },
    permissions: {
      canEdit: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      canInvite: { type: Boolean, default: false },
      canManageRoles: { type: Boolean, default: false }
    }
  }],

  // Access requests for private projects
  accessRequests: [{
    userId: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    username: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: {
      type: Date
    },
    respondedBy: {
      type: String // Owner or admin who responded
    }
  }],

  // Sharing settings
  shareSettings: {
    allowPublicLink: {
      type: Boolean,
      default: true
    },
    linkExpiry: {
      type: Date,
      default: null
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    defaultRole: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer'
    }
  },

  // Activity tracking
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  todos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Todo'
  }]
}, {
  timestamps: true
});

// Index for better performance
projectSchema.index({ owner: 1 });
projectSchema.index({ 'collaborators.userId': 1 });
projectSchema.index({ 'accessRequests.userId': 1 });
projectSchema.index({ isPublic: 1 });

// Methods - FIXED to work with string IDs
projectSchema.methods.hasAccess = function(userId) {
  if (!userId) return false;
  
  // Owner always has access - FIX: Direct string comparison
  if (this.owner === userId) return true;
  
  // Check if user is an accepted collaborator
  const collaborator = this.collaborators.find(
    c => c.userId === userId && c.status === 'accepted'
  );
  
  return !!collaborator;
};

projectSchema.methods.getUserRole = function(userId) {
  if (!userId) return null;
  
  // FIX: Direct string comparison instead of toString()
  if (this.owner === userId) return 'owner';
  
  const collaborator = this.collaborators.find(
    c => c.userId === userId && c.status === 'accepted'
  );
  
  return collaborator ? collaborator.role : null;
};

projectSchema.methods.canUserEdit = function(userId) {
  const role = this.getUserRole(userId);
  return ['owner', 'admin', 'editor'].includes(role);
};

projectSchema.methods.canUserManage = function(userId) {
  const role = this.getUserRole(userId);
  return ['owner', 'admin'].includes(role);
};

projectSchema.methods.addCollaborator = function(collaboratorData) {
  const { userId, email, username, role = 'viewer', invitedBy } = collaboratorData;
  
  // Check if user is already a collaborator
  const existingCollaborator = this.collaborators.find(c => c.userId === userId);
  if (existingCollaborator) {
    throw new Error('User is already a collaborator');
  }
  
  // Set permissions based on role
  const permissions = this.getPermissionsByRole(role);
  
  this.collaborators.push({
    userId,
    email,
    username: username || '',
    role,
    status: 'pending',
    invitedBy,
    permissions
  });
  
  return this.save();
};

projectSchema.methods.getPermissionsByRole = function(role) {
  const rolePermissions = {
    viewer: {
      canEdit: false,
      canDelete: false,
      canInvite: false,
      canManageRoles: false
    },
    editor: {
      canEdit: true,
      canDelete: false,
      canInvite: false,
      canManageRoles: false
    },
    admin: {
      canEdit: true,
      canDelete: true,
      canInvite: true,
      canManageRoles: true
    }
  };
  
  return rolePermissions[role] || rolePermissions.viewer;
};

projectSchema.methods.updateCollaboratorRole = function(userId, newRole) {
  const collaborator = this.collaborators.find(c => c.userId === userId);
  if (!collaborator) {
    throw new Error('Collaborator not found');
  }
  
  collaborator.role = newRole;
  collaborator.permissions = this.getPermissionsByRole(newRole);
  
  return this.save();
};

projectSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(c => c.userId !== userId);
  return this.save();
};

projectSchema.methods.respondToInvitation = function(userId, action) {
  const collaborator = this.collaborators.find(
    c => c.userId === userId && c.status === 'pending'
  );
  
  if (!collaborator) {
    throw new Error('Invitation not found');
  }
  
  collaborator.status = action === 'accept' ? 'accepted' : 'declined';
  collaborator.respondedAt = new Date();
  
  return this.save();
};

projectSchema.methods.requestAccess = function(requestData) {
  const { userId, email, username, message = '' } = requestData;
  
  // Check if user already has access or pending request
  const hasAccess = this.hasAccess(userId);
  const existingRequest = this.accessRequests.find(
    r => r.userId === userId && r.status === 'pending'
  );
  
  if (hasAccess) {
    throw new Error('User already has access');
  }
  
  if (existingRequest) {
    throw new Error('Access request already pending');
  }
  
  this.accessRequests.push({
    userId,
    email,
    username: username || '',
    message
  });
  
  return this.save();
};

projectSchema.methods.respondToAccessRequest = function(requestId, action, responderId) {
  const request = this.accessRequests.id(requestId);
  if (!request) {
    throw new Error('Access request not found');
  }
  
  request.status = action === 'approve' ? 'approved' : 'rejected';
  request.respondedAt = new Date();
  request.respondedBy = responderId;
  
  // If approved, add as collaborator
  if (action === 'approve') {
    const permissions = this.getPermissionsByRole(this.shareSettings.defaultRole);
    
    this.collaborators.push({
      userId: request.userId,
      email: request.email,
      username: request.username,
      role: this.shareSettings.defaultRole,
      status: 'accepted',
      invitedBy: responderId,
      invitedAt: new Date(),
      respondedAt: new Date(),
      permissions
    });
  }
  
  return this.save();
};

// Update last activity
projectSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

module.exports = mongoose.model('Project', projectSchema);