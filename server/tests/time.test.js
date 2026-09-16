import { toISTDateString, istDayRange, istDateNDaysAgo } from '../src/utils/time.js';

describe('IST timezone helper - midnight cutoff', () => {
  test('11:50 PM IST and 12:05 AM IST next day bucket to different IST dates', () => {
    // 2026-09-01 23:50 IST = 2026-09-01 18:20 UTC
    const d1 = new Date(Date.UTC(2026, 8, 1, 18, 20, 0));
    // 2026-09-02 00:05 IST = 2026-09-01 18:35 UTC (previous UTC day same as above UTC but next IST day)
    const d2 = new Date(Date.UTC(2026, 8, 1, 18, 35, 0));
    expect(toISTDateString(d1)).toBe('2026-09-01');
    expect(toISTDateString(d2)).toBe('2026-09-02');
    expect(toISTDateString(d1)).not.toBe(toISTDateString(d2));
  });

  test('istDayRange correctly maps IST midnight to UTC 18:30 previous day', () => {
    const { start, end } = istDayRange('2026-09-01');
    // IST 00:00 = UTC 18:30 previous day
    expect(start.toISOString()).toBe('2026-08-31T18:30:00.000Z');
    expect(end.toISOString()).toBe('2026-09-01T18:29:59.999Z');
  });

  test('streak grouping uses istDate not toISOString', () => {
    const logs = [
      { createdAt: new Date(Date.UTC(2026, 8, 1, 18, 20, 0)), status: 'taken' }, // IST 2026-09-01 23:50
      { createdAt: new Date(Date.UTC(2026, 8, 1, 18, 35, 0)), status: 'taken' }, // IST 2026-09-02 00:05
    ];
    const byDay = {};
    logs.forEach(l => {
      const d = toISTDateString(l.createdAt);
      byDay[d] = (byDay[d] || 0) + 1;
    });
    expect(byDay['2026-09-01']).toBe(1);
    expect(byDay['2026-09-02']).toBe(1);
  });
});
