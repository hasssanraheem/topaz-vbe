const mongoose = require('mongoose');

// Server-side decision storage — one document per team per quarter.
// `data` holds the engine-format decision object (snake_case, matches simulation.js input).
const decisionSchema = new mongoose.Schema({
  team:        { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  quarter:     { type: mongoose.Schema.Types.ObjectId, ref: 'Quarter', required: true },
  data:        { type: mongoose.Schema.Types.Mixed, default: {} },
  submitted:   { type: Boolean, default: false },
  autoPass:    { type: Boolean, default: false },
  submittedAt: { type: Date, default: null },
  savedAt:     { type: Date, default: Date.now },
});

// One draft per team per quarter
decisionSchema.index({ team: 1, quarter: 1 }, { unique: true });

module.exports = mongoose.model('Decision', decisionSchema);
