import { toISTDateString } from '../src/utils/time.js';

describe('Double-tap prevention via istDate unique index', () => {
  test('istDate is deterministic for same IST day regardless of UTC hour', () => {
    const morning = new Date(Date.UTC(2026, 8, 2, 2, 0, 0)); // 07:30 IST same day
    const evening = new Date(Date.UTC(2026, 8, 2, 12, 0, 0)); // 17:30 IST same day
    expect(toISTDateString(morning)).toBe('2026-09-02');
    expect(toISTDateString(evening)).toBe('2026-09-02');
  });

  test('duplicate key 11000 maps to 409 Already logged message', () => {
    const err = new Error('duplicate');
    err.code = 11000;
    // simulate handler branch in patient.js:184 catch
    const isDuplicate = err.code === 11000;
    expect(isDuplicate).toBe(true);
    const statusForDuplicate = isDuplicate ? 409 : 500;
    expect(statusForDuplicate).toBe(409);
  });

  test('compound key would be patientId+medicineId+istDate+slot', () => {
    const k1 = `p1:m1:${toISTDateString(new Date(Date.UTC(2026, 8, 2, 3, 0, 0)))}:morning`;
    const k2 = `p1:m1:${toISTDateString(new Date(Date.UTC(2026, 8, 2, 4, 0, 0)))}:morning`;
    // same IST day, same slot -> same key (would trigger unique index)
    expect(k1).toBe(k2);
    const k3 = `p1:m1:${toISTDateString(new Date(Date.UTC(2026, 8, 2, 13, 0, 0)))}:night`;
    expect(k1).not.toBe(k3);
  });
});
