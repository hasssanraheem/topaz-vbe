// Team decision CRUD — GET/PUT draft, POST submit.
// All endpoints require a verified team token.

const express  = require('express');
const router   = express.Router();
const verifyToken  = require('../middleware/verifyToken');
const requireRole  = require('../middleware/requireRole');
const Decision = require('../models/Decision');
const Quarter  = require('../models/Quarter');
const Team     = require('../models/Team');
const { validateDecisions } = require('../engine/validation');
const { DEFAULT_DECISIONS } = require('../engine/tables');

// ── Helpers ────────────────────────────────────────────────────────────────────

async function _getActiveQuarter(sessionId) {
  // The active quarter is the most recently opened one (open or locked)
  return Quarter.findOne({ session: sessionId, status: { $in: ['open', 'locked'] } })
    .sort({ year: -1, quarter: -1 });
}

async function _getTeamDoc(teamNumber) {
  return Team.findOne({ teamNumber });
}

// ── GET /api/decisions — fetch current draft ───────────────────────────────────

router.get('/', verifyToken, requireRole('team'), async (req, res) => {
  try {
    const team = await _getTeamDoc(req.user.teamNumber);
    if (!team) return res.status(404).json({ error: 'Team not found.' });

    const quarter = await _getActiveQuarter(/* sessionId from env or first session */
      await _getSessionId());
    if (!quarter) return res.json({ data: DEFAULT_DECISIONS, submitted: false, quarterStatus: null });

    const dec = await Decision.findOne({ team: team._id, quarter: quarter._id });
    return res.json({
      data: dec?.data || DEFAULT_DECISIONS,
      submitted: dec?.submitted || false,
      quarterStatus: quarter.status,
      quarterId: quarter._id,
      year: quarter.year,
      quarter: quarter.quarter,
    });
  } catch (err) {
    console.error('GET /decisions error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── PUT /api/decisions — save draft ───────────────────────────────────────────

router.put('/', verifyToken, requireRole('team'), async (req, res) => {
  try {
    const team = await _getTeamDoc(req.user.teamNumber);
    if (!team) return res.status(404).json({ error: 'Team not found.' });

    const quarter = await _getActiveQuarter(await _getSessionId());
    if (!quarter) return res.status(409).json({ error: 'No open quarter. Cannot save decisions.' });
    if (quarter.status === 'locked') return res.status(409).json({ error: 'Quarter is locked. Decisions can no longer be changed.' });

    const data = req.body.data || req.body;

    // Validate (soft — errors are returned but draft is still saved)
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

// ── POST /api/decisions/submit — lock in submission ───────────────────────────

router.post('/submit', verifyToken, requireRole('team'), async (req, res) => {
  try {
    const team = await _getTeamDoc(req.user.teamNumber);
    if (!team) return res.status(404).json({ error: 'Team not found.' });

    const quarter = await _getActiveQuarter(await _getSessionId());
    if (!quarter) return res.status(409).json({ error: 'No open quarter.' });
    if (quarter.status === 'locked') return res.status(409).json({ error: 'Quarter is locked — submissions closed.' });

    const data = req.body.data || req.body;
    const errors = validateDecisions(data, null);
    if (errors.length) return res.status(422).json({ error: 'Validation failed.', errors });

    await Decision.findOneAndUpdate(
      { team: team._id, quarter: quarter._id },
      { $set: { data, submitted: true, submittedAt: new Date(), savedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.json({ submitted: true, message: 'Decisions submitted successfully.' });
  } catch (err) {
    console.error('POST /decisions/submit error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/decisions/report — team fetches their own published report ────────

router.get('/report', verifyToken, requireRole('team'), async (req, res) => {
  try {
    const Report = require('../models/Report');
    const team = await _getTeamDoc(req.user.teamNumber);
    if (!team) return res.status(404).json({ error: 'Team not found.' });

    const sessionId = await _getSessionId();
    const filter = { session: sessionId, team: team._id };

    // Optional ?year=Y&quarter=Q to fetch a specific round
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

// ── Utility: get session ID ────────────────────────────────────────────────────
// Returns the first Session's _id; replace with proper multi-session logic later.

async function _getSessionId() {
  const Session = require('../models/Session');
  const s = await Session.findOne().sort({ createdAt: -1 });
  return s?._id || null;
}

module.exports = router;
