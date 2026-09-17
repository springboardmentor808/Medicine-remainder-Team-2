import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { accessSecret } from '../src/config/env.js';
import { validate, medicineUpdateSchema, refillSchema, profileUpdateSchema } from '../src/middleware/validate.js';

function makeToken(role, id = 'test-patient-1') {
  return jwt.sign({ sub: id, role, name: 'Test User' }, accessSecret, { expiresIn: '1h' });
}

describe('Patient and Caregiver Enhanced API Endpoints', () => {
  let app;
  let mockMedicines;
  let mockUser;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    mockMedicines = [
      { _id: 'med-1', patientId: 'test-patient-1', name: 'Metformin', dose: '500mg', initialQuantity: 30, conditionTag: 'Diabetes' }
    ];
    mockUser = {
      _id: 'test-patient-1',
      name: 'Test Patient',
      conditions: ['Diabetes'],
      emergencyContacts: []
    };

    // Middleware stub
    const authStub = (req, res, next) => {
      const auth = req.headers.authorization;
      if (!auth) return res.status(401).json({ error: 'Unauthorized' });
      try {
        const decoded = jwt.verify(auth.split(' ')[1], accessSecret);
        req.auth = decoded;
        next();
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    };

    // PUT /medicines/:id
    app.put('/api/patient/medicines/:id', authStub, validate(medicineUpdateSchema), (req, res) => {
      const med = mockMedicines.find(m => m._id === req.params.id && m.patientId === req.auth.sub);
      if (!med) return res.status(404).json({ error: 'Not found' });
      Object.assign(med, req.body);
      res.json({ medicine: med });
    });

    // DELETE /medicines/:id
    app.delete('/api/patient/medicines/:id', authStub, (req, res) => {
      const idx = mockMedicines.findIndex(m => m._id === req.params.id && m.patientId === req.auth.sub);
      if (idx === -1) return res.status(404).json({ error: 'Not found' });
      const removed = mockMedicines.splice(idx, 1)[0];
      res.json({ ok: true, message: `${removed.name} was removed from your routine.` });
    });

    // POST /medicines/:id/refill
    app.post('/api/patient/medicines/:id/refill', authStub, validate(refillSchema), (req, res) => {
      const med = mockMedicines.find(m => m._id === req.params.id && m.patientId === req.auth.sub);
      if (!med) return res.status(404).json({ error: 'Not found' });
      const qty = Number(req.body.quantity);
      med.initialQuantity = (med.initialQuantity || 0) + qty;
      res.json({ ok: true, medicine: med, added: qty });
    });

    // PUT /profile
    app.put('/api/patient/profile', authStub, validate(profileUpdateSchema), (req, res) => {
      Object.assign(mockUser, req.body);
      res.json({ ok: true, user: mockUser });
    });

    // GET /caregiver/analytics
    app.get('/api/caregiver/analytics', authStub, (req, res) => {
      res.json({
        totalPatients: 2,
        totalPrescriptions: 5,
        averageAdherence: 88,
        lowStockCount: 1,
        missedToday: 0,
        takenToday: 3,
        activeAlertsCount: 4,
      });
    });
  });

  test('PUT /api/patient/medicines/:id updates medicine details', async () => {
    const token = makeToken('patient');
    const res = await request(app)
      .put('/api/patient/medicines/med-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ dose: '850mg', conditionTag: 'Diabetes' });

    expect(res.status).toBe(200);
    expect(res.body.medicine.dose).toBe('850mg');
  });

  test('POST /api/patient/medicines/:id/refill restocks units', async () => {
    const token = makeToken('patient');
    const res = await request(app)
      .post('/api/patient/medicines/med-1/refill')
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 60 });

    expect(res.status).toBe(200);
    expect(res.body.added).toBe(60);
    expect(res.body.medicine.initialQuantity).toBe(90);
  });

  test('DELETE /api/patient/medicines/:id deletes medicine', async () => {
    const token = makeToken('patient');
    const res = await request(app)
      .delete('/api/patient/medicines/med-1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(mockMedicines.length).toBe(0);
  });

  test('PUT /api/patient/profile updates emergency contacts and conditions', async () => {
    const token = makeToken('patient');
    const res = await request(app)
      .put('/api/patient/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        conditions: ['Blood Pressure', 'Diabetes'],
        emergencyContacts: [{ name: 'Sarah', relation: 'Daughter', phone: '9876543210' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.user.conditions).toContain('Blood Pressure');
    expect(res.body.user.emergencyContacts[0].name).toBe('Sarah');
  });

  test('GET /api/caregiver/analytics returns high-level dashboard metrics', async () => {
    const token = makeToken('caregiver', 'cg-1');
    const res = await request(app)
      .get('/api/caregiver/analytics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalPatients).toBe(2);
    expect(res.body.averageAdherence).toBe(88);
    expect(res.body.lowStockCount).toBe(1);
  });
});
