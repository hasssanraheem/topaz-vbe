const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    firebaseUid: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'team'], required: true },
    // null for admin; ObjectId ref to Team for team users
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  },
  { timestamps: true }
);

// Validate that team users always have a team ref
userSchema.pre('save', function (next) {
  if (this.role === 'team' && !this.team) {
    return next(new Error('Team users must have a team reference'));
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
