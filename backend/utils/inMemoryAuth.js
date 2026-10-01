const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Simple in-memory store for development only. Not persistent.
const users = new Map();

async function createUser({ name, email, password, isAdmin }) {
  if (users.has(email)) {
    const err = new Error('Email exists');
    err.code = 'EMAIL_EXISTS';
    throw err;
  }
  const hashed = await bcrypt.hash(password, 10);
  const id = crypto.randomBytes(12).toString('hex');
  const user = { id, name, email, password: hashed, isAdmin: !!isAdmin, createdAt: new Date() };
  users.set(email, user);
  return user;
}

async function findUserByEmail(email) {
  return users.get(email) || null;
}

async function setEmailVerificationToken(email, hashedToken, expireAt) {
  const u = users.get(email);
  if (!u) return false;
  u.emailVerificationToken = hashedToken;
  u.emailVerificationExpire = expireAt;
  u.emailVerified = false;
  users.set(email, u);
  console.log('[inMemoryAuth] set email verification token for', email, { hashedToken, expireAt });
  return true;
}

async function verifyEmailByHashedToken(hashedToken) {
  for (const [email, u] of users.entries()) {
    if (!u.emailVerificationToken) continue;
  // Require expiry to be present and in the future.
  if (u.emailVerificationToken === hashedToken && (u.emailVerificationExpire && u.emailVerificationExpire > Date.now())) {
      u.emailVerified = true;
      u.emailVerificationToken = null;
      u.emailVerificationExpire = null;
      users.set(email, u);
      return { ok: true, email };
    }
  }
  return { ok: false };
}

async function setResetTokenForEmail(email, hashedToken, expireAt) {
  const u = users.get(email);
  if (!u) return false;
  u.resetPasswordToken = hashedToken;
  u.resetPasswordExpire = expireAt;
  users.set(email, u);
  // debug log
  // eslint-disable-next-line no-console
  console.log('[inMemoryAuth] set reset token for', email, { hashedToken, expireAt });
  return true;
}

async function resetPasswordByHashedToken(hashedToken, newPassword) {
  for (const [email, u] of users.entries()) {
    if (!u.resetPasswordToken) continue;
  // debug log
  // eslint-disable-next-line no-console
  console.log('[inMemoryAuth] checking token for', email, { stored: u.resetPasswordToken, incoming: hashedToken, expire: u.resetPasswordExpire });
  if (u.resetPasswordToken === hashedToken && (!u.resetPasswordExpire || u.resetPasswordExpire > Date.now())) {
      // store bcrypt-hashed password
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(newPassword, 10);
      u.password = hashed;
      u.resetPasswordToken = null;
      u.resetPasswordExpire = null;
      users.set(email, u);
      return true;
    }
  }
  return false;
}

module.exports = { createUser, findUserByEmail, setResetTokenForEmail, resetPasswordByHashedToken };
// Debug helper
module.exports.getAllUsers = () => Array.from(users.values()).map(u => ({ ...u }));
// Email verification helpers (dev-only)
module.exports.setEmailVerificationToken = setEmailVerificationToken;
module.exports.verifyEmailByHashedToken = verifyEmailByHashedToken;
