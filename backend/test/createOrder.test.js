// Unit test for createOrder controller: ensure sendMail is called after order creation
jest.mock('../utils/mailer', () => ({ sendMail: jest.fn() }));
const { sendMail } = require('../utils/mailer');

jest.mock('../models/adapter', () => ({
  Order: { create: jest.fn().mockResolvedValue({ id: 'ord123', _id: 'ord123', email: 'user@example.com' }) },
  Notification: { create: jest.fn().mockResolvedValue({}) }
}));

const adapterMock = require('../models/adapter');
const { createOrder } = require('../controllers/orderController');

describe('createOrder controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sends order confirmation email when order created', async () => {
    const req = {
      user: { _id: 'u1', email: 'user@example.com' },
      body: {
        shippingAddress: { fullName: 'Test User', line1: '1 Test St', city: 'Kathmandu', country: 'Nepal' },
        items: [{ name: 'Test product', price: 100, quantity: 1 }],
        total: 100,
        paymentMethod: 'cod'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createOrder(req, res);

    expect(adapterMock.Order.create).toHaveBeenCalled();
    expect(adapterMock.Notification.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Order placed' }));
    expect(sendMail).toHaveBeenCalledWith('user@example.com', expect.stringContaining('Order'), expect.any(String), expect.any(String));
    expect(res.status).toHaveBeenCalledWith(201);
  }, 10000);
});
