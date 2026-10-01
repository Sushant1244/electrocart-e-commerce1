jest.mock('../utils/mailer', () => ({ sendMail: jest.fn().mockResolvedValue({ accepted: ['user@example.com'] }) }));
jest.mock('../models/adapter', () => ({
  Notification: { create: jest.fn() },
  User: { findById: jest.fn() }
}));

const adapter = require('../models/adapter');
const { createNotification } = require('../controllers/notificationController');

describe('notificationController.createNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a notification with meta and returns 201; sends email when userId provided', async () => {
    const fakeCreated = { id: 'n1', title: 'Added to wishlist', body: 'Item added', meta: { productId: 'p1' } };
    adapter.Notification.create.mockResolvedValue(fakeCreated);
    adapter.User.findById.mockResolvedValue({ id: 123, email: 'user@example.com' });

    const req = { body: { userId: 123, title: 'Added to wishlist', body: 'Item added', meta: { productId: 'p1' } } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createNotification(req, res);

    expect(adapter.Notification.create).toHaveBeenCalledWith({ userId: 123, title: 'Added to wishlist', body: 'Item added', meta: { productId: 'p1' } });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakeCreated);
  // Verify mailer was invoked for the user's email (positional args: to, subject, text, html)
  const mailer = require('../utils/mailer');
  expect(mailer.sendMail).toHaveBeenCalledWith('user@example.com', expect.any(String), expect.any(String), expect.any(String));
  });
});
