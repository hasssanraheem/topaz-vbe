const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

// GET /api/me
// Returns the authenticated user's role and team number.
// Also updates lastSeenAt so the admin can see team activity status.
router.get('/me', verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { lastSeenAt: new Date() });
  } catch (_) {
    // Non-fatal — don't block the response if lastSeenAt update fails
  }

  res.json({
    email: req.user.email,
    role: req.user.role,
    teamNumber: req.user.teamNumber,
  });
});

module.exports = router;
