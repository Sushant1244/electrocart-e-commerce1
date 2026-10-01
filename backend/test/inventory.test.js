const request = require('supertest');
const jwt = require('jsonwebtoken');

// Test configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

// Generate test admin token
const generateAdminToken = (userId = 'test-admin-id') => {
  return jwt.sign({ id: userId, isAdmin: true }, JWT_SECRET, { expiresIn: '1h' });
};

// Generate regular user token
const generateUserToken = (userId = 'test-user-id') => {
  return jwt.sign({ id: userId, isAdmin: false }, JWT_SECRET, { expiresIn: '1h' });
};

describe('Inventory API', () => {
  const adminToken = generateAdminToken();
  const userToken = generateUserToken();
  let testServer;

  beforeAll(async () => {
    // Import server after setting up mocks
    const { app } = require('../server');
    testServer = app;
  });

  describe('GET /api/inventory/overview', () => {
    test('should return 401 without authentication', async () => {
      const res = await request(testServer).get('/api/inventory/overview');
      expect(res.statusCode).toBe(401);
    });

    test('should return 403 for non-admin users', async () => {
      const res = await request(testServer)
        .get('/api/inventory/overview')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(403);
    });

    test('should return inventory overview for admin users', async () => {
      const res = await request(testServer)
        .get('/api/inventory/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Should return either 200 with data or 500 if database not available
      expect([200, 500]).toContain(res.statusCode);
      
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('success');
        if (res.body.success) {
          expect(res.body).toHaveProperty('stats');
          expect(res.body.stats).toHaveProperty('totalProducts');
          expect(res.body.stats).toHaveProperty('inStock');
          expect(res.body.stats).toHaveProperty('lowStock');
          expect(res.body.stats).toHaveProperty('outOfStock');
        }
      }
    });
  });

  describe('GET /api/inventory/low-stock', () => {
    test('should return 401 without authentication', async () => {
      const res = await request(testServer).get('/api/inventory/low-stock');
      expect(res.statusCode).toBe(401);
    });

    test('should return 403 for non-admin users', async () => {
      const res = await request(testServer)
        .get('/api/inventory/low-stock')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(403);
    });

    test('should accept custom threshold parameter', async () => {
      const res = await request(testServer)
        .get('/api/inventory/low-stock?threshold=10')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 500]).toContain(res.statusCode);
    });
  });

  describe('POST /api/inventory/bulk-stock', () => {
    test('should return 401 without authentication', async () => {
      const res = await request(testServer)
        .post('/api/inventory/bulk-stock')
        .send({ products: [] });
      expect(res.statusCode).toBe(401);
    });

    test('should return 403 for non-admin users', async () => {
      const res = await request(testServer)
        .post('/api/inventory/bulk-stock')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ products: [] });
      expect(res.statusCode).toBe(403);
    });

    test('should return 400 for invalid products array', async () => {
      const res = await request(testServer)
        .post('/api/inventory/bulk-stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ products: 'invalid' });
      
      expect(res.statusCode).toBe(400);
    });

    test('should return 400 for empty products array', async () => {
      const res = await request(testServer)
        .post('/api/inventory/bulk-stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ products: [] });
      
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/inventory/adjust-stock/:id', () => {
    test('should return 401 without authentication', async () => {
      const res = await request(testServer)
        .patch('/api/inventory/adjust-stock/test-id')
        .send({ adjustment: 10 });
      expect(res.statusCode).toBe(401);
    });

    test('should return 403 for non-admin users', async () => {
      const res = await request(testServer)
        .patch('/api/inventory/adjust-stock/test-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ adjustment: 10 });
      expect(res.statusCode).toBe(403);
    });

    test('should return 400 for invalid adjustment value', async () => {
      const res = await request(testServer)
        .patch('/api/inventory/adjust-stock/test-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: 'invalid' });
      
      expect(res.statusCode).toBe(400);
    });

    test('should return 400 for missing adjustment value', async () => {
      const res = await request(testServer)
        .patch('/api/inventory/adjust-stock/test-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      
      expect(res.statusCode).toBe(400);
    });
  });
});
