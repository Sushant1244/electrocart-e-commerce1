/**
 * Test script to send OTP to a specific Gmail address
 * 
 * Usage:
 *   node backend/scripts/test_send_otp.js <email>
 *   
 * Example:
 *   node backend/scripts/test_send_otp.js rrag7927@gmail.com
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { sendMail, initTransport } = require('../utils/mailer');
const crypto = require('crypto');

const TEST_RECIPIENT = process.argv[2] || 'rrag7927@gmail.com';

async function sendOTPTest() {
  console.log('========================================');
  console.log('OTP Email Test');
  console.log('========================================\n');

  console.log(`Sending OTP to: ${TEST_RECIPIENT}`);
  console.log('');

  // Generate a 6-digit OTP
  const otpInt = crypto.randomInt(0, 1000000);
  const otp = String(otpInt).padStart(6, '0');

  console.log(`Generated OTP: ${otp}`);
  console.log('----------------------------------------');

  // OTP HTML template from authController.js
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

  try {
    // Initialize the transporter first
    await initTransport();
    console.log('✓ Transporter initialized successfully');

    // Send the OTP email
    const result = await sendMail(
      TEST_RECIPIENT,
      'Verify your ElectroCart email',
      `Your verification code is: ${otp}`,
      otpHtml
    );

    console.log('✓ OTP email sent successfully!');
    console.log('  Message ID:', result?.messageId);
    console.log('  Accepted:', result?.accepted);
    console.log('\n========================================');
    console.log('SUCCESS: OTP sent to ' + TEST_RECIPIENT);
    console.log('========================================\n');
    console.log('Please check your Gmail inbox for the OTP email.');
    console.log('The OTP is: ' + otp);
    console.log('');
    
    process.exit(0);
  } catch (err) {
    console.error('\n✗ Failed to send OTP email!');
    console.error('Error:', err.message);
    console.error('\n========================================');
    console.error('Troubleshooting:');
    console.error('========================================');
    
    if (err.message.includes('EAUTH') || err.message.includes('authentication')) {
      console.error('• Authentication failed - check your App-Specific Password');
      console.error('• Make sure 2-Step Verification is enabled on your Google Account');
      console.error('• Create a new App password if needed');
    } else if (err.message.includes('ECONNREFUSED')) {
      console.error('• Connection refused - check SMTP_HOST and SMTP_PORT');
    } else if (err.message.includes('ETIMEDOUT')) {
      console.error('• Connection timed out - check your network/firewall');
    }
    
    process.exit(1);
  }
}

// Run the test
sendOTPTest();
