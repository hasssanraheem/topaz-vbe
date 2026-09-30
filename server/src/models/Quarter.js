const mongoose = require('mongoose');

// Quarter lifecycle: open → locked → processing → published
const quarterSchema = new mongoose.Schema({
  session:    { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  year:       { type: Number, required: true },
  quarter:    { type: Number, required: true, min: 1, max: 4 },
  status:     { type: String, enum: ['open', 'locked', 'processing', 'published'], default: 'open' },
  macro: {
    gdp_growth_pct:          { type: Number, default: 2.5 },
    inflation_pct:           { type: Number, default: 0.0 },
    recession:               { type: Boolean, default: false },
    central_bank_rate:       { type: Number, default: 8.0 },
    unemployment_pct:        { type: Number, default: 5.0 },
    material_price_change_pct: { type: Number, default: 0.0 },
  },
  deadline:    { type: Date, default: null },
  publishedAt: { type: Date, default: null },
  createdAt:   { type: Date, default: Date.now },
});

// Compound index: one quarter per year/quarter per session
quarterSchema.index({ session: 1, year: 1, quarter: 1 }, { unique: true });

module.exports = mongoose.model('Quarter', quarterSchema);
