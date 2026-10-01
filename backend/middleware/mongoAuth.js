const jwt = require('jsonwebtoken');
const User = require('../models/mongo/User');

function cookies(req) { return req.cookies || {}; }
async function mongoAuth(req, res, next) {
  try {
    const token = cookies(req).access_token || req.headers.authorization?.split(' ')[1];
    if (!token || !process.env.JWT_SECRET) return res.status(401).json({ message: 'Authentication required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'sonu-enterprises' });
    const user = await User.findById(decoded.sub).select('+passwordHash').lean();
    if (!user) return res.status(401).json({ message: 'Authentication required' });
    req.mongoUser = user;
    return next();
  } catch (error) { return res.status(401).json({ message: 'Authentication required' }); }
}
function mongoAdmin(req, res, next) { if (req.mongoUser?.role !== 'admin') return res.status(403).json({ message: 'Admin only' }); return next(); }
module.exports = { mongoAuth, mongoAdmin };
