import { jest } from '@jest/globals';
import { isMedicineDueAtTime, getLocalTimeParts, PRIMARY_TIME_BLOCKS } from '../src/jobs/smartReminderEngine.js';
import { sendTwilioSMS } from '../src/services/dispatchService.js';

describe('Smart Reminder Engine - Time & Schedule Matching', () => {
  test('matches primary morning slot at 08:00', () => {
    const med = { slot: 'morning', schedule: '08:00 AM' };
    const morningTime = { hhmm: '08:00', hour: 8, minute: 0, dateStr: '2026-09-10' };
    const res = isMedicineDueAtTime(med, morningTime);
    expect(res.isDue).toBe(true);
    expect(res.matchedSlot).toBe('morning');
  });

  test('matches primary afternoon slot at 14:00', () => {
    const med = { slot: 'afternoon', schedule: '02:00 PM' };
    const afternoonTime = { hhmm: '14:00', hour: 14, minute: 0, dateStr: '2026-09-10' };
    const res = isMedicineDueAtTime(med, afternoonTime);
    expect(res.isDue).toBe(true);
    expect(res.matchedSlot).toBe('afternoon');
  });

  test('matches primary night slot at 20:00', () => {
    const med = { slot: 'night', schedule: '08:00 PM' };
    const nightTime = { hhmm: '20:00', hour: 20, minute: 0, dateStr: '2026-09-10' };
    const res = isMedicineDueAtTime(med, nightTime);
    expect(res.isDue).toBe(true);
    expect(res.matchedSlot).toBe('night');
  });

  test('does not match morning slot at 08:01 or 07:59', () => {
    const med = { slot: 'morning', schedule: '08:00' };
    expect(isMedicineDueAtTime(med, { hhmm: '08:01', hour: 8, minute: 1 }).isDue).toBe(false);
    expect(isMedicineDueAtTime(med, { hhmm: '07:59', hour: 7, minute: 59 }).isDue).toBe(false);
  });

  test('supports custom repeated interval "every 8 hours"', () => {
    const med = { frequency: 'every 8 hours', slot: 'morning' };
    // 08:00 -> due
    expect(isMedicineDueAtTime(med, { hhmm: '08:00', hour: 8, minute: 0 }).isDue).toBe(true);
    // 16:00 -> due
    expect(isMedicineDueAtTime(med, { hhmm: '16:00', hour: 16, minute: 0 }).isDue).toBe(true);
    // 00:00 -> due
    expect(isMedicineDueAtTime(med, { hhmm: '00:00', hour: 0, minute: 0 }).isDue).toBe(true);
    // 12:00 -> NOT due
    expect(isMedicineDueAtTime(med, { hhmm: '12:00', hour: 12, minute: 0 }).isDue).toBe(false);
  });

  test('supports custom repeated interval "every 6 hours"', () => {
    const med = { schedule: 'Every 6 hours', slot: 'morning' };
    // 08:00 -> due
    expect(isMedicineDueAtTime(med, { hhmm: '08:00', hour: 8, minute: 0 }).isDue).toBe(true);
    // 14:00 (8 + 6) -> due
    expect(isMedicineDueAtTime(med, { hhmm: '14:00', hour: 14, minute: 0 }).isDue).toBe(true);
    // 20:00 (14 + 6) -> due
    expect(isMedicineDueAtTime(med, { hhmm: '20:00', hour: 20, minute: 0 }).isDue).toBe(true);
    // 09:00 -> NOT due
    expect(isMedicineDueAtTime(med, { hhmm: '09:00', hour: 9, minute: 0 }).isDue).toBe(false);
  });
});

describe('Smart Reminder Engine - Timezone Handling', () => {
  test('getLocalTimeParts correctly converts UTC date to Asia/Kolkata', () => {
    // 2026-09-10 02:30 UTC = 2026-09-10 08:00 IST (+5:30)
    const utcDate = new Date(Date.UTC(2026, 8, 10, 2, 30, 0));
    const parts = getLocalTimeParts(utcDate, 'Asia/Kolkata');
    expect(parts.hhmm).toBe('08:00');
    expect(parts.hour).toBe(8);
    expect(parts.minute).toBe(0);
    expect(parts.dateStr).toBe('2026-09-10');
  });

  test('getLocalTimeParts correctly handles day boundary over midnight IST', () => {
    // 2026-09-10 19:00 UTC = 2026-09-11 00:30 IST (+5:30 next day)
    const utcDate = new Date(Date.UTC(2026, 8, 10, 19, 0, 0));
    const parts = getLocalTimeParts(utcDate, 'Asia/Kolkata');
    expect(parts.hhmm).toBe('00:30');
    expect(parts.dateStr).toBe('2026-09-11');
  });
});

describe('Multi-Channel Dispatch - Twilio SMS Format', () => {
  test('produces exact required message text format', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const res = await sendTwilioSMS({
      to: '+919876543210',
      patientName: 'John',
      medicineName: 'Metformin',
      dose: '500mg',
    });
    expect(res.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Hi John, time to take 1 tablet of Metformin (500mg). Reply YES when taken.')
    );
    consoleSpy.mockRestore();
  });
});
