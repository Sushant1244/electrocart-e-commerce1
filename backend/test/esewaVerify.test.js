const request = require('supertest');
const axios = require('axios');

jest.mock('axios');

// Mock adapter to observe order updates
const mockFindByIdAndUpdate = jest.fn().mockResolvedValue({ id: 'ord123', _id: 'ord123' });
jest.mock('../models/adapter', () => ({
  Order: { findByIdAndUpdate: mockFindByIdAndUpdate }
}));

const { app } = require('../server');

describe('eSewa verify endpoint', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.ESEWA_VERIFY_URL = 'https://esewa.test/verify';
    process.env.ESEWA_SECRET = 'testsecret';
  });

  test('calls provider and updates order on success', async () => {
    // mock axios to return a 200 success payload
    axios.post.mockResolvedValue({ status: 200, data: { success: true, txn: 'tx123' } });

    const payload = { token: 'tok-abc', amount: 1000, orderId: 'ord123' };
    const res = await request(app).post('/api/payments/esewa/verify').send(payload).set('Accept', 'application/json');
    expect(res.statusCode).toBe(200);
    expect(res.body && res.body.ok).toBeTruthy();
    // ensure order updater was called with isPaid true and paymentResult
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(payload.orderId, expect.objectContaining({ isPaid: true, paymentResult: expect.objectContaining({ provider: 'esewa', token: payload.token }) }));
  });

  test('dev fallback accepts token when provider not configured', async () => {
    // remove env to trigger dev fallback
    delete process.env.ESEWA_VERIFY_URL;
    delete process.env.ESEWA_SECRET;
    const payload = { token: 'dev-token', amount: 500, orderId: 'ord-dev' };
    const res = await request(app).post('/api/payments/esewa/verify').send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body && res.body.ok).toBeTruthy();
    // ensure order was attempted to be updated in dev path as well
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(payload.orderId, expect.objectContaining({ isPaid: true, paymentResult: expect.objectContaining({ provider: 'esewa', token: payload.token }) }));
  });
});
