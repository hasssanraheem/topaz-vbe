const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const { requireAdmin } = require('../middleware/requireRole');

// All routes here require a valid token AND admin role
router.use(verifyToken, requireAdmin);

// ── Helper: find team user by team number ─────────────────────────────────────
async function findTeamUser(teamNumber) {
  const users = await User.find({ role: 'team' }).populate('team');
  return users.find(u => u.team && u.team.teamNumber === teamNumber) || null;
}

// ── GET /api/admin/teams ──────────────────────────────────────────────────────
// Returns all 8 team users with their last-seen status (for the admin dashboard).
router.get('/teams', async (req, res) => {
  try {
    const users = await User.find({ role: 'team' }).populate('team').sort({ 'team.teamNumber': 1 });
    const rows = users.map(u => ({
      teamNumber: u.team?.teamNumber ?? null,
      email: u.email,
      lastSeenAt: u.lastSeenAt,
    }));
    res.json(rows);
  } catch (err) {
    console.error('GET /teams error:', err.message);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// ── POST /api/admin/teams/:teamNumber/reset-password ─────────────────────────
// Resets a team's Firebase password and revokes all existing sessions.
router.post('/teams/:teamNumber/reset-password', async (req, res) => {
  const teamNumber = parseInt(req.params.teamNumber, 10);
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword)
    return res.status(400).json({ error: 'newPassword and confirmPassword are required' });
  if (newPassword !== confirmPassword)
    return res.status(400).json({ error: 'Passwords do not match' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (teamNumber < 1 || teamNumber > 8)
    return res.status(400).json({ error: 'Team number must be 1–8' });

  try {
    const targetUser = await findTeamUser(teamNumber);
    if (!targetUser)
      return res.status(404).json({ error: `No user found for Team ${teamNumber}` });

    await admin.auth().updateUser(targetUser.firebaseUid, { password: newPassword });
    await admin.auth().revokeRefreshTokens(targetUser.firebaseUid);

    return res.json({
      success: true,
      message: `Password for Team ${teamNumber} reset. Existing sessions revoked.`,
    });
  } catch (err) {
    console.error('reset-password error:', err.message);
    return res.status(500).json({ error: 'Failed to reset password: ' + err.message });
  }
});

// ── POST /api/admin/teams/sign-out-all ───────────────────────────────────────
// Revokes refresh tokens for all 8 team users (never the admin).
// IMPORTANT: must be defined before /:teamNumber routes to avoid route conflict.
router.post('/teams/sign-out-all', async (req, res) => {
  try {
    const teamUsers = await User.find({ role: 'team' }).populate('team');
    const results = await Promise.allSettled(
      teamUsers.map(async u => {
        await admin.auth().revokeRefreshTokens(u.firebaseUid);
        return { teamNumber: u.team?.teamNumber, email: u.email, status: 'signed out' };
      })
    );

    const report = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      return {
        teamNumber: teamUsers[i]?.team?.teamNumber,
        email: teamUsers[i]?.email,
        status: 'failed',
        error: r.reason?.message,
      };
    });

    return res.json({ success: true, report });
  } catch (err) {
    console.error('sign-out-all error:', err.message);
    return res.status(500).json({ error: 'Failed to sign out all teams: ' + err.message });
  }
});

// ── POST /api/admin/teams/:teamNumber/sign-out ────────────────────────────────
// Revokes refresh tokens for one team user.
router.post('/teams/:teamNumber/sign-out', async (req, res) => {
  const teamNumber = parseInt(req.params.teamNumber, 10);
  if (teamNumber < 1 || teamNumber > 8)
    return res.status(400).json({ error: 'Team number must be 1–8' });

  try {
    const targetUser = await findTeamUser(teamNumber);
    if (!targetUser)
      return res.status(404).json({ error: `No user found for Team ${teamNumber}` });

    await admin.auth().revokeRefreshTokens(targetUser.firebaseUid);

    return res.json({
      success: true,
      message: `Team ${teamNumber} signed out. Their next request will be rejected.`,
    });
  } catch (err) {
    console.error('sign-out error:', err.message);
    return res.status(500).json({ error: 'Failed to sign out team: ' + err.message });
  }
});

module.exports = router;
