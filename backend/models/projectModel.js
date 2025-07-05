const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [3, 'Project name must be at least 3 characters long'],
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  owner: {
    type: String,
    required: [true, 'Owner ID is required'],
    index: true
  },
  collaborators: [
    {
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
      role: {
        type: String,
        enum: ['editor', 'viewer'],
        default: 'editor'
      },
      invitedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
      }
    }
  ],
  todos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Todo' // Reference to your existing Todo model
    }
  ],
  isPublic: {
    type: Boolean,
    default: false
  },
  settings: {
    allowCollaboratorInvites: {
      type: Boolean,
      default: true
    },
    allowTodoCreation: {
      type: Boolean,
      default: true
    },
    allowTodoEditing: {
      type: Boolean,
      default: true
    }
  },
  tags: [
    {
      type: String,
      trim: true,
      maxlength: 30
    }
  ],
  color: {
    type: String,
    default: 'blue', // For UI theming
    enum: ['blue', 'green', 'purple', 'orange', 'red', 'indigo', 'pink', 'gray']
  },
  stats: {
    totalTodos: {
      type: Number,
      default: 0
    },
    completedTodos: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ 'collaborators.userId': 1, 'collaborators.status': 1 });
projectSchema.index({ isPublic: 1, createdAt: -1 });

// Virtual for completion percentage
projectSchema.virtual('completionPercentage').get(function() {
  if (this.stats.totalTodos === 0) return 0;
  return Math.round((this.stats.completedTodos / this.stats.totalTodos) * 100);
});

// Virtual to check if user has access
projectSchema.methods.hasAccess = function(userId) {
  return this.owner === userId || 
         this.collaborators.some(collab => collab.userId === userId && collab.status === 'accepted') ||
         this.isPublic;
};

// Virtual to get user's role in project
projectSchema.methods.getUserRole = function(userId) {
  if (this.owner === userId) return 'owner';
  
  const collaborator = this.collaborators.find(collab => 
    collab.userId === userId && collab.status === 'accepted'
  );
  
  return collaborator ? collaborator.role : null;
};

// Method to add collaborator
projectSchema.methods.addCollaborator = function(userInfo) {
  const existingCollab = this.collaborators.find(collab => 
    collab.userId === userInfo.userId || collab.email === userInfo.email
  );
  
  if (existingCollab) {
    throw new Error('User is already a collaborator');
  }
  
  this.collaborators.push({
    userId: userInfo.userId,
    email: userInfo.email,
    username: userInfo.username || '',
    role: userInfo.role || 'editor',
    status: 'pending'
  });
  
  return this.save();
};

// Method to update stats (call this when todos change)
projectSchema.methods.updateStats = async function() {
  const Todo = mongoose.model('Todo');
  const todos = await Todo.find({ _id: { $in: this.todos } });
  
  this.stats.totalTodos = todos.length;
  this.stats.completedTodos = todos.filter(todo => todo.isCompleted).length;
  this.stats.lastActivity = new Date();
  
  return this.save();
};

// Pre-save middleware
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Post-save middleware to update stats
projectSchema.post('save', async function(doc) {
  if (doc.todos && doc.todos.length > 0) {
    await doc.updateStats();
  }
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;


