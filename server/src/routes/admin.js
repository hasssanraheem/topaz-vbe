const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const { requireAdmin } = require('../middleware/requireRole');

// All routes here require a valid token AND admin role
router.use(verifyToken, requireAdmin);

// POST /api/admin/teams/:teamNumber/reset-password
// Resets a team's Firebase password and revokes all existing sessions.
router.post('/teams/:teamNumber/reset-password', async (req, res) => {
  const teamNumber = parseInt(req.params.teamNumber, 10);
  const { newPassword, confirmPassword } = req.body;

  // Validate inputs
  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'newPassword and confirmPassword are required' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters (Firebase requirement)' });
  }
  if (teamNumber < 1 || teamNumber > 8) {
    return res.status(400).json({ error: 'Team number must be between 1 and 8' });
  }

  try {
    // Find the team user in MongoDB
    const user = await User.findOne({ role: 'team' }).populate({
      path: 'team',
      match: { teamNumber },
    });

    // findOne with populate match can return user with team: null if teamNumber doesn't match
    const targetUser = await User.findOne({ role: 'team' })
      .populate('team')
      .then(async () => {
        // Find user whose populated team has the right teamNumber
        const users = await User.find({ role: 'team' }).populate('team');
        return users.find(u => u.team && u.team.teamNumber === teamNumber);
      });

    if (!targetUser) {
      return res.status(404).json({ error: `No team user found for team ${teamNumber}` });
    }

    // Update password in Firebase
    await admin.auth().updateUser(targetUser.firebaseUid, { password: newPassword });

    // Revoke all refresh tokens — team is signed out of all existing sessions
    await admin.auth().revokeRefreshTokens(targetUser.firebaseUid);

    return res.json({
      success: true,
      message: `Password for Team ${teamNumber} reset successfully. Existing sessions have been revoked.`,
    });
  } catch (err) {
    console.error('Reset password error:', err.message);
    return res.status(500).json({ error: 'Failed to reset password: ' + err.message });
  }
});

module.exports = router;
