const admin = require('../config/firebase');
const User = require('../models/User');

// Verifies Firebase ID token, then checks the uid exists in our MongoDB User collection.
// Attaches req.user = { firebaseUid, email, role, teamNumber } on success.
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // 1. Verify the token with Firebase Admin — checkRevoked:true rejects revoked sessions immediately
    const decoded = await admin.auth().verifyIdToken(idToken, true);

    // 2. Check the uid exists in our own MongoDB — rejects users not in our system
    const user = await User.findOne({ firebaseUid: decoded.uid }).populate('team');
    if (!user) {
      return res.status(403).json({ error: 'Account not registered in this system' });
    }

    // 3. Attach clean user object to request
    req.user = {
      firebaseUid: user.firebaseUid,
      email: user.email,
      role: user.role,
      teamNumber: user.team ? user.team.teamNumber : null,
      teamId: user.team ? user.team._id : null,
      userId: user._id,
    };

    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = verifyToken;
