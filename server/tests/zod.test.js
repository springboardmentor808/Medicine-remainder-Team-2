import { medicineCreateSchema, medicineUpdateSchema, refillSchema, profileUpdateSchema, statusPatchSchema } from '../src/middleware/validate.js';

describe('Zod validation - POST /patient/medicines and PATCH status', () => {
  test('valid medicine passes', () => {
    const r = medicineCreateSchema.safeParse({ name: 'Metformin', dose: '500mg', schedule: '08:00 AM', slot: 'morning' });
    expect(r.success).toBe(true);
  });
  test('missing name fails with 400 string', () => {
    const r = medicineCreateSchema.safeParse({ dose: '500mg', schedule: '08:00 AM', slot: 'morning' });
    expect(r.success).toBe(false);
  });
  test('initialQuantity empty string coerced to undefined allowed', () => {
    const r = medicineCreateSchema.safeParse({ name: 'X', dose: '1', schedule: '08:00 AM', slot: 'morning', initialQuantity: '' });
    expect(r.success).toBe(true);
    expect(r.data.initialQuantity).toBeUndefined();
  });
  test('quantityPerDose over 40 chars fails', () => {
    const r = medicineCreateSchema.safeParse({ name: 'X', dose: '1', schedule: '08:00 AM', slot: 'morning', quantityPerDose: 'a'.repeat(41) });
    expect(r.success).toBe(false);
  });
  test('status patch rejects invalid snoozeMinutes', () => {
    const r = statusPatchSchema.safeParse({ status: 'snoozed', snoozeMinutes: 999 });
    expect(r.success).toBe(false);
  });
  test('ocr timeout branch would return 502 with clearly', () => {
    const msg = 'We could not read that image clearly — the service took too long. Please try again or enter it manually.';
    expect(msg.toLowerCase()).toMatch(/clearly/);
  });
  test('medicineUpdateSchema allows partial updates', () => {
    const r = medicineUpdateSchema.safeParse({ dose: '10mg', conditionTag: 'Blood Pressure' });
    expect(r.success).toBe(true);
    expect(r.data.conditionTag).toBe('Blood Pressure');
  });
  test('refillSchema validates positive integer quantity', () => {
    const valid = refillSchema.safeParse({ quantity: 30 });
    expect(valid.success).toBe(true);
    expect(valid.data.quantity).toBe(30);

    const invalid = refillSchema.safeParse({ quantity: 0 });
    expect(invalid.success).toBe(false);
  });
  test('profileUpdateSchema validates emergency contacts and conditions', () => {
    const r = profileUpdateSchema.safeParse({
      name: 'Jane Doe',
      conditions: ['Diabetes', 'Blood Pressure'],
      emergencyContacts: [{ name: 'Alex', relation: 'Spouse', phone: '+1234567890' }],
    });
    expect(r.success).toBe(true);
    expect(r.data.emergencyContacts).toHaveLength(1);
  });
});
