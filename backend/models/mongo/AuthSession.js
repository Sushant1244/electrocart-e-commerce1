const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'MongoUser', required: true, index: true },
  familyId: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  userAgent: { type: String, maxlength: 512 },
  ip: { type: String, maxlength: 64 },
  expiresAt: { type: Date, required: true, expires: 0 },
  revokedAt: { type: Date },
  replacedBy: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.models.MongoAuthSession || mongoose.model('MongoAuthSession', sessionSchema, 'auth_sessions');
