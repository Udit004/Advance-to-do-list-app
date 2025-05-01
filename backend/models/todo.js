const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  task: {
    type: String,
    required: [true, 'Task is required'],
    trim: true,
    minlength: [3, 'Task must be at least 3 characters long'],
    maxlength: [100, 'Task cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > Date.now();
      },
      message: 'Due date must be in the future'
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: String,
    required: [true, 'User ID is required']
  },
  completeDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Auto-manage createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
todoSchema.index({ task: 'text' });
todoSchema.index({ dueDate: 1 });
todoSchema.index({ isCompleted: 1 });

// Virtual property for status
todoSchema.virtual('status').get(function() {
  if (this.isCompleted) return 'completed';
  if (this.dueDate && this.dueDate < new Date()) return 'overdue';
  return 'pending';
});

// Middleware to update updatedAt before saving
todoSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;