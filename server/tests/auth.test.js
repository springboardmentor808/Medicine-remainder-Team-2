import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { requireAuth, requireRole } from '../src/middleware/auth.js';
import { accessSecret } from '../src/config/env.js';

function makeToken(role) {
  return jwt.sign({ sub: 'test-user-id', role, name: 'Test' }, accessSecret, { expiresIn: '1h' });
}

describe('JWT & Role guard - 403 on patient accessing caregiver dashboard', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.get('/api/caregiver/dashboard', requireAuth, requireRole('caregiver'), (req, res) => res.json({ ok: true }));
    app.get('/api/patient/dashboard', requireAuth, requireRole('patient'), (req, res) => res.json({ ok: true }));
    // httpOnly path
    app.get('/api/caregiver/dashboard-cookie', (req, res, next) => {
      req.headers.authorization = req.headers.authorization || '';
      // simulate cookie middleware tested via requireAuth that reads req.cookies
      next();
    });
  });

  test('patient token cannot access GET /caregiver/dashboard -> 403', async () => {
    const patientToken = makeToken('patient');
    const res = await request(app)
      .get('/api/caregiver/dashboard')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/another account type/i);
  });

  test('caregiver token can access caregiver dashboard -> 200', async () => {
    const caregiverToken = makeToken('caregiver');
    const res = await request(app)
      .get('/api/caregiver/dashboard')
      .set('Authorization', `Bearer ${caregiverToken}`);
    expect(res.status).toBe(200);
  });

  test('caregiver token cannot access patient dashboard -> 403', async () => {
    const caregiverToken = makeToken('caregiver');
    const res = await request(app)
      .get('/api/patient/dashboard')
      .set('Authorization', `Bearer ${caregiverToken}`);
    expect(res.status).toBe(403);
  });

  test('missing token -> 401', async () => {
    const res = await request(app).get('/api/caregiver/dashboard');
    expect(res.status).toBe(401);
  });

  test('httpOnly cookie auth works when Authorization missing', async () => {
    // build app that uses cookie
    const cookieApp = express();
    cookieApp.use((req, _res, next) => { req.cookies = { pillsync_access: makeToken('caregiver') }; next(); });
    cookieApp.get('/test', requireAuth, requireRole('caregiver'), (_req, res) => res.json({ ok: true }));
    const res = await request(cookieApp).get('/test');
    expect(res.status).toBe(200);
  });
});
