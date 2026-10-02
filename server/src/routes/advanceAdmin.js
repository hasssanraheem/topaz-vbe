// advanceAdmin.js — endpoints for the Advance tab sections.
// All routes require a valid token (any authenticated user).

const express    = require('express');
const router     = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Session    = require('../models/Session');
const Team       = require('../models/Team');
const Quarter    = require('../models/Quarter');
const Decision   = require('../models/Decision');
const AuditLog   = require('../models/AuditLog');

router.use(verifyToken);

// ── Helpers ────────────────────────────────────────────────────────────────────

async function _getSession() {
  return Session.findOne().sort({ createdAt: -1 });
}

async function _getOpenQuarter(sessionId) {
  return Quarter.findOne({ session: sessionId, status: 'open' })
    .sort({ year: -1, quarter: -1 });
}

// ── GET /api/advance-admin/session-info ───────────────────────────────────────
// Returns industry/session info for the Industries panel.

router.get('/session-info', async (req, res) => {
  try {
    const session = await _getSession();
    if (!session) return res.json({ industry: 'Demo Industry', simulationCode: 'TOPAZ-DEMO', companies: 8 });
    res.json({
      industry:       session.name || 'Demo Industry',
      simulationCode: session.simulationCode || 'TOPAZ-DEMO',
      companies:      8,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/advance-admin/companies ──────────────────────────────────────────
// Returns all 8 company rows for the Teams panel.

router.get('/companies', async (req, res) => {
  try {
    const teams = await Team.find().sort({ teamNumber: 1 });
    res.json(teams.map(t => ({
      id:          t._id,
      teamNumber:  t.teamNumber,
      name:        t.name,
      group:       1,
      identity:    `ID-100${t.teamNumber}`,
      active:      t.active !== false,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/advance-admin/companies/:num/toggle ─────────────────────────────
// Toggles a company's active status.

router.post('/companies/:num/toggle', async (req, res) => {
  try {
    const num  = parseInt(req.params.num, 10);
    const team = await Team.findOne({ teamNumber: num });
    if (!team) return res.status(404).json({ error: 'Company not found' });

    team.active = !team.active;
    await team.save();

    await AuditLog.create({
      actor:   req.user.email,
      action:  team.active ? 'activate-company' : 'deactivate-company',
      details: `Company ${num} (${team.name}) ${team.active ? 'activated' : 'deactivated'}`,
    });

    res.json({ teamNumber: num, active: team.active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/advance-admin/all-quarters ───────────────────────────────────────
// Returns all quarters for the current session (for the Quarters & Roll panel).

router.get('/all-quarters', async (req, res) => {
  try {
    const session = await _getSession();
    if (!session) return res.json({ quarters: [], openQuarter: null });

    const quarters = await Quarter.find({ session: session._id })
      .sort({ year: 1, quarter: 1 });

    const openQ = quarters.find(q => q.status === 'open');

    res.json({
      quarters: quarters.map(q => ({
        id:          q._id,
        year:        q.year,
        quarter:     q.quarter,
        status:      q.status.toUpperCase(),
        deadline:    q.deadline || null,
        publishedAt: q.publishedAt || null,
      })),
      openQuarter: openQ
        ? { year: openQ.year, quarter: openQ.quarter }
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/advance-admin/economic-shocks ────────────────────────────────────
// Returns the macro settings for the current open quarter.

router.get('/economic-shocks', async (req, res) => {
  try {
    const session = await _getSession();
    const quarter = session ? await _getOpenQuarter(session._id) : null;

    const defaults = {
      gdp_growth_pct: 2.5,
      inflation_pct: 0,
      recession: false,
      central_bank_rate: 8,
      unemployment_pct: 5,
      material_price_change_pct: 0,
      strike_weeks: 0,
      strike_weeks_next: 0,
    };

    res.json({
      macro:       quarter?.macro || defaults,
      openQuarter: quarter ? { year: quarter.year, quarter: quarter.quarter } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/advance-admin/economic-shocks ────────────────────────────────────
// Saves macro settings to the current open quarter.

router.put('/economic-shocks', async (req, res) => {
  try {
    const session = await _getSession();
    if (!session) return res.status(404).json({ error: 'No active session' });

    let quarter = await _getOpenQuarter(session._id);
    if (!quarter) {
      // Auto-open first quarter if none exists
      quarter = await Quarter.create({
        session:  session._id,
        year:     session.startYear || 2024,
        quarter:  session.startQuarter || 1,
        status:   'open',
      });
    }

    const {
      gdp_growth_pct, inflation_pct, recession,
      central_bank_rate, unemployment_pct,
      material_price_change_pct, strike_weeks, strike_weeks_next,
    } = req.body;

    quarter.macro = {
      gdp_growth_pct:            Number(gdp_growth_pct)            ?? 2.5,
      inflation_pct:             Number(inflation_pct)             ?? 0,
      recession:                 Boolean(recession),
      central_bank_rate:         Number(central_bank_rate)         ?? 8,
      unemployment_pct:          Number(unemployment_pct)          ?? 5,
      material_price_change_pct: Number(material_price_change_pct) ?? 0,
      strike_weeks:              Math.min(3, Math.max(0, Number(strike_weeks)     || 0)),
      strike_weeks_next:         Math.min(3, Math.max(0, Number(strike_weeks_next) || 0)),
    };

    await quarter.save();

    await AuditLog.create({
      actor:   req.user.email,
      action:  'save-economic-settings',
      details: `Economic shocks saved for Year ${quarter.year} Q${quarter.quarter}`,
    });

    res.json({ saved: true, macro: quarter.macro });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/advance-admin/decision-status ───────────────────────────────────
// Returns per-company decision status for the current open quarter.
// status: 'not_saved' | 'saved' | 'submitted'

router.get('/decision-status', async (req, res) => {
  try {
    const session = await _getSession();
    const teams   = await Team.find().sort({ teamNumber: 1 });

    if (!session) {
      return res.json(teams.map(t => ({
        companyNumber: t.teamNumber, name: t.name, status: 'not_saved',
      })));
    }

    const quarter = await _getOpenQuarter(session._id);

    const result = await Promise.all(teams.map(async t => {
      if (!quarter) return { companyNumber: t.teamNumber, name: t.name, status: 'not_saved' };
      const dec = await Decision.findOne({ team: t._id, quarter: quarter._id });
      let status = 'not_saved';
      if (dec?.submitted) status = 'submitted';
      else if (dec?.data)  status = 'saved';
      return { companyNumber: t.teamNumber, name: t.name, status };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/advance-admin/reset-session ────────────────────────────────────
// Marks the current session as completed and starts a fresh one at 2024 Q1.
// Old reports/decisions stay in the DB tied to the old session.

router.post('/reset-session', async (req, res) => {
  try {
    const User = require('../models/User');

    const oldSession = await _getSession();

    // Mark old session completed
    if (oldSession) {
      oldSession.status      = 'completed';
      oldSession.completedAt = new Date();
      await oldSession.save();
    }

    // Find the admin user record for createdBy
    const adminUser = await User.findOne({ email: req.user.email });
    if (!adminUser) return res.status(403).json({ error: 'Admin user record not found.' });

    // Create a fresh session with same meta but reset year/quarter
    const newSession = await Session.create({
      name:           oldSession?.name           || 'Topaz-VBE Demo',
      simulationCode: oldSession?.simulationCode || 'TOPAZ-DEMO',
      groupNumber:    oldSession?.groupNumber    || 1,
      startYear:      2024,
      startQuarter:   1,
      createdBy:      adminUser._id,
      status:         'active',
    });

    // Open 2024 Q1 for the new session
    await Quarter.create({
      session: newSession._id,
      year:    2024,
      quarter: 1,
      status:  'open',
    });

    await AuditLog.create({
      actor:   req.user.email,
      action:  'reset-session',
      details: `New simulation season started. Previous session ${oldSession?._id || 'none'} archived.`,
    });

    res.json({ reset: true, newSessionId: newSession._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/advance-admin/audit-log ─────────────────────────────────────────
// Returns the 50 most recent audit log entries.

router.get('/audit-log', async (req, res) => {
  try {
    const limit   = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const entries = await AuditLog.find().sort({ timestamp: -1 }).limit(limit);
    res.json(entries.map(e => ({
      id:        e._id,
      timestamp: e.timestamp,
      actor:     e.actor,
      action:    e.action,
      details:   e.details,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
