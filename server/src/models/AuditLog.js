const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  actor:     { type: String, required: true },    // e.g. "admin@topaz.com"
  action:    { type: String, required: true },    // e.g. "roll-quarter"
  details:   { type: String, default: '' },       // human-readable summary
});

auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
