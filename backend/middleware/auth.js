const jwt = require('jsonwebtoken');
const adapter = require('../models/adapter');
const MongoUser = process.env.MONGODB_URI ? require('../models/mongo/User') : null;

// Use same fallback secret as authController to avoid verify mismatches in dev
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

exports.authMiddleware = async (req, res, next) => {
  const token = req.cookies?.access_token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, { issuer: 'sonu-enterprises' });
    } catch (issuerError) {
      // Preserve compatibility for existing internal bearer clients while the
      // browser auth path uses issuer-scoped httpOnly cookie tokens.
      decoded = jwt.verify(token, JWT_SECRET);
    }
    // adapter.User.findByIdSelect returns user without password when available
    let dbUser = null;
    try {
      if (MongoUser && decoded.sub) {
        const mongoUser = await MongoUser.findById(decoded.sub).lean();
        if (mongoUser) dbUser = { ...mongoUser, _id: mongoUser._id.toString(), id: mongoUser._id.toString(), isAdmin: mongoUser.role === 'admin' };
      } else if (adapter.User.findByIdSelect) {
        dbUser = await adapter.User.findByIdSelect(decoded.sub || decoded.id);
      } else {
        // fallback: try findById and remove password
        dbUser = await adapter.User.findById(decoded.sub || decoded.id);
        if (dbUser) { delete dbUser.password; delete dbUser.passwordHash; }
      }
    } catch (dbErr) {
      // DB lookup failed, will use JWT payload fallback
    }
    req.user = dbUser;
    // If user not found in DB, still allow auth using JWT payload (for testing/development)
    if (!req.user) {
      req.user = { _id: decoded.sub || decoded.id, id: decoded.sub || decoded.id, isAdmin: decoded.isAdmin || false };
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