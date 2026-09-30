const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    team:    { type: mongoose.Schema.Types.ObjectId, ref: 'Team',    required: true },
    round:   { type: String, required: true }, // e.g. "2024-Q1"
    data:    { type: mongoose.Schema.Types.Mixed },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One report per team per round per session
reportSchema.index({ session: 1, team: 1, round: 1 }, { unique: true });
reportSchema.index({ session: 1, team: 1 });

module.exports = mongoose.model('Report', reportSchema);
