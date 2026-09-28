const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    round: { type: Number, required: true },
    phase: { type: mongoose.Schema.Types.Mixed, required: true }, // Number or String
    data: { type: mongoose.Schema.Types.Mixed }, // flexible report output
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate reports for the same session+team+round+phase
reportSchema.index({ session: 1, team: 1, round: 1, phase: 1 }, { unique: true });

// Fast lookup: all reports for a session and a team
reportSchema.index({ session: 1, team: 1 });

module.exports = mongoose.model('Report', reportSchema);
