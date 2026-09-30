// Admin quarter management — open, set macro, roll, status, reports.

const express  = require('express');
const router   = express.Router();
const verifyToken  = require('../middleware/verifyToken');
const requireRole  = require('../middleware/requireRole');
const Quarter  = require('../models/Quarter');
const Decision = require('../models/Decision');
const Session  = require('../models/Session');
const Team     = require('../models/Team');
const Report   = require('../models/Report');
const User     = require('../models/User');
const { computeQuarter } = require('../engine/simulation');
const { DEFAULT_DECISIONS } = require('../engine/tables');
const { frontendToEngine } = require('../engine/adapter');

// All routes require admin
router.use(verifyToken, requireRole('admin'));

// ── GET /api/admin/quarters — list quarters for active session ─────────────────

router.get('/', async (req, res) => {
  try {
    const session = await _latestSession();
    if (!session) return res.json([]);
    const quarters = await Quarter.find({ session: session._id }).sort({ year: 1, quarter: 1 });
    res.json(quarters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/admin/quarters/open — open a new quarter ────────────────────────

router.post('/open', async (req, res) => {
  try {
    const session = await _latestSession();
    if (!session) return res.status(404).json({ error: 'No session found. Create one first.' });

    // Ensure no other quarter is open
    const existing = await Quarter.findOne({ session: session._id, status: { $in: ['open', 'locked', 'processing'] } });
    if (existing) return res.status(409).json({ error: `Quarter ${existing.year} Q${existing.quarter} is already ${existing.status}.` });

    // Determine next year/quarter
    const last = await Quarter.findOne({ session: session._id }).sort({ year: -1, quarter: -1 });
    let year = session.startYear || 2024;
    let qtr  = session.startQuarter || 1;
    if (last) {
      year = last.year;
      qtr  = last.quarter + 1;
      if (qtr > 4) { qtr = 1; year++; }
    }

    const macro = req.body.macro || {};
    const deadline = req.body.deadline ? new Date(req.body.deadline) : null;

    const q = await Quarter.create({ session: session._id, year, quarter: qtr, macro, deadline });
    res.status(201).json(q);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/admin/quarters/:id/macro — update macro shocks ──────────────────

router.post('/:id/macro', async (req, res) => {
  try {
    const q = await Quarter.findById(req.params.id);
    if (!q) return res.status(404).json({ error: 'Quarter not found.' });
    if (q.status !== 'open') return res.status(409).json({ error: 'Can only update macro on an open quarter.' });
    Object.assign(q.macro, req.body);
    q.markModified('macro');
    await q.save();
    res.json(q);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/admin/quarters/:id/roll-status — who has submitted ───────────────

router.get('/:id/roll-status', async (req, res) => {
  try {
    const q = await Quarter.findById(req.params.id);
    if (!q) return res.status(404).json({ error: 'Quarter not found.' });

    const teams = await Team.find().sort({ teamNumber: 1 });
    const decisions = await Decision.find({ quarter: q._id });
    const decByTeam = {};
    for (const d of decisions) decByTeam[d.team.toString()] = d;

    const status = teams.map(t => ({
      teamNumber: t.teamNumber,
      submitted:  Boolean(decByTeam[t._id.toString()]?.submitted),
      savedAt:    decByTeam[t._id.toString()]?.savedAt || null,
    }));
    const allSubmitted = status.every(s => s.submitted);
    res.json({ quarterStatus: q.status, teams: status, allSubmitted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/admin/quarters/:id/roll — run the simulation ───────────────────

router.post('/:id/roll', async (req, res) => {
  const force = Boolean(req.body.force);
  try {
    const q = await Quarter.findById(req.params.id);
    if (!q) return res.status(404).json({ error: 'Quarter not found.' });
    if (!['open', 'locked'].includes(q.status)) {
      return res.status(409).json({ error: `Quarter is already ${q.status}.` });
    }

    const session = await Session.findById(q.session);
    const teams   = await Team.find().sort({ teamNumber: 1 });

    // Check all submitted (unless force)
    if (!force) {
      const decisions = await Decision.find({ quarter: q._id, submitted: true });
      const submittedTeams = new Set(decisions.map(d => d.team.toString()));
      const missing = teams.filter(t => !submittedTeams.has(t._id.toString()));
      if (missing.length) {
        return res.status(409).json({
          error: 'Not all teams have submitted. Use force:true to auto-pass missing teams.',
          missing: missing.map(t => t.teamNumber),
        });
      }
    }

    // Lock the quarter
    q.status = 'locked';
    await q.save();

    // Build team inputs — auto-pass teams with no submission
    const prevReports = await Report.find({ session: q.session }).sort({ round: -1 });
    const teamInputs  = [];
    for (const team of teams) {
      const dec = await Decision.findOne({ quarter: q._id, team: team._id });
      const prev = prevReports.find(r => r.team?.toString() === team._id.toString());
      const autoPass = !dec?.submitted;

      if (autoPass && dec) {
        // Mark auto-pass
        dec.autoPass = true;
        await dec.save();
      }

      // Convert from frontend format to engine format
      const rawDec = dec?.data || null;
      const engineDec = rawDec ? frontendToEngine(rawDec) : DEFAULT_DECISIONS;

      teamInputs.push({
        team_id:   team._id.toString(),
        team: {
          company_number: team.teamNumber,
          name: team.name || `Team ${team.teamNumber}`,
          group_number: session?.groupNumber || 1,
        },
        decisions: engineDec,
        prev:      prev?.data || null,
        auto_pass: autoPass,
      });
    }

    // Run the engine
    q.status = 'processing';
    await q.save();

    const industry = {
      id: session?._id?.toString() || 'default',
      simulation_code: session?.simulationCode || 'SIM',
    };
    const reports = computeQuarter(industry, q.year, q.quarter, teamInputs, q.macro);

    // Store reports
    const now = new Date();
    for (const team of teams) {
      const reportData = reports[team._id.toString()];
      if (!reportData) continue;
      await Report.findOneAndUpdate(
        { session: q.session, team: team._id, round: `${q.year}-Q${q.quarter}` },
        { $set: { data: reportData, generatedAt: now } },
        { upsert: true }
      );
    }

    // Publish
    q.status      = 'published';
    q.publishedAt = now;
    await q.save();

    res.json({
      message: `Quarter ${q.year} Q${q.quarter} published successfully.`,
      teamsProcessed: teams.length,
      quarterId: q._id,
    });
  } catch (err) {
    console.error('Roll quarter error:', err);
    // Revert to locked on failure
    try { await Quarter.findByIdAndUpdate(req.params.id, { status: 'locked' }); } catch (_) {}
    res.status(500).json({ error: 'Engine error: ' + err.message });
  }
});

// ── GET /api/admin/quarters/:id/reports — all team reports for a quarter ──────

router.get('/:id/reports', async (req, res) => {
  try {
    const q = await Quarter.findById(req.params.id);
    if (!q) return res.status(404).json({ error: 'Quarter not found.' });
    const reports = await Report.find({ session: q.session, round: `${q.year}-Q${q.quarter}` })
      .populate('team', 'teamNumber name');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/reports — team fetches their own report for a quarter ─────────────
// (available to team role — separate mount, see index.js)

// ── Utility ───────────────────────────────────────────────────────────────────

async function _latestSession() {
  return Session.findOne().sort({ createdAt: -1 });
}

module.exports = router;
