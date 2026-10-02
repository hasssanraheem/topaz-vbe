// decisions.js — decision CRUD + reports + advance.
// All endpoints require a verified token (any role).

const express      = require('express');
const router       = express.Router();
const verifyToken  = require('../middleware/verifyToken');
const Decision     = require('../models/Decision');
const Quarter      = require('../models/Quarter');
const Team         = require('../models/Team');
const Report       = require('../models/Report');
const Session      = require('../models/Session');
const AuditLog     = require('../models/AuditLog');
const { validateDecisions } = require('../engine/validation');
const { computeQuarter }    = require('../engine/simulation');
const { frontendToEngine }  = require('../engine/adapter');
const { DEFAULT_DECISIONS } = require('../engine/tables');

// ── Helpers ────────────────────────────────────────────────────────────────────

async function _getSessionId() {
  const s = await Session.findOne().sort({ createdAt: -1 });
  return s?._id || null;
}

async function _getSession() {
  return Session.findOne().sort({ createdAt: -1 });
}

async function _getActiveQuarter(sessionId) {
  return Quarter.findOne({ session: sessionId, status: { $in: ['open', 'locked'] } })
    .sort({ year: -1, quarter: -1 });
}

async function _getTeamByNumber(n) {
  return Team.findOne({ teamNumber: Number(n) });
}

async function _getAllTeams() {
  return Team.find().sort({ teamNumber: 1 });
}

// ── GET /api/decisions/all — all 8 companies' current decisions ───────────────
// Returns array: [{ companyNumber, decisions, submitted }]

router.get('/all', verifyToken, async (req, res) => {
  try {
    const sessionId = await _getSessionId();
    const teams     = await _getAllTeams();
    const quarter   = sessionId ? await _getActiveQuarter(sessionId) : null;

    const result = await Promise.all(teams.map(async t => {
      const dec = quarter
        ? await Decision.findOne({ team: t._id, quarter: quarter._id })
        : null;
      return {
        companyNumber: t.teamNumber,
        decisions:     dec?.data || null,
        submitted:     dec?.submitted || false,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('GET /decisions/all error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/decisions — fetch one company's current draft ────────────────────
// Uses ?company=N or falls back to the logged-in user's teamNumber.

router.get('/', verifyToken, async (req, res) => {
  try {
    const companyNumber = req.query.company || req.user.teamNumber;
    const team = await _getTeamByNumber(companyNumber);
    if (!team) return res.status(404).json({ error: 'Team not found.' });

    const sessionId = await _getSessionId();
    const quarter   = sessionId ? await _getActiveQuarter(sessionId) : null;
    if (!quarter) return res.json({ data: null, submitted: false, quarterStatus: null });

    const dec = await Decision.findOne({ team: team._id, quarter: quarter._id });
    return res.json({
      data:          dec?.data || null,
      submitted:     dec?.submitted || false,
      quarterStatus: quarter.status,
      quarterId:     quarter._id,
      year:          quarter.year,
      quarter:       quarter.quarter,
    });
  } catch (err) {
    console.error('GET /decisions error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── PUT /api/decisions — save draft for a company ─────────────────────────────
// Body: { companyNumber: N, data: { ...decisionFields } }

router.put('/', verifyToken, async (req, res) => {
  try {
    const companyNumber = req.body.companyNumber || req.user.teamNumber;
    const team = await _getTeamByNumber(companyNumber);
    if (!team) return res.status(404).json({ error: 'Team not found.' });

    const sessionId = await _getSessionId();

    // If no session exists yet, create one automatically
    let session = await _getSession();
    if (!session) {
      session = await Session.create({ simulationCode: 'SIM', groupNumber: 1, startYear: 2024, startQuarter: 1 });
    }

    let quarter = await _getActiveQuarter(session._id);
    // Auto-open a quarter if none exists
    if (!quarter) {
      const last = await Quarter.findOne({ session: session._id }).sort({ year: -1, quarter: -1 });
      let year = session.startYear || 2024;
      let qtr  = session.startQuarter || 1;
      if (last) {
        year = last.year; qtr = last.quarter + 1;
        if (qtr > 4) { qtr = 1; year++; }
      }
      quarter = await Quarter.create({ session: session._id, year, quarter: qtr, status: 'open' });
    }

    if (quarter.status === 'locked') {
      return res.status(409).json({ error: 'Quarter is locked. Decisions can no longer be changed.' });
    }

    const data   = req.body.data || {};
    const errors = validateDecisions(data, null);

    await Decision.findOneAndUpdate(
      { team: team._id, quarter: quarter._id },
      { $set: { data, savedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.json({ saved: true, errors });
  } catch (err) {
    console.error('PUT /decisions error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/decisions/submit — lock a company's decisions for the quarter ────
// Body: { companyNumber: N }  (or omit to use the logged-in user's team)

router.post('/submit', verifyToken, async (req, res) => {
  try {
    const companyNumber = req.body.companyNumber || req.user.teamNumber;
    const team = await _getTeamByNumber(companyNumber);
    if (!team) return res.status(404).json({ error: 'Team not found.' });

    const session = await _getSession();
    if (!session) return res.status(404).json({ error: 'No active session.' });

    const quarter = await _getActiveQuarter(session._id);
    if (!quarter) return res.status(404).json({ error: 'No open quarter.' });
    if (quarter.status === 'locked') {
      return res.status(409).json({ error: 'Quarter is locked — submissions are closed.' });
    }

    const dec = await Decision.findOne({ team: team._id, quarter: quarter._id });
    if (!dec || !dec.data) {
      return res.status(400).json({ error: 'No saved decisions found. Please save first.' });
    }

    dec.submitted = true;
    await dec.save();

    res.json({ submitted: true, companyNumber });
  } catch (err) {
    console.error('POST /decisions/submit error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/decisions/report — one company's latest published report ──────────

router.get('/report', verifyToken, async (req, res) => {
  try {
    const companyNumber = req.query.company || req.user.teamNumber;
    const team          = await _getTeamByNumber(companyNumber);
    if (!team) return res.status(404).json({ error: 'Team not found.' });

    const sessionId = await _getSessionId();
    const filter    = { session: sessionId, team: team._id };
    if (req.query.year && req.query.quarter) {
      filter.round = `${req.query.year}-Q${req.query.quarter}`;
    }

    const report = await Report.findOne(filter).sort({ generatedAt: -1 });
    if (!report) return res.json({ report: null });
    res.json({ report: report.data, round: report.round, generatedAt: report.generatedAt });
  } catch (err) {
    console.error('GET /decisions/report error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/reports/all — all companies' published reports ───────────────────
// Returns array: [{ companyNumber, round, data }], all quarters, newest first.
// Optional query params: ?year=2024&quarter=1 to filter server-side.

router.get('/reports/all', verifyToken, async (req, res) => {
  try {
    const sessionId = await _getSessionId();
    if (!sessionId) return res.json([]);

    const teams  = await _getAllTeams();
    const teamMap = {};
    for (const t of teams) teamMap[t._id.toString()] = t.teamNumber;

    const filter = { session: sessionId };
    if (req.query.year && req.query.quarter) {
      filter.round = `${req.query.year}-Q${req.query.quarter}`;
    }

    const reports = await Report.find(filter).sort({ generatedAt: -1 });

    const result = reports
      .filter(r => r.data)
      .map(r => ({
        companyNumber: teamMap[r.team?.toString()] || null,
        round:         r.round || null,
        data:          r.data,
      }))
      .filter(r => r.companyNumber !== null);

    res.json(result);
  } catch (err) {
    console.error('GET /reports/all error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/advance — open + roll quarter in one step ───────────────────────
// Any authenticated user can trigger this.

router.post('/advance', verifyToken, async (req, res) => {
  try {
    let session = await _getSession();
    if (!session) {
      session = await Session.create({ simulationCode: 'SIM', groupNumber: 1, startYear: 2024, startQuarter: 1 });
    }

    // Determine the quarter to roll (or open a new one)
    let quarter = await Quarter.findOne({
      session: session._id,
      status: { $in: ['open', 'locked'] },
    }).sort({ year: -1, quarter: -1 });

    if (!quarter) {
      // Open a brand-new quarter
      const last = await Quarter.findOne({ session: session._id }).sort({ year: -1, quarter: -1 });
      let year = session.startYear || 2024;
      let qtr  = session.startQuarter || 1;
      if (last) {
        year = last.year; qtr = last.quarter + 1;
        if (qtr > 4) { qtr = 1; year++; }
      }
      quarter = await Quarter.create({ session: session._id, year, quarter: qtr, status: 'open' });
    }

    if (!['open', 'locked'].includes(quarter.status)) {
      return res.status(409).json({ error: `Quarter is already ${quarter.status}.` });
    }

    // Lock → Processing → Roll
    quarter.status = 'locked';
    await quarter.save();

    const teams     = await _getAllTeams();
    const prevReports = await Report.find({ session: session._id }).sort({ generatedAt: -1 });

    const teamInputs = [];
    for (const team of teams) {
      const dec  = await Decision.findOne({ quarter: quarter._id, team: team._id });
      const prev = prevReports.find(r => r.team?.toString() === team._id.toString());
      const rawDec    = dec?.data || null;
      const engineDec = rawDec ? frontendToEngine(rawDec) : DEFAULT_DECISIONS;

      teamInputs.push({
        team_id:   team._id.toString(),
        team: {
          company_number: team.teamNumber,
          name:           team.name || `Company ${team.teamNumber}`,
          group_number:   session.groupNumber || 1,
        },
        decisions:  engineDec,
        prev:       prev?.data || null,
        auto_pass:  !dec?.submitted,
      });
    }

    quarter.status = 'processing';
    await quarter.save();

    const industry = { id: session._id.toString(), simulation_code: session.simulationCode || 'SIM' };
    const reports  = computeQuarter(industry, quarter.year, quarter.quarter, teamInputs, quarter.macro || {});

    const now = new Date();
    for (const team of teams) {
      const reportData = reports[team._id.toString()];
      if (!reportData) continue;
      await Report.findOneAndUpdate(
        { session: session._id, team: team._id, round: `${quarter.year}-Q${quarter.quarter}` },
        { $set: { data: reportData, generatedAt: now } },
        { upsert: true }
      );
    }

    quarter.status      = 'published';
    quarter.publishedAt = now;
    await quarter.save();

    // Open the NEXT quarter automatically
    let nextYear = quarter.year;
    let nextQtr  = quarter.quarter + 1;
    if (nextQtr > 4) { nextQtr = 1; nextYear++; }
    await Quarter.findOneAndUpdate(
      { session: session._id, year: nextYear, quarter: nextQtr },
      { $setOnInsert: { session: session._id, year: nextYear, quarter: nextQtr, status: 'open' } },
      { upsert: true }
    );

    const autoPassed = teamInputs.filter(t => t.auto_pass).map(t => t.team.company_number);
    await AuditLog.create({
      actor:   req.user?.email || 'admin',
      action:  'roll-quarter',
      details: `Year ${quarter.year} Quarter ${quarter.quarter} published for ${teams.length} teams` +
               (autoPassed.length ? ` (auto-passed: companies ${autoPassed.join(', ')})` : ''),
    });

    res.json({
      message: `Quarter ${quarter.year} Q${quarter.quarter} published successfully.`,
      teamsProcessed: teams.length,
    });
  } catch (err) {
    console.error('POST /advance error:', err);
    try { await Quarter.findByIdAndUpdate(quarter?._id, { status: 'locked' }); } catch (_) {}
    res.status(500).json({ error: 'Advance failed: ' + err.message });
  }
});

module.exports = router;
