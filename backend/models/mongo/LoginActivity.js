const mongoose = require('mongoose');

const loginActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'MongoUser', index: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  ipAddress: { type: String, required: true, trim: true },
  userAgent: { type: String, trim: true },
  device: {
    type: { type: String, enum: ['desktop', 'mobile', 'tablet', 'bot', 'unknown'], default: 'unknown' },
    browser: { type: String, default: 'Unknown' },
    os: { type: String, default: 'Unknown' }
  },
  status: { type: String, enum: ['success', 'failed'], required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true, expires: 90 * 24 * 60 * 60 }
}, { versionKey: false, updatedAt: false });

loginActivitySchema.index({ userId: 1, createdAt: -1 });
loginActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.models.MongoLoginActivity || mongoose.model('MongoLoginActivity', loginActivitySchema, 'login_activity');
