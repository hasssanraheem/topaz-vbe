const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    currentRound: { type: Number, default: 1 },
    currentPhase: { type: Number, default: 1 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Fields shown read-only on the team decision form header
    simulationCode: { type: String, default: '' },
    groupNumber: { type: String, default: '' },
    startYear: { type: Number, default: 2024 },
    startQuarter: { type: Number, min: 1, max: 4, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
