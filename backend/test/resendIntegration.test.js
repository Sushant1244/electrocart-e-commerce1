const request = require('supertest');
const serverModule = require('../server'); // exports { app, startServer }
const app = serverModule.app || serverModule;
const mailer = require('../utils/mailer');

describe('resend verification integration', () => {
  test('does not call sendMail with empty recipient', async () => {
    // mock sendMail to avoid real network calls and capture calls
    const orig = mailer.sendMail;
    const calls = [];
    mailer.sendMail = async function(to, subject, text, html) {
      calls.push({ to, subject });
      return { accepted: to ? [to] : [] };
    };

    // send request with empty email should be rejected
    const res = await request(app).post('/api/auth/resend-verification').send({ email: '' });
    expect(res.status).toBe(400);

    // ensure sendMail was not called with an empty recipient
    expect(calls.every(c => c.to && String(c.to).trim().length > 0)).toBe(true);

    // restore
    mailer.sendMail = orig;
  }, 10000);
});
