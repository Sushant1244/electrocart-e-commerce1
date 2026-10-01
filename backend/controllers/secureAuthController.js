const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pgConfig = require('../config/sequelize');
const { sendMail } = require('../utils/mailer');
const { sendEmail } = require('../utils/sendEmail');
const LoginActivity = require('../models/mongo/LoginActivity');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TTL = '15m';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const VERIFY_TTL_MS = 5 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;
const OTP_TTL_MS = 5 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/'
};
const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const TWO_FACTOR_COOKIE = 'two_factor_challenge';
const accountRate = new Map();
const verificationResendTracker = new Map();
const COMMON_PASSWORDS = new Set(['password', 'password123', '12345678', 'qwerty123', 'letmein123', 'admin123', 'welcome123']);

function db() {
  if (process.env.MONGODB_URI) return require('../models/mongo/authStore');
  if (!pgConfig?.User || !pgConfig?.AuthSession || !pgConfig?.AuthToken) throw Object.assign(new Error('Authentication database is not configured'), { status: 503 });
  return pgConfig;
}
function now() { return new Date(); }
function normalizedEmail(value) { return String(value || '').trim().toLowerCase(); }
function tokenHash(token) { return crypto.createHash('sha256').update(token).digest('hex'); }
function randomToken(bytes = 32) { return crypto.randomBytes(bytes).toString('hex'); }
function safeUser(user) {
  const value = user.toJSON ? user.toJSON() : { ...user };
  delete value.passwordHash; delete value.twoFactorSecret; delete value.backupCodes;
  delete value.resetPasswordToken; delete value.resetPasswordExpire;
  return { ...value, isAdmin: value.role === 'admin' || value.isAdmin === true };
}
function setAuthCookies(res, userId, sessionId) {
  if (!JWT_SECRET || JWT_SECRET === 'dev_jwt_secret_change_me') throw Object.assign(new Error('JWT_SECRET must be configured'), { status: 500 });
  const access = jwt.sign({ sub: String(userId), sid: sessionId }, JWT_SECRET, { expiresIn: ACCESS_TTL, issuer: 'sonu-enterprises' });
  res.cookie(ACCESS_COOKIE, access, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
}
function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, COOKIE_OPTIONS);
  res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS);
}
function setTwoFactorChallenge(res, userId) {
  const challenge = jwt.sign({ sub: String(userId), purpose: '2fa' }, JWT_SECRET, { expiresIn: '5m', issuer: 'sonu-enterprises' });
  res.cookie(TWO_FACTOR_COOKIE, challenge, { ...COOKIE_OPTIONS, maxAge: 5 * 60 * 1000 });
}
function parseCookies(req) {
  return String(req.headers.cookie || '').split(';').reduce((result, pair) => {
    const index = pair.indexOf('=');
    if (index > 0) result[pair.slice(0, index).trim()] = decodeURIComponent(pair.slice(index + 1).trim());
    return result;
  }, {});
}
function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) return 'Password must be between 8 and 128 characters';
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return 'Choose a less common password';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return 'Password must include uppercase, lowercase, and a number';
  return null;
}
function accountAllowed(key, limit = 8, windowMs = 15 * 60 * 1000) {
  const current = Date.now();
  const recent = (accountRate.get(key) || []).filter(time => time > current - windowMs);
  if (recent.length >= limit) { accountRate.set(key, recent); return false; }
  recent.push(current); accountRate.set(key, recent); return true;
}
function clientKey(req, email) { return `${req.ip}:${normalizedEmail(email)}`; }
function parseUserAgent(userAgent = '') {
  const value = String(userAgent);
  const browser = /Edg\/?([\d.]+)/i.test(value) ? 'Edge' : /Chrome\/?([\d.]+)/i.test(value) ? 'Chrome' : /Firefox\/?([\d.]+)/i.test(value) ? 'Firefox' : /Safari\/?([\d.]+)/i.test(value) && !/Chrome/i.test(value) ? 'Safari' : /curl/i.test(value) ? 'curl' : 'Unknown';
  const os = /Windows/i.test(value) ? 'Windows' : /Android/i.test(value) ? 'Android' : /iPhone|iPad|iOS/i.test(value) ? 'iOS' : /Mac OS X/i.test(value) ? 'macOS' : /Linux/i.test(value) ? 'Linux' : 'Unknown';
  const type = /bot|crawler|spider/i.test(value) ? 'bot' : /ipad|tablet/i.test(value) ? 'tablet' : /mobile|iphone|android/i.test(value) ? 'mobile' : value ? 'desktop' : 'unknown';
  return { type, browser, os };
}
async function recordLoginActivity(req, { user, email, status }) {
  if (!process.env.MONGODB_URI) return;
  try {
    await LoginActivity.create({ userId: user?._id || user?.id || undefined, email: normalizedEmail(email) || 'unknown', ipAddress: req.ip || req.socket?.remoteAddress || 'unknown', userAgent: req.get('user-agent') || '', device: parseUserAgent(req.get('user-agent')), status });
  } catch (error) {
    console.error('[auth] failed to record login activity:', error.message);
  }
}
function sendTokenEmail(to, subject, token, kind) {
  const frontend = process.env.CLIENT_URL || 'http://localhost:5173';
  const link = `${frontend}/${kind}?token=${encodeURIComponent(token)}`;
  return Promise.resolve(sendMail(to, subject, `Use this link within the allowed time: ${link}`, `<p>Use this link within the allowed time:</p><p><a href="${link}">${link}</a></p><p>If you did not request this, you can ignore this email.</p>`));
}
async function createToken(userId, type, ttl, metadata = {}) {
  const { AuthToken } = db();
  const raw = randomToken(32);
  await AuthToken.update({ usedAt: now() }, { where: { userId, type, usedAt: null } });
  await AuthToken.create({ userId, type, tokenHash: tokenHash(raw), expiresAt: new Date(Date.now() + ttl), metadata });
  return raw;
}
async function createVerificationCode(userId) {
  const { AuthToken } = db();
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await AuthToken.update({ usedAt: now() }, { where: { userId, type: 'email_verification', usedAt: null } });
  await AuthToken.create({ userId, type: 'email_verification', tokenHash: tokenHash(code), expiresAt: new Date(Date.now() + VERIFY_TTL_MS) });
  return code;
}
function verificationEmail(code) {
  return {
    subject: 'Your SONU ENTERPRISES verification code',
    text: `Your SONU ENTERPRISES verification code is ${code}. It expires in 5 minutes.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:24px auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px"><h2>Verify your SONU ENTERPRISES email</h2><p>Enter this 6-digit code in the verification screen:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;color:#e8793f">${code}</p><p>This code expires in 5 minutes.</p></div>`
  };
}
async function deliverVerificationCode(email, code) {
  const message = verificationEmail(code);
  return sendEmail({ to: email, subject: message.subject, text: message.text, html: message.html, otp: code });
}
function verificationCodeEmail(code) {
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:24px auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px"><h2>Verify your SONU ENTERPRISES email</h2><p>Enter this 6-digit code in the verification screen:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;color:#e8793f">${code}</p><p>This code expires in 24 hours.</p></div>`;
}
async function createSession(user, req, res, familyId = crypto.randomUUID()) {
  const { AuthSession } = db();
  const raw = randomToken(48);
  const session = await AuthSession.create({ userId: user.id, familyId, tokenHash: tokenHash(raw), userAgent: req.get('user-agent'), ip: req.ip, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) });
  res.cookie(REFRESH_COOKIE, raw, { ...COOKIE_OPTIONS, maxAge: REFRESH_TTL_MS });
  setAuthCookies(res, user.id, session.id);
  return session;
}
async function rotateSession(req, res) {
  const { AuthSession, User } = db();
  const raw = parseCookies(req)[REFRESH_COOKIE];
  if (!raw) return null;
  const session = await AuthSession.findOne({ where: { tokenHash: tokenHash(raw) } });
  if (!session || session.expiresAt <= now()) return null;
  if (session.revokedAt || session.replacedBy) {
    await AuthSession.update({ revokedAt: now() }, { where: { familyId: session.familyId, revokedAt: null } });
    return null;
  }
  const replacementRaw = randomToken(48);
  const replacement = await AuthSession.create({ userId: session.userId, familyId: session.familyId, tokenHash: tokenHash(replacementRaw), userAgent: req.get('user-agent'), ip: req.ip, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) });
  await session.update({ replacedBy: replacement.id, revokedAt: now() });
  const user = await User.findByPk(session.userId);
  if (!user) return null;
  res.cookie(REFRESH_COOKIE, replacementRaw, { ...COOKIE_OPTIONS, maxAge: REFRESH_TTL_MS });
  setAuthCookies(res, user.id, replacement.id);
  return user;
}
function errorResponse(res, error) { const status = error.status || 500; if (status >= 500) console.error('secure auth error:', error); return res.status(status).json({ message: status === 500 ? 'Authentication service unavailable' : error.message }); }

exports.register = async (req, res) => {
  try {
    const { User } = db();
    const { name, phone, password } = req.body;
    const email = normalizedEmail(req.body.email);
    const passwordError = validatePassword(password);
    if (!name || !email || passwordError) return res.status(400).json({ message: passwordError || 'Name and email are required' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address' });
    if (!accountAllowed(clientKey(req, email), 5, 60 * 60 * 1000)) return res.status(429).json({ message: 'Too many registration attempts' });
    if (await User.findOne({ where: { email } })) return res.status(409).json({ message: 'Unable to create account with those details' });
    const user = await User.create({ name: String(name).trim(), email, phone: phone ? String(phone).trim() : null, passwordHash: await bcrypt.hash(password, 12), role: 'customer' });
    const code = await createVerificationCode(user.id);
    let delivery;
    try { delivery = await deliverVerificationCode(email, code); } catch (error) { console.error('[auth] verification code delivery failed:', error.message); return res.status(502).json({ message: 'Account created, but we could not send the verification email. Please try resend after email settings are fixed.', email, emailDeliveryFailed: true }); }
    return res.status(201).json({ message: 'Account created. Check your email to verify it.', email, ...(delivery.devFallback ? { devOtp: code } : {}) });
  } catch (error) { return errorResponse(res, error); }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { User, AuthToken } = db();
    const raw = String(req.body.token || req.body.code || '');
    if (!raw) return res.status(400).json({ message: 'Verification token is required' });
    const token = await AuthToken.findOne({ where: { tokenHash: tokenHash(raw), type: { [require('sequelize').Op.in]: ['email_verification', 'email_change'] }, usedAt: null } });
    if (!token || token.expiresAt <= now()) return res.status(400).json({ message: 'Invalid or expired verification code' });
    if ((token.attempts || 0) >= 5) return res.status(429).json({ message: 'Too many incorrect attempts. Request a new code.' });
    await token.update({ attempts: (token.attempts || 0) + 1 });
    await token.update({ usedAt: now() });
    const user = await User.findByPk(token.userId);
    const updates = { emailVerified: true, emailVerificationToken: null, emailVerificationExpire: null };
    if (token.type === 'email_change' && token.metadata?.newEmail) updates.email = normalizedEmail(token.metadata.newEmail);
    updates.isEmailVerified = true;
    await user.update(updates);
    return res.json({ message: 'Email verified', user: safeUser(user) });
  } catch (error) { return errorResponse(res, error); }
};
exports.resendVerification = async (req, res) => {
  const email = normalizedEmail(req.body.email);
  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    const resendState = verificationResendTracker.get(email) || { lastSentAt: 0, sentAt: [] };
    const currentTime = Date.now();
    resendState.sentAt = resendState.sentAt.filter(timestamp => timestamp > currentTime - 60 * 60 * 1000);
    if (currentTime - resendState.lastSentAt < 30 * 1000) return res.status(429).json({ message: 'Please wait 30 seconds before requesting another code.' });
    if (resendState.sentAt.length >= 5) return res.status(429).json({ message: 'Too many verification emails. Please try again later.' });
    if (!accountAllowed(clientKey(req, email), 3, 60 * 60 * 1000)) return res.status(429).json({ message: 'If an account exists, a verification email will arrive shortly' });
    const { User } = db(); const user = await User.findOne({ where: { email } });
    if (user && !user.emailVerified) {
      const code = await createVerificationCode(user.id);
      try { const delivery = await deliverVerificationCode(email, code); resendState.lastSentAt = currentTime; resendState.sentAt.push(currentTime); verificationResendTracker.set(email, resendState); return res.json({ message: 'Verification code sent.', ...(delivery.devFallback ? { devOtp: code } : {}) }); } catch (error) { console.error('[auth] verification code delivery failed:', error.message); return res.status(502).json({ message: 'Failed to send verification email. Check SMTP settings and try again.' }); }
    }
    return res.json({ message: 'If an account exists, a verification email will arrive shortly' });
  } catch (error) { return errorResponse(res, error); }
};

exports.login = async (req, res) => {
  try {
    const { User } = db(); const email = normalizedEmail(req.body.email); const password = req.body.password;
    if (!email || !password || !accountAllowed(clientKey(req, email))) { await recordLoginActivity(req, { email, status: 'failed' }); return res.status(429).json({ message: 'Invalid credentials or too many attempts' }); }
    const user = await User.findOne({ where: { email } });
    if (!user || user.isBlocked || !user.passwordHash || (user.lockUntil && user.lockUntil > now()) || !(await bcrypt.compare(password, user.passwordHash))) {
      if (user) { const attempts = (user.failedLoginAttempts || 0) + 1; await user.update({ failedLoginAttempts: attempts, lockUntil: attempts >= 5 ? new Date(Date.now() + LOCKOUT_MS) : null }); }
      await recordLoginActivity(req, { user, email, status: 'failed' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.emailVerified && !user.isEmailVerified && user.role !== 'admin') { await recordLoginActivity(req, { user, email, status: 'failed' }); return res.status(403).json({ message: 'Please verify your email before signing in' }); }
    await user.update({ failedLoginAttempts: 0, lockUntil: null, lastLoginAt: now(), lastActiveAt: now(), isOnline: true, loginCount: (user.loginCount || 0) + 1 });
    await recordLoginActivity(req, { user, email, status: 'success' });
    if (user.twoFactorEnabled === true) {
      setTwoFactorChallenge(res, user.id);
      return res.json({ user: safeUser(user), requiresTwoFactor: true });
    }
    await createSession(user, req, res);
    return res.json({ user: safeUser(user), requiresTwoFactor: false });
  } catch (error) { return errorResponse(res, error); }
};
exports.refresh = async (req, res) => { try { const user = await rotateSession(req, res); if (!user) { clearAuthCookies(res); return res.status(401).json({ message: 'Refresh token invalid or expired' }); } return res.json({ user: safeUser(user) }); } catch (error) { return errorResponse(res, error); } };
exports.logout = async (req, res) => { try { const { AuthSession } = db(); const raw = parseCookies(req)[REFRESH_COOKIE]; if (raw) await AuthSession.update({ revokedAt: now() }, { where: { tokenHash: tokenHash(raw), revokedAt: null } }); clearAuthCookies(res); return res.json({ message: 'Logged out' }); } catch (error) { return errorResponse(res, error); } };
exports.logoutAll = async (req, res) => { try { const { AuthSession } = db(); await AuthSession.update({ revokedAt: now() }, { where: { userId: req.authUser.id, revokedAt: null } }); clearAuthCookies(res); return res.json({ message: 'All sessions revoked' }); } catch (error) { return errorResponse(res, error); } };

exports.forgotPassword = async (req, res) => { const email = normalizedEmail(req.body.email); try { if (!accountAllowed(clientKey(req, email), 3, 60 * 60 * 1000)) return res.status(429).json({ message: 'If an account exists, reset instructions will arrive shortly' }); const { User } = db(); const user = await User.findOne({ where: { email } }); if (user) { const token = await createToken(user.id, 'password_reset', RESET_TTL_MS); await sendTokenEmail(email, 'Reset your SONU ENTERPRISES password', token, 'reset-password').catch(() => {}); } return res.json({ message: 'If an account exists, reset instructions will arrive shortly' }); } catch (error) { return errorResponse(res, error); } };
exports.resetPassword = async (req, res) => { try { const { User, AuthToken, AuthSession } = db(); const raw = String(req.body.token || ''); const passwordError = validatePassword(req.body.password); if (passwordError) return res.status(400).json({ message: passwordError }); const token = await AuthToken.findOne({ where: { tokenHash: tokenHash(raw), type: 'password_reset', usedAt: null } }); if (!token || token.expiresAt <= now()) return res.status(400).json({ message: 'Invalid or expired reset token' }); const user = await User.findByPk(token.userId); await user.update({ passwordHash: await bcrypt.hash(req.body.password, 12), failedLoginAttempts: 0, lockUntil: null }); await token.update({ usedAt: now() }); await AuthSession.update({ revokedAt: now() }, { where: { userId: user.id, revokedAt: null } }); return res.json({ message: 'Password reset successful' }); } catch (error) { return errorResponse(res, error); } };
exports.changePassword = async (req, res) => { try { const { User, AuthSession } = db(); const user = await User.findByPk(req.authUser.id); if (!user || !(await bcrypt.compare(req.body.currentPassword || '', user.passwordHash))) return res.status(401).json({ message: 'Current password is incorrect' }); const passwordError = validatePassword(req.body.newPassword); if (passwordError) return res.status(400).json({ message: passwordError }); await user.update({ passwordHash: await bcrypt.hash(req.body.newPassword, 12) }); await AuthSession.update({ revokedAt: now() }, { where: { userId: user.id, revokedAt: null } }); clearAuthCookies(res); return res.json({ message: 'Password changed. Please sign in again.' }); } catch (error) { return errorResponse(res, error); } };
exports.changeEmail = async (req, res) => { try { const { User } = db(); const user = await User.findByPk(req.authUser.id); const newEmail = normalizedEmail(req.body.newEmail); if (!user || !user.passwordHash || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) return res.status(401).json({ message: 'Password is incorrect' }); if (!/^\S+@\S+\.\S+$/.test(newEmail)) return res.status(400).json({ message: 'Enter a valid email address' }); if (await User.findOne({ where: { email: newEmail } })) return res.status(409).json({ message: 'That email address is already in use' }); const token = await createToken(user.id, 'email_change', VERIFY_TTL_MS, { newEmail }); await sendTokenEmail(newEmail, 'Confirm your new SONU ENTERPRISES email', token, 'verify-email').catch(() => {}); return res.json({ message: 'A verification link was sent to your new email address' }); } catch (error) { return errorResponse(res, error); } };

exports.me = async (req, res) => res.json({ user: safeUser(req.authUser) });
exports.sessions = async (req, res) => { try { const { AuthSession } = db(); const sessions = await AuthSession.findAll({ where: { userId: req.authUser.id, revokedAt: null }, order: [['createdAt', 'DESC']] }); return res.json({ sessions: sessions.map(session => ({ id: session.id, userAgent: session.userAgent, ip: session.ip, createdAt: session.createdAt, expiresAt: session.expiresAt })) }); } catch (error) { return errorResponse(res, error); } };
exports.revokeSession = async (req, res) => { try { const { AuthSession } = db(); await AuthSession.update({ revokedAt: now() }, { where: { id: req.params.id, userId: req.authUser.id } }); return res.json({ message: 'Session revoked' }); } catch (error) { return errorResponse(res, error); } };
exports.deleteAccount = async (req, res) => { try { const { User } = db(); const user = await User.findByPk(req.authUser.id); if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) return res.status(401).json({ message: 'Password is incorrect' }); await user.destroy(); clearAuthCookies(res); return res.json({ message: 'Account deleted' }); } catch (error) { return errorResponse(res, error); } };

function decodeBase32(value) { const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = ''; for (const char of String(value).replace(/=+$/, '').toUpperCase()) { const index = alphabet.indexOf(char); if (index >= 0) bits += index.toString(2).padStart(5, '0'); } const output = []; for (let i = 0; i + 8 <= bits.length; i += 8) output.push(parseInt(bits.slice(i, i + 8), 2)); return Buffer.from(output); }
function encryptSecret(secret) { const key = crypto.createHash('sha256').update(process.env.AUTH_ENCRYPTION_KEY || JWT_SECRET || '').digest(); const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]); return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${encrypted.toString('base64')}`; }
function decryptSecret(value) { const [iv, tag, encrypted] = String(value).split('.').map(item => Buffer.from(item, 'base64')); const decipher = crypto.createDecipheriv('aes-256-gcm', crypto.createHash('sha256').update(process.env.AUTH_ENCRYPTION_KEY || JWT_SECRET || '').digest(), iv); decipher.setAuthTag(tag); return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'); }
function totp(secret, timestamp = Date.now()) { const counter = Math.floor(timestamp / 30000); const buffer = Buffer.alloc(8); buffer.writeBigUInt64BE(BigInt(counter)); const digest = crypto.createHmac('sha1', decodeBase32(secret)).update(buffer).digest(); const offset = digest[digest.length - 1] & 15; const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000; return String(code).padStart(6, '0'); }
function validTotp(secret, code) { const value = String(code); if (!/^\d{6}$/.test(value)) return false; return [-1, 0, 1].some(offset => crypto.timingSafeEqual(Buffer.from(totp(secret, Date.now() + offset * 30000)), Buffer.from(value))); }
function encodeBase32(value) { const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = ''; for (const byte of value) bits += byte.toString(2).padStart(8, '0'); let output = ''; for (let i = 0; i < bits.length; i += 5) output += alphabet[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)]; return output; }
exports.setup2fa = async (req, res) => { try { const { User } = db(); const user = await User.findByPk(req.authUser.id); const secret = encodeBase32(crypto.randomBytes(20)); const encrypted = encryptSecret(secret); await user.update({ twoFactorSecret: encrypted, twoFactorEnabled: false }); return res.json({ secret, otpauthUrl: `otpauth://totp/SONU%20ENTERPRISES:${encodeURIComponent(user.email)}?secret=${secret}&issuer=SONU%20ENTERPRISES` }); } catch (error) { return errorResponse(res, error); } };
exports.enable2fa = async (req, res) => { try { const { User } = db(); const user = await User.findByPk(req.authUser.id); if (!user.twoFactorSecret || !validTotp(decryptSecret(user.twoFactorSecret), req.body.code)) return res.status(400).json({ message: 'Invalid authenticator code' }); const backupCodes = Array.from({ length: 8 }, () => randomToken(4).slice(0, 8).toUpperCase()); await user.update({ twoFactorEnabled: true, backupCodes: await Promise.all(backupCodes.map(code => bcrypt.hash(code, 12))) }); return res.json({ message: 'Two-factor authentication enabled', backupCodes }); } catch (error) { return errorResponse(res, error); } };
exports.verify2fa = async (req, res) => { try { const { User } = db(); const user = await User.findByPk(req.authUser.id); const code = String(req.body.code || '').trim(); let valid = Boolean(user.twoFactorSecret && validTotp(decryptSecret(user.twoFactorSecret), code)); if (!valid && Array.isArray(user.backupCodes)) { const match = []; for (const hash of user.backupCodes) { if (!match.length && await bcrypt.compare(code, hash)) match.push(hash); } if (match.length) { valid = true; await user.update({ backupCodes: user.backupCodes.filter(hash => hash !== match[0]) }); } } if (!valid) return res.status(400).json({ message: 'Invalid authenticator or backup code' }); await createSession(user, req, res); res.clearCookie(TWO_FACTOR_COOKIE, COOKIE_OPTIONS); return res.json({ verified: true, user: safeUser(user) }); } catch (error) { return errorResponse(res, error); } };
exports.disable2fa = async (req, res) => { try { const { User } = db(); const user = await User.findByPk(req.authUser.id); if (!user.twoFactorSecret || !validTotp(decryptSecret(user.twoFactorSecret), req.body.code)) return res.status(400).json({ message: 'Invalid authenticator code' }); await user.update({ twoFactorSecret: null, twoFactorEnabled: false, backupCodes: [] }); return res.json({ message: 'Two-factor authentication disabled' }); } catch (error) { return errorResponse(res, error); } };
exports.requestOtp = async (req, res) => { const email = normalizedEmail(req.body.email); try { if (!accountAllowed(clientKey(req, email), 3, 15 * 60 * 1000)) return res.status(429).json({ message: 'If an account exists, an OTP will arrive shortly' }); const { User } = db(); const user = await User.findOne({ where: { email } }); if (user) { const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0'); await createToken(user.id, 'otp', OTP_TTL_MS, { codeHash: tokenHash(code) }); await sendMail(email, 'Your SONU ENTERPRISES sign-in code', `Your sign-in code is ${code}`, `<p>Your sign-in code is <strong>${code}</strong>. It expires in 5 minutes.</p>`).catch(() => {}); } return res.json({ message: 'If an account exists, an OTP will arrive shortly' }); } catch (error) { return errorResponse(res, error); } };
exports.verifyOtp = async (req, res) => { try { const { User, AuthToken } = db(); const email = normalizedEmail(req.body.email); const user = await User.findOne({ where: { email } }); if (!user || !accountAllowed(clientKey(req, email), 8, 15 * 60 * 1000)) return res.status(401).json({ message: 'Invalid or expired code' }); const token = await AuthToken.findOne({ where: { userId: user.id, type: 'otp', usedAt: null }, order: [['createdAt', 'DESC']] }); if (!token || token.expiresAt <= now() || token.metadata?.codeHash !== tokenHash(String(req.body.code || ''))) return res.status(401).json({ message: 'Invalid or expired code' }); await token.update({ usedAt: now() }); await createSession(user, req, res); return res.json({ user: safeUser(user) }); } catch (error) { return errorResponse(res, error); } };
exports.google = async (req, res) => { try { if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: 'Google sign-in is not configured' }); const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); const ticket = await client.verifyIdToken({ idToken: String(req.body.idToken || ''), audience: process.env.GOOGLE_CLIENT_ID }); const payload = ticket.getPayload(); if (!payload?.sub || !payload.email || payload.email_verified !== true) return res.status(401).json({ message: 'Google account email is not verified' }); const { User } = db(); let user = await User.findOne({ where: { googleId: payload.sub } }) || await User.findOne({ where: { email: normalizedEmail(payload.email) } }); if (!user) user = await User.create({ name: payload.name || payload.email.split('@')[0], email: normalizedEmail(payload.email), googleId: payload.sub, emailVerified: true, role: 'customer' }); else await user.update({ googleId: payload.sub, emailVerified: true }); if (user.twoFactorEnabled) { setTwoFactorChallenge(res, user.id); return res.json({ user: safeUser(user), requiresTwoFactor: true }); } await createSession(user, req, res); return res.json({ user: safeUser(user), requiresTwoFactor: false }); } catch (error) { return res.status(401).json({ message: 'Invalid Google sign-in' }); } };

exports.authMiddleware = async (req, res, next) => { try { const { User } = db(); const cookies = parseCookies(req); const token = cookies[ACCESS_COOKIE] || (req.headers.authorization || '').split(' ')[1]; if (!token || !JWT_SECRET) return res.status(401).json({ message: 'Authentication required' }); const decoded = jwt.verify(token, JWT_SECRET, { issuer: 'sonu-enterprises' }); const user = await User.findByPk(decoded.sub); if (!user) return res.status(401).json({ message: 'Authentication required' }); req.authUser = user; req.authSessionId = decoded.sid; return next(); } catch (error) { return res.status(401).json({ message: 'Authentication required' }); } };
exports.twoFactorMiddleware = async (req, res, next) => { try { const { User } = db(); const token = parseCookies(req)[TWO_FACTOR_COOKIE]; if (!token) return res.status(401).json({ message: 'Two-factor challenge required' }); const decoded = jwt.verify(token, JWT_SECRET, { issuer: 'sonu-enterprises' }); if (decoded.purpose !== '2fa') return res.status(401).json({ message: 'Two-factor challenge required' }); const user = await User.findByPk(decoded.sub); if (!user || !user.twoFactorEnabled) return res.status(401).json({ message: 'Two-factor challenge required' }); req.authUser = user; return next(); } catch (error) { return res.status(401).json({ message: 'Two-factor challenge expired' }); } };
exports.adminMiddleware = (req, res, next) => { if (req.authUser?.role !== 'admin' && req.authUser?.isAdmin !== true) return res.status(403).json({ message: 'Admin only' }); return next(); };
