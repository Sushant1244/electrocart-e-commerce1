const adapter = require('../models/adapter');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createUser: createInMemoryUser, findUserByEmail, setResetTokenForEmail, resetPasswordByHashedToken } = require('../utils/inMemoryAuth');
const { sendMail } = require('../utils/mailer');
const { pickEmail } = require('../utils/emailHelpers');
const pgConfig = require('../config/sequelize');
const { DataTypes } = require('sequelize');

async function ensureEmailVerificationColumns() {
  if (!pgConfig || !pgConfig.sequelize) return;
  try {
    const qi = pgConfig.sequelize.getQueryInterface();
    const table = 'users';
    const desc = await qi.describeTable(table).catch(() => null);
    if (!desc) return;
    if (!desc.emailVerified) await qi.addColumn(table, 'emailVerified', { type: DataTypes.BOOLEAN, defaultValue: false });
    if (!desc.emailVerificationToken) await qi.addColumn(table, 'emailVerificationToken', { type: DataTypes.STRING });
    if (!desc.emailVerificationExpire) await qi.addColumn(table, 'emailVerificationExpire', { type: DataTypes.BIGINT });
  } catch (e) {
    console.warn('ensureEmailVerificationColumns failed:', e && e.message ? e.message : e);
  }
}

// Use a default secret during local development to avoid crashes when
// JWT_SECRET isn't defined. In production, always set JWT_SECRET.
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

// Simple in-memory resend tracker for rate-limiting (email => array of timestamps)
const resendTracker = new Map();
const RESEND_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RESEND_MAX_PER_WINDOW = 5;
const RESEND_MIN_INTERVAL_MS = 60 * 1000; // 60s between resends

// helpers to reduce cognitive complexity in login
async function safeCompare(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error_) {
    console.error('bcrypt compare failed:', error_?.stack ?? error_);
    throw new Error('Internal error');
  }
}

function safeSign(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  } catch (error_) {
    console.error('jwt.sign failed:', error_?.stack ?? error_);
    throw new Error('Internal error');
  }
}

exports.register = async (req, res) => {
  const dbAvailable = !!(adapter?.User && typeof adapter.User.findOne === 'function');
  const { name, email: rawEmail, password, isAdmin } = req.body;
  const email = pickEmail(rawEmail);
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    if (dbAvailable) {
    const exists = await adapter.User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email exists' });

      const hashed = await bcrypt.hash(password, 10);
      const isAdminUser = !!isAdmin;
      const createData = { name, email, password: hashed, isAdmin: isAdminUser };
      const user = await adapter.User.create(createData);

      // Admins don't need email verification
      if (isAdminUser) {
        return res.json({ message: 'Admin registered successfully', email: user.email });
      }

      // Generate secure 6-digit OTP and store hashed token + expiry on user
  const otpInt = crypto.randomInt(0, 1000000);
  const otp = String(otpInt).padStart(6, '0');
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  const expireAt = Date.now() + (10 * 60 * 1000);
  try {
        if (adapter.User.findByIdAndUpdate) {
          // Ensure DB has the needed columns before updating
          if (pgConfig && pgConfig.sequelize) {
            try {
              const qi = pgConfig.sequelize.getQueryInterface();
              const table = 'users';
              const desc = await qi.describeTable(table).catch(() => null);
              if (desc) {
                if (!desc.emailVerified) await qi.addColumn(table, 'emailVerified', { type: DataTypes.BOOLEAN, defaultValue: false });
                if (!desc.emailVerificationToken) await qi.addColumn(table, 'emailVerificationToken', { type: DataTypes.STRING });
                if (!desc.emailVerificationExpire) await qi.addColumn(table, 'emailVerificationExpire', { type: DataTypes.BIGINT });
              }
            } catch (colErr) {
              console.warn('Could not ensure email verification columns:', colErr && colErr.message ? colErr.message : colErr);
            }
          }
          const id = user._id || user.id;
          await adapter.User.findByIdAndUpdate(id, { emailVerificationToken: hashedOtp, emailVerificationExpire: expireAt, emailVerified: false });
        }
      } catch (e) {
        console.error('Failed to store email verification token for user on register:', { email, err: e && (e.stack || e.message) });
        // Attempt best-effort cleanup: delete the newly created user if adapter supports it
        try {
          const id = user._id || user.id;
          if (adapter.User.findByIdAndDelete) {
            await adapter.User.findByIdAndDelete(id);
            console.error('Rolled back created user after token store failure', { id, email });
            return res.status(500).json({ message: 'Failed to set up email verification. Please try registering again.' });
          }
        } catch (delErr) {
          console.error('Failed to rollback user after token store failure', { email, err: delErr && (delErr.stack || delErr.message) });
        }
        // If deletion not supported, return failure so caller can retry instead of proceeding with incomplete setup
        return res.status(500).json({ message: 'Failed to set up email verification. Please contact support.' });
      }

        // send OTP (use normalized email)
        try {
          const to = pickEmail(email);
          if (to) {
            const otpHtml = `<!doctype html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Verify Your Email</title></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;margin:0;padding:0;background:#f3f4f6;">
  <div style="max-width:480px;margin:40px auto;padding:24px;background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:56px;height:56px;background:#2563eb;color:white;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:24px;">EC</div>
      <h1 style="margin:16px 0 8px;font-size:24px;color:#0f172a;">Verify Your Email</h1>
      <p style="color:#64748b;margin:0;">Enter the following code to verify your email address:</p>
    </div>
    <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
      <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2563eb;">${otp}</span>
    </div>
    <p style="color:#94a3b8;font-size:14px;text-align:center;margin:0;">This code expires in <strong>10 minutes</strong>.</p>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">If you didn't request this code, please ignore this email.</p>
  </div>
</body>
</html>`;
            Promise.resolve(sendMail(
              to,
              'Verify your ElectroCart email',
              `Your verification code is: ${otp}`,
              otpHtml
            )).catch((err) => console.error('Verification email failed:', err && err.message ? err.message : err));
          } else {
            console.warn('register: normalized email empty, skipping sendMail');
          }
        } catch (mailErr) { console.error('sendMail threw:', mailErr && mailErr.message ? mailErr.message : mailErr); }

      return res.json({ message: 'Verification code sent to email', email: user.email });
    }

    // Fallback in-memory create
    const existing = await findUserByEmail(email);
    if (existing) return res.status(400).json({ message: 'Email exists' });
    const user = await createInMemoryUser({ name, email, password, isAdmin });
    
    // Admins don't need email verification
    if (isAdmin) {
      return res.json({ message: 'Admin registered successfully', email: user.email });
    }
    
    const otpInt = crypto.randomInt(0, 1000000);
  const otp = String(otpInt).padStart(6, '0');
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const expireAt = Date.now() + (10 * 60 * 1000);
    try {
      user.emailVerificationToken = hashedOtp;
      user.emailVerificationExpire = expireAt;
      user.emailVerified = false;
    } catch (e) { /* ignore */ }
    try {
      Promise.resolve(sendMail(
        email,
        'Verify your ElectroCart email',
        `Your verification code is: ${otp}`,
        `<!doctype html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Verify Your Email</title></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;margin:0;padding:0;background:#f3f4f6;">
  <div style="max-width:480px;margin:40px auto;padding:24px;background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:56px;height:56px;background:#2563eb;color:white;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:24px;">EC</div>
      <h1 style="margin:16px 0 8px;font-size:24px;color:#0f172a;">Verify Your Email</h1>
      <p style="color:#64748b;margin:0;">Enter the following code to verify your email address:</p>
    </div>
    <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
      <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2563eb;">${otp}</span>
    </div>
    <p style="color:#94a3b8;font-size:14px;text-align:center;margin:0;">This code expires in <strong>10 minutes</strong>.</p>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">If you didn't request this code, please ignore this email.</p>
  </div>
</body>
</html>`
      )).catch(() => {});
    } catch (e) {}
    return res.json({ message: 'Verification code sent to email', email: user.email });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.verifyEmail = async (req, res) => {
    const { email: rawEmail, code } = req.body;
  const email = pickEmail(rawEmail);
  if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });
  try {
    const hashed = crypto.createHash('sha256').update(code).digest('hex');
    const dbAvailable = !!(adapter?.User && typeof adapter.User.find === 'function');
    if (dbAvailable) {
      const users = await adapter.User.find({ email });
      const user = Array.isArray(users) ? users.find(u => u.email === email) : users;
  // Require an expiry timestamp and ensure it's in the future.
  if (user && user.emailVerificationToken === hashed && (user.emailVerificationExpire && user.emailVerificationExpire > Date.now())) {
        if (adapter.User.findByIdAndUpdate) {
          await ensureEmailVerificationColumns();
          await adapter.User.findByIdAndUpdate(user._id || user.id, { emailVerified: true, emailVerificationToken: null, emailVerificationExpire: null });
        }
        return res.json({ message: 'Email verified' });
      }
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // in-memory user flow
    const mem = require('../utils/inMemoryAuth');
    const u = await mem.findUserByEmail(email);
  if (!u) return res.status(400).json({ message: 'Invalid or expired verification code' });
  // Require an expiry timestamp and ensure it's in the future.
  if (u.emailVerificationToken === hashed && (u.emailVerificationExpire && u.emailVerificationExpire > Date.now())) {
      u.emailVerified = true;
      u.emailVerificationToken = null;
      u.emailVerificationExpire = null;
      return res.json({ message: 'Email verified' });
    }
    return res.status(400).json({ message: 'Invalid or expired verification code' });
  } catch (e) {
    console.error('verifyEmail error:', e);
    return res.status(500).json({ message: 'Failed to verify email' });
  }
};

// Resend verification endpoint with simple in-memory rate limiting
exports.resendVerification = async (req, res) => {
  const { email: rawEmail } = req.body;
  const email = pickEmail(rawEmail);
  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    const now = Date.now();
    const entry = resendTracker.get(email) || [];
    const recent = entry.filter(ts => ts > now - RESEND_LIMIT_WINDOW_MS);
    if (recent.length >= RESEND_MAX_PER_WINDOW) return res.status(429).json({ message: 'Too many resend attempts, try later' });
    if (recent.length > 0 && now - recent[recent.length - 1] < RESEND_MIN_INTERVAL_MS) return res.status(429).json({ message: 'Please wait before requesting another code' });

    const dbAvailable = !!(adapter?.User && typeof adapter.User.findOne === 'function');
    let user = null;
    if (dbAvailable) {
      user = await adapter.User.findOne({ email });
      // Do not leak whether the user exists; always return a generic success response
      if (!user) {
        // consume rate limiter and return generic response
        recent.push(now);
        resendTracker.set(email, recent);
        return res.json({ message: 'If an account with that email exists, you will receive instructions' });
      }
      const otpInt = crypto.randomInt(0, 1000000);
      const otp = String(otpInt).padStart(6, '0');
      const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
      const expireAt = Date.now() + (10 * 60 * 1000);
      if (adapter.User.findByIdAndUpdate) {
        await ensureEmailVerificationColumns();
        // Only set emailVerified=false if the user is not already verified
        const id = user._id || user.id;
        const updates = { emailVerificationToken: hashedOtp, emailVerificationExpire: expireAt };
        if (!user.emailVerified) updates.emailVerified = false;
        await adapter.User.findByIdAndUpdate(id, updates);
      }
      try { 
        const resendOtpHtml = `<!doctype html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>New Verification Code</title></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;margin:0;padding:0;background:#f3f4f6;">
  <div style="max-width:480px;margin:40px auto;padding:24px;background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:56px;height:56px;background:#2563eb;color:white;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:24px;">EC</div>
      <h1 style="margin:16px 0 8px;font-size:24px;color:#0f172a;">New Verification Code</h1>
      <p style="color:#64748b;margin:0;">Here's your new verification code:</p>
    </div>
    <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
      <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2563eb;">${otp}</span>
    </div>
    <p style="color:#94a3b8;font-size:14px;text-align:center;margin:0;">This code expires in <strong>10 minutes</strong>.</p>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">If you didn't request this code, please ignore this email.</p>
  </div>
</body>
</html>`;
        Promise.resolve(sendMail(email, 'Verify your ElectroCart email', `Your verification code is: ${otp}`, resendOtpHtml)).catch(() => {}); 
      } catch (e) {}
    } else {
      const mem = require('../utils/inMemoryAuth');
      user = await mem.findUserByEmail(email);
      if (!user) {
        recent.push(now);
        resendTracker.set(email, recent);
        return res.json({ message: 'If an account with that email exists, you will receive instructions' });
      }
      const otpInt = crypto.randomInt(0, 1000000);
      const otp = String(otpInt).padStart(6, '0');
      const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
      user.emailVerificationToken = hashedOtp;
      user.emailVerificationExpire = Date.now() + (10 * 60 * 1000);
      // do not flip already-verified users to unverified
      if (!user.emailVerified) user.emailVerified = false;
      try { 
        const resendOtpHtml = `<!doctype html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>New Verification Code</title></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;margin:0;padding:0;background:#f3f4f6;">
  <div style="max-width:480px;margin:40px auto;padding:24px;background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:56px;height:56px;background:#2563eb;color:white;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:24px;">EC</div>
      <h1 style="margin:16px 0 8px;font-size:24px;color:#0f172a;">New Verification Code</h1>
      <p style="color:#64748b;margin:0;">Here's your new verification code:</p>
    </div>
    <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
      <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2563eb;">${otp}</span>
    </div>
    <p style="color:#94a3b8;font-size:14px;text-align:center;margin:0;">This code expires in <strong>10 minutes</strong>.</p>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">If you didn't request this code, please ignore this email.</p>
  </div>
</body>
</html>`;
        Promise.resolve(sendMail(email, 'Verify your ElectroCart email', `Your verification code is: ${otp}`, resendOtpHtml)).catch(() => {}); 
      } catch (e) {}
    }

  recent.push(now);
  resendTracker.set(email, recent);
  // Always return a generic message to avoid leaking account existence
  return res.json({ message: 'If an account with that email exists, you will receive instructions' });
  } catch (e) {
    console.error('resendVerification error:', e);
    return res.status(500).json({ message: 'Failed to resend verification code' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const dbAvailable = adapter && adapter.User && typeof adapter.User.findOne === 'function';
  if (!dbAvailable) {
    try {
      const user = await findUserByEmail(email);
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
      // Admins don't need email verification
      const isAdminUser = user.isAdmin === true;
      return res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          isAdmin: isAdminUser,
          emailVerified: isAdminUser ? true : (user.emailVerified || false)
        } 
      });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
  try {
    console.log('login attempt for', email);
    let user;
    try {
      user = await adapter.User.findOne({ email });
      console.log('user lookup result (adapter):', !!user);
    } catch (adapterErr) {
      console.error('adapter.User.findOne failed:', adapterErr?.stack ?? adapterErr);
      // fallback to in-memory auth if available
      try {
        user = await findUserByEmail(email);
        console.log('user lookup result (in-memory fallback):', !!user);
      } catch (memErr) {
        console.error('in-memory fallback failed:', memErr?.stack ?? memErr);
        throw adapterErr;
      }
    }
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    // normalize possible password property names from adapters
    const hash = String(user.password ?? user.passwordHash ?? '');
  const ok = await safeCompare(password, hash);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

  const token = safeSign({ id: user._id || user.id });
  // Admins don't need email verification
  const isAdminUser = user.isAdmin === true;
  res.json({ 
    token, 
    user: { 
      id: user._id || user.id, 
      email: user.email, 
      name: user.name, 
      isAdmin: isAdminUser,
      emailVerified: isAdminUser ? true : (user.emailVerified || false)
    } 
  });
  } catch (e) {
  try { console.error('login error:', e?.stack ?? e); } catch (error_) { console.error('Failed to log login error', error_); }
  res.status(500).json({ message: e?.message ?? '' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    // Look up user via adapter; do not reveal existence for security
    let user = null;
    try {
      user = await adapter.User.findOne({ email });
    } catch (err) {
      user = null;
    }

    // If adapter didn't find a user (for example when using in-memory users), try the in-memory store
    if (!user) {
      try {
        const mem = await findUserByEmail(email);
        if (mem) {
          // store reset token for in-memory user so it can be verified later
          await setResetTokenForEmail(email, hashed, Date.now() + 10 * 60 * 1000);
          // send email and return generic success
          const resetUrlMem = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
            try {
              Promise.resolve(sendMail(
                email,
                'Reset your ElectroCart password',
                `You requested a password reset. Use the following link to reset your password: ${resetUrlMem}`,
                `<p>Reset link: <a href="${resetUrlMem}">${resetUrlMem}</a></p>`
              )).catch(() => {});
            } catch (e) { /* ignore */ }
          return res.json({ message: 'If email exists, password reset link has been sent', success: true });
        }
      } catch (e) {
        // ignore and fall through to generic response
      }
      return res.json({ message: 'If email exists, password reset link has been sent', success: true });
    }

  // Generate reset token and store hashed token and expiry on the user record.
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');

    // adapter may return plain objects; try to update via adapter if supported
    if (user.id && adapter.User.findById) {
      const id = user._id || user.id;
      if (adapter.User.findByIdAndUpdate) {
        await adapter.User.findByIdAndUpdate(id, { resetPasswordToken: hashed, resetPasswordExpire: Date.now() + 10 * 60 * 1000 });
      }
    }

  const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
  // DEV-FALLBACK: keep a copy of the plain token in memory for quick testing when DB persistence is inconsistent
  exports.__devLastReset = exports.__devLastReset || {};
  exports.__devLastReset[email] = { resetToken, hashed, expiresAt: Date.now() + 10 * 60 * 1000 };
    // Send reset link via email (non-blocking). In dev this uses the mailer stub which logs the message.
    try {
      Promise.resolve(sendMail(
        email,
        'Reset your ElectroCart password',
        `You requested a password reset. Use the following link to reset your password: ${resetUrl}`,
        `<p>You requested a password reset. Click the link below to reset your password (expires in 10 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
      )).catch((err) => console.error('Forgot password email failed:', err && err.message ? err.message : err));
    } catch (mailErr) {
      console.error('sendMail threw:', mailErr && mailErr.message ? mailErr.message : mailErr);
    }

    res.json({ message: 'Password reset token generated successfully', success: true, resetToken, resetUrl });
  } catch (e) {
    console.error('Forgot password error:', e);
    res.status(500).json({ 
      message: e.message || 'Failed to process password reset request',
      success: false 
    });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    // Find user via adapter. For PG adapter, findAll with where can be used.
    // Try adapter-backed lookup first
    let users = [];
    try {
      users = await (adapter.User.find ? adapter.User.find({ resetPasswordToken }) : []);
    } catch (err) {
      users = [];
    }
    let user = Array.isArray(users) ? users.find(u => u.resetPasswordToken === resetPasswordToken) : users;

    // If not found in adapter (e.g., using in-memory), try the in-memory reset helper
    if (!user) {
      // DEV-FALLBACK: accept token from recent forgotPassword call
      const devStore = exports.__devLastReset || {};
      const entry = Object.values(devStore).find(e => e.hashed === resetPasswordToken);
      if (entry) {
        // allow reset using direct in-memory token
        const hashedPassword = await bcrypt.hash(password, 10);
        // try to find user by email via adapter
        try {
          const possible = await adapter.User.findOne({ email: Object.keys(devStore).find(k => devStore[k].hashed === resetPasswordToken) });
          if (possible && adapter.User.findByIdAndUpdate) {
            await adapter.User.findByIdAndUpdate(possible._id || possible.id, { password: hashedPassword, resetPasswordToken: null, resetPasswordExpire: null });
            return res.json({ message: 'Password reset successful' });
          }
        } catch (e) { /* ignore */ }
        // otherwise, try in-memory helper
        try {
          const ok = await resetPasswordByHashedToken(resetPasswordToken, password);
          if (ok) return res.json({ message: 'Password reset successful' });
        } catch (e) { /* ignore */ }
      }
      try {
        const ok = await resetPasswordByHashedToken(resetPasswordToken, password);
        if (ok) return res.json({ message: 'Password reset successful' });
      } catch (e) {
        // ignore and return invalid token below
      }
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = user._id || user.id;
    if (adapter.User.findByIdAndUpdate) {
      await adapter.User.findByIdAndUpdate(id, { password: hashedPassword, resetPasswordToken: null, resetPasswordExpire: null });
      return res.json({ message: 'Password reset successful' });
    }

    // If adapter doesn't support update, return error
    res.status(500).json({ message: 'Password reset not supported in this configuration' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};