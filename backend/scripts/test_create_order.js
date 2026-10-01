require('dotenv').config();
const adapter = require('../models/adapter');

(async () => {
  try {
    const data = {
      userId: 1,
      orderItems: [{ productId: 1, name: 'Test', qty: 1, price: 1 }],
      shippingAddress: { fullName: 'Test User', line1: '123', city: 'City', country: 'Country' },
      totalPrice: 1,
      paymentMethod: 'khalti',
      isPaid: false
    };
    const res = await adapter.Order.create(data);
    console.log('Created order OK:', res._id || res.id || res);
    process.exit(0);
  } catch (e) {
    console.error('Test createOrder failed:', e && (e.stack || e.message || e));
    process.exit(2);
  }
})();
