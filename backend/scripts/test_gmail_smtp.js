/**
 * Test script to verify Gmail SMTP configuration
 * 
 * Usage:
 *   1. Edit backend/.env with your Gmail credentials
 *   2. Run: node backend/scripts/test_gmail_smtp.js
 * 
 * Requirements:
 *   - Gmail account with App-Specific Password (not regular password)
 *   - 2-Step Verification enabled on Google Account
 *   - App password created at: Google Account > Security > App passwords
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { sendMail, initTransport } = require('../utils/mailer');

const TEST_RECIPIENT = process.argv[2] || process.env.SMTP_USER;

async function testGmailSMTP() {
  console.log('========================================');
  console.log('Gmail SMTP Configuration Test');
  console.log('========================================\n');

  // Display current configuration (without password)
  console.log('Current SMTP Configuration:');
  console.log('  SMTP_HOST:', process.env.SMTP_HOST || '(not set)');
  console.log('  SMTP_PORT:', process.env.SMTP_PORT || '(not set)');
  console.log('  SMTP_USER:', process.env.SMTP_USER || '(not set)');
  console.log('  FROM_EMAIL:', process.env.FROM_EMAIL || '(not set)');
  console.log('');

  // Check if Gmail is configured
  if (!process.env.SMTP_HOST?.includes('gmail') || 
      !process.env.SMTP_USER || 
      process.env.SMTP_USER === 'your-gmail@gmail.com' ||
      !process.env.SMTP_PASS || 
      process.env.SMTP_PASS === 'your-app-specific-password') {
    console.error('ERROR: Gmail SMTP is not properly configured!');
    console.error('\nPlease edit backend/.env and set:');
    console.error('  SMTP_HOST=smtp.gmail.com');
    console.error('  SMTP_PORT=587');
    console.error('  SMTP_USER=your-gmail@gmail.com');
    console.error('  SMTP_PASS=your-16-char-app-password');
    console.error('\nTo create an App-Specific Password:');
    console.error('  1. Go to myaccount.google.com');
    console.error('  2. Navigate to Security > 2-Step Verification (enable it)');
    console.error('  3. Go to Security > App passwords');
    console.error('  4. Create a new app password for "Mail"');
    console.error('  5. Use that 16-character password as SMTP_PASS');
    process.exit(1);
  }

  // Test transporter initialization
  console.log('Testing transporter initialization...\n');
  try {
    await initTransport();
    console.log('✓ Transporter initialized successfully\n');
  } catch (err) {
    console.error('✗ Transporter initialization failed:', err.message);
    process.exit(1);
  }

  // Send test email
  console.log(`Sending test email to: ${TEST_RECIPIENT}`);
  console.log('----------------------------------------');

  const testHtml = `
    <!doctype html>
    <html>
    <head><meta charset="utf-8"/><title>Test Email</title></head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <h1 style="color: #2563eb;">✓ ElectroCart Email Test</h1>
      <p>This is a test email to verify your Gmail SMTP configuration is working correctly.</p>
      <p>If you received this email, your OTP verification emails should also work!</p>
      <hr>
      <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
    </body>
    </html>
  `;

  try {
    const result = await sendMail(
      TEST_RECIPIENT,
      'ElectroCart - Gmail SMTP Test',
      'This is a test email to verify your Gmail SMTP configuration is working correctly.',
      testHtml
    );

    console.log('✓ Test email sent successfully!');
    console.log('  Message ID:', result?.messageId);
    console.log('  Accepted:', result?.accepted);
    console.log('\n========================================');
    console.log('SUCCESS: Gmail SMTP is configured correctly!');
    console.log('========================================');
    console.log('\nThe OTP verification emails should now be');
    console.log('delivered to user Gmail addresses during registration.\n');
    
    process.exit(0);
  } catch (err) {
    console.error('\n✗ Test email failed!');
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
testGmailSMTP();
