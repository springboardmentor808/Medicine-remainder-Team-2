import cron from 'node-cron';
import Medicine from '../models/Medicine.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import ReminderLog from '../models/ReminderLog.js';
import { sendTwilioSMS, sendSendGridEmail, sendFCMNotification } from '../services/dispatchService.js';
import { emitToPatient } from '../socket.js';

// Primary default time blocks
export const PRIMARY_TIME_BLOCKS = {
  morning: '08:00',
  afternoon: '14:00',
  night: '20:00',
};

/**
 * Converts a Date into HH:mm and YYYY-MM-DD strings in the specified IANA timezone.
 */
export function getLocalTimeParts(date = new Date(), timeZone = 'Asia/Kolkata') {
  try {
    const formatterTime = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const formatterDate = new Intl.DateTimeFormat('en-CA', { // produces YYYY-MM-DD
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const [hour, minute] = formatterTime.format(date).split(':');
    const localDateStr = formatterDate.format(date);
    return {
      hhmm: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
      hour: parseInt(hour, 10),
      minute: parseInt(minute, 10),
      dateStr: localDateStr,
    };
  } catch (e) {
    // Fallback if invalid timezone passed
    const utcHours = String(date.getUTCHours()).padStart(2, '0');
    const utcMins = String(date.getUTCMinutes()).padStart(2, '0');
    const dateStr = date.toISOString().slice(0, 10);
    return { hhmm: `${utcHours}:${utcMins}`, hour: date.getUTCHours(), minute: date.getUTCMinutes(), dateStr };
  }
}

/**
 * Checks if a medicine's schedule matches the current local time.
 * Supports:
 * - Primary slots: 'morning' (08:00), 'afternoon' (14:00), 'night' (20:00)
 * - Repeated intervals: 'every 8 hours' (08:00, 16:00, 00:00), 'every 6 hours', 'every 12 hours', etc.
 * - Exact HH:mm string (e.g. '08:00 AM' or '14:00')
 */
export function isMedicineDueAtTime(medicine, localTime) {
  const { hhmm, hour, minute } = localTime;
  const rawSchedule = (medicine.schedule || '').trim().toLowerCase();
  const rawFrequency = (medicine.frequency || '').trim().toLowerCase();
  const slot = (medicine.slot || '').trim().toLowerCase();

  // 1. Repeated interval check (e.g., 'every 8 hours', 'every 6 hours', 'every 12 hours')
  const intervalMatch = rawSchedule.match(/every\s+(\d+)\s*hours?/i) || rawFrequency.match(/every\s+(\d+)\s*hours?/i);
  if (intervalMatch) {
    const intervalHours = parseInt(intervalMatch[1], 10);
    if (intervalHours > 0 && minute === 0) {
      // Anchored at 08:00 (e.g., every 8 hours -> 08:00, 16:00, 00:00)
      const hourDiff = (hour - 8 + 24) % 24;
      if (hourDiff % intervalHours === 0) {
        return { isDue: true, matchedSlot: `${hhmm}_interval_${intervalHours}h`, timeLabel: hhmm };
      }
    }
  }

  // 2. Primary 3-time-block check
  if (slot === 'morning' && hhmm === PRIMARY_TIME_BLOCKS.morning) {
    return { isDue: true, matchedSlot: 'morning', timeLabel: PRIMARY_TIME_BLOCKS.morning };
  }
  if (slot === 'afternoon' && hhmm === PRIMARY_TIME_BLOCKS.afternoon) {
    return { isDue: true, matchedSlot: 'afternoon', timeLabel: PRIMARY_TIME_BLOCKS.afternoon };
  }
  if (slot === 'night' && hhmm === PRIMARY_TIME_BLOCKS.night) {
    return { isDue: true, matchedSlot: 'night', timeLabel: PRIMARY_TIME_BLOCKS.night };
  }

  // 3. Exact matching for schedule strings like '08:00', '08:00 AM', '14:00', '02:00 PM'
  const timeRegexMatch = rawSchedule.match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$/i);
  if (timeRegexMatch) {
    let schedHour = parseInt(timeRegexMatch[1], 10);
    const schedMin = parseInt(timeRegexMatch[2], 10);
    const meridian = timeRegexMatch[3]?.toLowerCase();

    if (meridian === 'pm' && schedHour < 12) schedHour += 12;
    if (meridian === 'am' && schedHour === 12) schedHour = 0;

    const schedHHMM = `${String(schedHour).padStart(2, '0')}:${String(schedMin).padStart(2, '0')}`;
    if (schedHHMM === hhmm) {
      return { isDue: true, matchedSlot: slot || schedHHMM, timeLabel: schedHHMM };
    }
  }

  return { isDue: false };
}

/**
 * Dispatches multi-channel alerts for a specific medicine reminder,
 * recording in ReminderLog for absolute idempotency.
 */
export async function dispatchReminder({ patient, medicine, slot, scheduledDate, scheduledTime, isSnooze = false }) {
  const doseKey = `${medicine._id}_${scheduledDate}_${slot}`;

  // Idempotency check:
  let log = await ReminderLog.findOne({
    patientId: patient._id,
    medicineId: medicine._id,
    scheduledDate,
    slot,
  });

  if (log) {
    // If already taken or alerted and not a valid snooze firing, do not alert again
    if (!isSnooze && (log.status === 'alerted' || log.status === 'taken')) {
      console.log(`[SmartReminderEngine] Skipping duplicate reminder for ${patient.name} - ${medicine.name} (${slot}) on ${scheduledDate}`);
      return { dispatched: false, reason: 'already_alerted' };
    }
  } else {
    // Create new scheduled log
    log = new ReminderLog({
      patientId: patient._id,
      medicineId: medicine._id,
      doseKey,
      scheduledDate,
      slot,
      scheduledTime,
      timezone: patient.timezone || 'Asia/Kolkata',
      status: 'scheduled',
    });
  }

  // Multi-channel dispatch
  const channels = ['in_app'];
  const deliveryMeta = {};

  // 1. Twilio SMS
  if (patient.phone) {
    try {
      const smsRes = await sendTwilioSMS({
        to: patient.phone,
        patientName: patient.name,
        medicineName: medicine.name,
        dose: medicine.dose,
      });
      if (smsRes.success) {
        channels.push('sms');
        deliveryMeta.smsMessageId = smsRes.messageId;
      }
    } catch (e) {
      deliveryMeta.lastError = `SMS error: ${e.message}`;
    }
  }

  // 2. SendGrid Email
  if (patient.email) {
    try {
      const emailRes = await sendSendGridEmail({
        to: patient.email,
        patientName: patient.name,
        medicineName: medicine.name,
        dose: medicine.dose,
        schedule: medicine.schedule,
        timeBlock: slot,
      });
      if (emailRes.success) {
        channels.push('email');
        deliveryMeta.emailMessageId = emailRes.messageId;
      }
    } catch (e) {
      deliveryMeta.lastError = `Email error: ${e.message}`;
    }
  }

  // 3. Firebase Cloud Messaging (FCM)
  if (patient.fcmToken) {
    try {
      const fcmRes = await sendFCMNotification({
        token: patient.fcmToken,
        patientName: patient.name,
        medicineName: medicine.name,
        dose: medicine.dose,
        slot,
        medicineId: medicine._id,
      });
      if (fcmRes.success) {
        channels.push('fcm');
        deliveryMeta.fcmMessageId = fcmRes.messageId;
      }
    } catch (e) {
      deliveryMeta.lastError = `FCM error: ${e.message}`;
    }
  }

  // 4. In-App Notification & WebSocket
  const inAppNotif = await Notification.create({
    recipientId: patient._id,
    type: 'medicine_added',
    title: isSnooze ? `Snooze Reminder: ${medicine.name}` : `Time for ${medicine.name}`,
    message: `Hi ${patient.name}, time to take 1 tablet of ${medicine.name} (${medicine.dose}). Reply YES when taken.`,
    channels,
    delivery: 'sent',
  });
  emitToPatient(patient._id, 'alert', inAppNotif);

  // Update ReminderLog with alerted state and clear snooze if it was triggered
  log.status = 'alerted';
  log.alertedAt = new Date();
  log.channels = channels;
  log.deliveryMeta = deliveryMeta;
  if (isSnooze) {
    log.snoozedUntil = null; // Snooze satisfied
  }
  await log.save();

  console.log(`[SmartReminderEngine] Dispatched ${isSnooze ? 'snoozed ' : ''}reminder to ${patient.name} for ${medicine.name} (${channels.join(', ')})`);
  return { dispatched: true, log };
}

/**
 * Checks and triggers any active Snooze reminders where snoozedUntil <= now.
 */
export async function processSnoozeQueue(now = new Date()) {
  const pendingSnoozes = await ReminderLog.find({
    status: 'snoozed',
    snoozedUntil: { $lte: now },
  }).populate('patientId').populate('medicineId');

  let processedCount = 0;
  for (const log of pendingSnoozes) {
    if (!log.patientId || !log.medicineId) continue;
    await dispatchReminder({
      patient: log.patientId,
      medicine: log.medicineId,
      slot: log.slot,
      scheduledDate: log.scheduledDate,
      scheduledTime: log.scheduledTime,
      isSnooze: true,
    });
    processedCount++;
  }
  return processedCount;
}

/**
 * Main evaluation tick: checks MongoDB database every minute for upcoming doses
 * and pending snoozes.
 */
export async function runReminderCheck(now = new Date()) {
  // 1. First process any overdue snoozes
  await processSnoozeQueue(now);

  // 2. Query all active patients
  const patients = await User.find({ role: 'patient' }).lean();

  for (const patient of patients) {
    const timeZone = patient.timezone || 'Asia/Kolkata';
    const localTime = getLocalTimeParts(now, timeZone);

    // Fetch all active medicines for this patient
    const medicines = await Medicine.find({ patientId: patient._id }).lean();

    for (const med of medicines) {
      const dueCheck = isMedicineDueAtTime(med, localTime);
      if (dueCheck.isDue) {
        await dispatchReminder({
          patient,
          medicine: med,
          slot: dueCheck.matchedSlot,
          scheduledDate: localTime.dateStr,
          scheduledTime: dueCheck.timeLabel,
          isSnooze: false,
        });
      }
    }
  }
}

/**
 * Starts the node-cron scheduler running every minute ('* * * * *').
 */
export function startSmartReminderEngine() {
  console.log('[SmartReminderEngine] Initialized: Checking doses every minute across Morning (08:00), Afternoon (14:00), Night (20:00), and custom intervals.');
  
  cron.schedule('* * * * *', async () => {
    try {
      await runReminderCheck();
    } catch (err) {
      console.error('[SmartReminderEngine] Tick failed:', err.message);
    }
  });
}
