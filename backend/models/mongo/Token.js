const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'MongoUser', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  type: { type: String, enum: ['otp', 'password_reset', 'email_verification', 'email_change'], required: true, index: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  usedAt: { type: Date },
  attempts: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.models.MongoToken || mongoose.model('MongoToken', tokenSchema, 'auth_tokens');
