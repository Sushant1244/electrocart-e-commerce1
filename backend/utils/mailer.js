const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  FROM_EMAIL,
  NODE_ENV,
} = process.env;

// Transporter is created lazily
let transporter = null;

/**
 * Initialize and return the Gmail SMTP transporter
 * Requires Gmail credentials with App-Specific Password
 */
async function initTransport() {
  if (transporter) return transporter;

  // Validate Gmail configuration
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    const error = new Error('Gmail SMTP not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env');
    console.error('[mailer] Configuration error:', error.message);
    throw error;
  }

  // Check if using placeholder values
  if (SMTP_USER === 'your-gmail@gmail.com' || SMTP_PASS === 'your-app-specific-password') {
    const error = new Error('Please configure your Gmail credentials in backend/.env');
    console.error('[mailer] Configuration error:', error.message);
    throw error;
  }

  // Create Gmail SMTP transporter
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT || 587) === 465, // true for 465 (SSL), false for 587 (TLS)
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    // Gmail specific TLS settings
    tls: {
      rejectUnauthorized: true,
    },
  });

  console.log('[mailer] Initializing Gmail SMTP transport', { 
    host: SMTP_HOST, 
    port: SMTP_PORT || 587,
    user: SMTP_USER 
  });

  // Verify transporter connectivity
  try {
    await transporter.verify();
    console.log('[mailer] Gmail SMTP connection verified successfully');
  } catch (vErr) {
    console.error('[mailer] Gmail SMTP verification failed:', vErr?.message || vErr);
    console.error('[mailer] Common issues:');
    console.error('[mailer]   - Using regular password instead of App-Specific Password');
    console.error('[mailer]   - 2-Step Verification not enabled on Google Account');
    console.error('[mailer]   - App password not created or expired');
    throw vErr;
  }

  return transporter;
}

/**
 * Send an email to the specified recipient
 * @param {string} to - Recipient email address (user's Gmail from registration)
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 * @returns {Promise<object>} - Email send result
 */
async function sendMail(to, subject, text, html) {
  // Validate recipient
  if (!to) {
    throw new Error('Email recipient (to) is required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    throw new Error(`Invalid email address: ${to}`);
  }

  // Validate subject
  if (!subject) {
    throw new Error('Email subject is required');
  }

  const from = FROM_EMAIL || SMTP_USER;
  
  if (!from) {
    throw new Error('Sender email (FROM_EMAIL or SMTP_USER) is required');
  }

  const mailOptions = { from, to, subject, text, html };

  try {
    await initTransport();
    
    if (!transporter || !transporter.sendMail) {
      throw new Error('Email transporter not initialized');
    }
    
    const res = await transporter.sendMail(mailOptions);
    
    console.log('[mailer] Email sent successfully', {
      to: to,
      subject: subject,
      messageId: res?.messageId,
      accepted: res?.accepted,
    });
    
    return res;
  } catch (err) {
    // Detailed error logging
    console.error('[mailer] Email delivery failed:', {
      to: to,
      subject: subject,
      error: err?.message || err,
      code: err?.code,
      command: err?.command,
    });
    
    // Provide helpful error messages
    if (err?.code === 'EAUTH' || (err?.message && err.message.includes('authentication'))) {
      throw new Error('Gmail authentication failed. Please verify your App-Specific Password is correct. Go to Google Account > Security > App passwords to create a new one.');
    }
    
    if (err?.code === 'ECONNECTION' || (err?.message && err.message.includes('connect'))) {
      throw new Error('Failed to connect to Gmail SMTP server. Please verify SMTP_HOST (smtp.gmail.com) and SMTP_PORT (587 or 465) are correct.');
    }
    
    if (err?.code === 'ETIMEDOUT') {
      throw new Error('Gmail SMTP connection timed out. Please check your network/firewall settings.');
    }
    
    // Re-throw with context
    throw new Error(`Failed to send email to ${to}: ${err?.message || 'Unknown error'}`);
  }
}

// Export functions
module.exports = { sendMail, initTransport };
