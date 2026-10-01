const jwt = require('jsonwebtoken');
const adapter = require('../models/adapter');

// Use same fallback secret as authController to avoid verify mismatches in dev
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

exports.authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // adapter.User.findByIdSelect returns user without password when available
    let dbUser = null;
    try {
      if (adapter.User.findByIdSelect) {
        dbUser = await adapter.User.findByIdSelect(decoded.id);
      } else {
        // fallback: try findById and remove password
        dbUser = await adapter.User.findById(decoded.id);
        if (dbUser) { delete dbUser.password; delete dbUser.passwordHash; }
      }
    } catch (dbErr) {
      // DB lookup failed, will use JWT payload fallback
    }
    req.user = dbUser;
    // If user not found in DB, still allow auth using JWT payload (for testing/development)
    if (!req.user) {
      req.user = { _id: decoded.id, id: decoded.id, isAdmin: decoded.isAdmin || false };
    }
    // Ensure isAdmin is available on the user object
    if (req.user && req.user.isAdmin === undefined) {
      req.user.isAdmin = decoded.isAdmin || false;
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid' });
  }
};

exports.adminMiddleware = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' });
  next();
};