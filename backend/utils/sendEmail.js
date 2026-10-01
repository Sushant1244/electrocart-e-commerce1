const nodemailer = require('nodemailer');

let transporter = null;

function emailConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER
  };
}

function hasSmtpConfig(config) {
  return Boolean(config.host && config.user && config.pass && config.from);
}

function createTransporter(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
    tls: { rejectUnauthorized: true }
  });
}

async function verifyEmailTransport() {
  const config = emailConfig();
  if (!hasSmtpConfig(config)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[email] SMTP not configured; development OTPs will be printed to the backend console.');
      return false;
    }
    console.error('[email] SMTP configuration is incomplete. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM.');
    return false;
  }
  try {
    transporter = createTransporter(config);
    await transporter.verify();
    console.log('[email] SMTP ready');
    return true;
  } catch (error) {
    console.error('[email] SMTP verification failed:', { message: error.message, code: error.code, response: error.response });
    transporter = null;
    return false;
  }
}

async function sendEmail({ to, subject, text, html, otp }) {
  const config = emailConfig();
  if (!hasSmtpConfig(config)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[email] SMTP not configured. Development OTP for ${to}: ${otp || '(no OTP)'}`);
      return { devFallback: true };
    }
    const error = new Error('Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  try {
    if (!transporter) transporter = createTransporter(config);
    return await transporter.sendMail({ from: config.from, to, subject, text, html });
  } catch (error) {
    console.error('[email] send failed:', { message: error.message, code: error.code, response: error.response });
    throw error;
  }
}

module.exports = { sendEmail, verifyEmailTransport };
