// Middleware factories — use after verifyToken

// Only allows admin users
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Allows admins OR the team whose teamNumber matches :teamNumber in the route param
function requireOwnTeam(req, res, next) {
  if (req.user.role === 'admin') return next();

  const routeTeamNumber = parseInt(req.params.teamNumber, 10);
  if (req.user.teamNumber === routeTeamNumber) return next();

  return res.status(403).json({ error: 'You can only access your own team data' });
}

// Allows team users (not admin)
function requireTeam(req, res, next) {
  if (req.user.role !== 'team') {
    return res.status(403).json({ error: 'Team access required' });
  }
  next();
}

module.exports = { requireAdmin, requireOwnTeam, requireTeam };
