/**
 * Test script to send order confirmation email
 * Usage: node backend/scripts/send_order_confirmation.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { sendMail, initTransport } = require('../utils/mailer');
const { orderPlacedHtml } = require('../utils/emailTemplates');

// Sample order data
const testOrder = {
  id: 'TEST-2024-001',
  _id: 'TEST-2024-001',
  orderItems: [
    { name: 'iPhone 16 Pro Max', quantity: 1, price: 185000 },
    { name: 'AirPods Pro', quantity: 2, price: 15000 },
    { name: 'MacBook Air M4', quantity: 1, price: 149999 }
  ],
  totalPrice: 364998,
  paymentMethod: 'Khalti',
  shippingAddress: {
    fullName: 'Sushan Shah',
    line1: 'Kathmandu, Nepal',
    city: 'Kathmandu',
    country: 'Nepal'
  },
  createdAt: new Date().toISOString()
};

const RECIPIENT_EMAIL = 'rrag7927@gmail.com';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function sendOrderConfirmation() {
  console.log('========================================');
  console.log('Sending Order Confirmation Email');
  console.log('========================================\n');

  console.log('Recipient:', RECIPIENT_EMAIL);
  console.log('Order ID:', testOrder.id);
  console.log('Total:', testOrder.totalPrice);
  console.log('');

  // Initialize transport
  console.log('Initializing Gmail SMTP...');
  try {
    await initTransport();
    console.log('✓ SMTP connected\n');
  } catch (err) {
    console.error('✗ SMTP connection failed:', err.message);
    process.exit(1);
  }

  // Generate email HTML
  const html = orderPlacedHtml({ order: testOrder, clientUrl: CLIENT_URL });

  console.log('Sending email...');
  try {
    const result = await sendMail(
      RECIPIENT_EMAIL,
      `Order ${testOrder.id} Confirmation - ElectroCart`,
      `Your order ${testOrder.id} has been confirmed! Total: Rs ${testOrder.totalPrice}`,
      html
    );

    console.log('✓ Email sent successfully!');
    console.log('  Message ID:', result?.messageId);
    console.log('  Accepted:', result?.accepted);
    console.log('\n========================================');
    console.log('SUCCESS: Order confirmation email sent!');
    console.log('========================================');
    console.log(`\nCheck ${RECIPIENT_EMAIL} for the order confirmation.`);
    
    process.exit(0);
  } catch (err) {
    console.error('\n✗ Email sending failed!');
    console.error('Error:', err.message);
    process.exit(1);
  }
}

sendOrderConfirmation();
