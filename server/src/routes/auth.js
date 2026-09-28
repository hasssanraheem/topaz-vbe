const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

// GET /api/me
// Returns the authenticated user's role and team number.
// Client calls this after Firebase sign-in to know where to redirect.
router.get('/me', verifyToken, (req, res) => {
  res.json({
    email: req.user.email,
    role: req.user.role,
    teamNumber: req.user.teamNumber,
  });
});

module.exports = router;
