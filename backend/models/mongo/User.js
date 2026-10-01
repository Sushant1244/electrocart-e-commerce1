const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  label: { type: String, trim: true },
  fullName: { type: String, trim: true },
  line1: { type: String, required: true, trim: true },
  line2: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, required: true, trim: true }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true },
  passwordHash: { type: String, select: false },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer', index: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  addresses: { type: [addressSchema], default: [] },
  googleId: { type: String, select: false, sparse: true },
  twoFactorSecret: { type: String, select: false },
  twoFactorEnabled: { type: Boolean, default: false },
  backupCodes: { type: [String], select: false, default: [] },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLoginAt: { type: Date },
  loginCount: { type: Number, default: 0 },
  isOnline: { type: Boolean, default: false },
  lastActiveAt: { type: Date },
  authProvider: { type: String, enum: ['email', 'google'], default: 'email', index: true },
  isBlocked: { type: Boolean, default: false, index: true }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.models.MongoUser || mongoose.model('MongoUser', userSchema, 'users');
