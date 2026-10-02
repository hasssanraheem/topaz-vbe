const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    teamNumber: { type: Number, required: true, unique: true, min: 1, max: 8 },
    name:       { type: String, required: true },
    active:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
