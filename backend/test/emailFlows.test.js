jest.mock('../utils/mailer', () => ({ sendMail: jest.fn().mockResolvedValue({ accepted: ['user@example.com'] }) }));
jest.mock('../models/adapter', () => ({
  User: { findOne: jest.fn().mockResolvedValue({ id: 'u1', email: 'user@example.com' }), findByIdAndUpdate: jest.fn() },
  Order: {
    findById: jest.fn().mockResolvedValue({ id: 'o1', _id: 'o1', email: 'user@example.com', userId: 'u1', status: 'processing' }),
    findByIdAndUpdate: jest.fn().mockResolvedValue({ id: 'o1', _id: 'o1', email: 'user@example.com', status: 'shipped' })
  },
  Notification: { create: jest.fn().mockResolvedValue({}) }
}));

const { sendMail } = require('../utils/mailer');
const adapter = require('../models/adapter');
const { forgotPassword } = require('../controllers/authController');
const { updateOrderStatus } = require('../controllers/orderController');

describe('Email flows', () => {
  beforeEach(() => jest.clearAllMocks());

  test('forgotPassword triggers sendMail', async () => {
    const req = { body: { email: 'user@example.com' }, protocol: 'http', get: () => 'localhost:5001' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await forgotPassword(req, res);
    expect(sendMail).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  test('updateOrderStatus emails user on status change', async () => {
    const req = { params: { id: 'o1' }, body: { status: 'shipped', deliveryStatus: 'in_transit' }, user: { isAdmin: true } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    await updateOrderStatus(req, res);
    expect(adapter.Order.findByIdAndUpdate).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });
});
