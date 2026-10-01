// Simple test script to send a test email using backend mailer.
require('dotenv').config();
const { sendMail } = require('../utils/mailer');

async function main() {
  const to = process.argv[2] || process.env.TEST_SMTP_TO;
  if (!to) {
    console.error('Usage: node scripts/test_smtp.js recipient@example.com  (or set TEST_SMTP_TO in .env)');
    process.exit(2);
  }
  try {
    const res = await sendMail(to, 'ElectroCart SMTP test', 'This is a test email from ElectroCart', '<p>This is a <strong>test</strong> email from ElectroCart</p>');
    console.log('sendMail result:', res);
    process.exit(0);
  } catch (e) {
    console.error('Failed to send test email:', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
