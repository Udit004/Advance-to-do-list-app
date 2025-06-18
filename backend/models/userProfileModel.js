const Mongoose = require('mongoose');
const UserProfileSchema = new Mongoose.Schema(
  {
    uid: {
      type: String,
      required: [true, "uid is required"],
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      minlength: [3, "username must be at least 3 characters long"],
      maxlength: [100, "username cannot exceed 100 characters"],
    },
    email: {
      type: String,
      trim: true,
      minlength: [3, "email must be at least 3 characters long"],
      maxlength: [100, "email cannot exceed 100 characters"],
    },
    age: {
      type: Number,
    },
    profession: {
      type: String,
    },
    profileImage: { type: String },
    isPaid: { type: Boolean, default: false },
  },
  {
    timestamps: true, // Auto-manage createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserProfileSchema.index({ username: 'text' });
UserProfileSchema.index({ email: 'text' });
UserProfileSchema.index({ age: 1 });
UserProfileSchema.index({ profession: 'text' });

//// Middleware to update updatedAt before saving
UserProfileSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
  });
const userProfile = Mongoose.model('userProfile', UserProfileSchema);

module.exports = userProfile;