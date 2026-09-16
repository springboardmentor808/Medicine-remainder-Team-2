import express from 'express';
import ReminderLog from '../models/ReminderLog.js';
import Medicine from '../models/Medicine.js';
import IntakeLog from '../models/IntakeLog.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { error } from '../utils/errors.js';
import { toISTDateString } from '../utils/time.js';
import { runReminderCheck, dispatchReminder } from '../jobs/smartReminderEngine.js';
import { sendTwilioSMS, sendSendGridEmail, sendFCMNotification } from '../services/dispatchService.js';

const router = express.Router();

/**
 * POST /api/reminders/trigger-check
 * Manually trigger the scheduler check (useful for instant testing and automated tests).
 */
router.post('/trigger-check', async (req, res) => {
  try {
    const timestamp = req.body.timestamp ? new Date(req.body.timestamp) : new Date();
    await runReminderCheck(timestamp);
    res.json({ ok: true, message: 'Smart Reminder Engine check executed', timestamp });
  } catch (e) {
    console.error('Trigger check error:', e);
    return error(res, 500, e.message);
  }
});

/**
 * POST /api/reminders/snooze
 * Snooze an upcoming or alerted dose by X minutes.
 * Ensures user is not alerted again until the snooze window has elapsed.
 */
router.post('/snooze', requireAuth, requireRole('patient'), async (req, res) => {
  const { medicineId, slot, snoozeMinutes = 30 } = req.body;
  const minutes = Math.min(240, Math.max(1, parseInt(snoozeMinutes, 10) || 30));

  if (!medicineId) {
    return error(res, 400, 'Medicine ID is required to snooze.');
  }

  const medicine = await Medicine.findOne({ _id: medicineId, patientId: req.auth.sub });
  if (!medicine) {
    return error(res, 404, 'Medicine not found.');
  }

  const todayStr = toISTDateString(new Date());
  const targetSlot = slot || medicine.slot || 'morning';
  const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);

  // Update or create ReminderLog
  const doseKey = `${medicine._id}_${todayStr}_${targetSlot}`;
  const log = await ReminderLog.findOneAndUpdate(
    { patientId: req.auth.sub, medicineId: medicine._id, scheduledDate: todayStr, slot: targetSlot },
    {
      $set: {
        doseKey,
        status: 'snoozed',
        snoozedUntil,
        scheduledTime: medicine.schedule || '08:00',
      },
      $inc: { snoozeCount: 1 },
    },
    { upsert: true, new: true }
  );

  // Also update Medicine model status for UI reflection
  medicine.status = 'snoozed';
  await medicine.save();

  res.json({
    ok: true,
    message: `Reminder for ${medicine.name} snoozed for ${minutes} minutes.`,
    snoozedUntil,
    log,
  });
});

/**
 * POST /api/reminders/sms-reply
 * Twilio Inbound SMS Webhook handler.
 * When a patient replies 'YES' or 'TAKEN' to the SMS:
 * 'Hi [Name], time to take 1 tablet of [Medicine] ([Dose]). Reply YES when taken.'
 */
router.post('/sms-reply', async (req, res) => {
  const body = (req.body.Body || req.body.body || '').trim();
  const from = (req.body.From || req.body.from || '').trim();

  console.log(`[Twilio Inbound SMS] Received reply from ${from}: "${body}"`);

  if (!from) {
    return res.status(400).send('<Response><Message>Missing sender number.</Message></Response>');
  }

  // Check if body is affirmative ('YES', 'TAKEN', 'Y')
  if (/^(yes|taken|y)$/i.test(body)) {
    // Find patient by phone
    // Handle optional leading +
    const phoneClean = from.replace(/\D/g, '');
    const user = await User.findOne({
      $or: [
        { phone: from },
        { phone: `+${phoneClean}` },
        { phone: { $regex: phoneClean.slice(-10) + '$' } },
      ],
      role: 'patient',
    });

    if (user) {
      // Find latest alerted or snoozed reminder log for today
      const todayStr = toISTDateString(new Date());
      const latestLog = await ReminderLog.findOne({
        patientId: user._id,
        scheduledDate: todayStr,
        status: { $in: ['alerted', 'snoozed', 'scheduled'] },
      }).sort({ updatedAt: -1 }).populate('medicineId');

      if (latestLog && latestLog.medicineId) {
        latestLog.status = 'taken';
        latestLog.snoozedUntil = null;
        await latestLog.save();

        // Update medicine status
        await Medicine.findByIdAndUpdate(latestLog.medicineId._id, { status: 'taken' });

        // Record in IntakeLog
        try {
          await IntakeLog.create({
            patientId: user._id,
            medicineId: latestLog.medicineId._id,
            scheduledFor: new Date(),
            slot: latestLog.slot,
            status: 'taken',
            source: 'patient',
            istDate: todayStr,
          });
        } catch (intakeErr) {
          // Ignore duplicate if already recorded
        }

        const replyMsg = `Great job, ${user.name}! Your dose of ${latestLog.medicineId.name} has been marked as TAKEN ✓.`;
        res.type('text/xml');
        return res.send(`<Response><Message>${replyMsg}</Message></Response>`);
      }
    }
  }

  res.type('text/xml');
  res.send('<Response><Message>Thank you! Your response has been received by PillSync.</Message></Response>');
});

/**
 * GET /api/reminders/logs
 * Retrieve recent dose reminder logs for the authenticated patient.
 */
router.get('/logs', requireAuth, async (req, res) => {
  const patientId = req.auth.role === 'caregiver' && req.query.patientId
    ? req.query.patientId
    : req.auth.sub;

  const logs = await ReminderLog.find({ patientId })
    .populate('medicineId', 'name dose slot schedule')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json(logs);
});

/**
 * POST /api/reminders/test-dispatch
 * Test multi-channel dispatch with arbitrary parameters.
 */
router.post('/test-dispatch', requireAuth, async (req, res) => {
  const { channel = 'sms', phone, email, fcmToken, medicineName = 'Metformin', dose = '500mg' } = req.body;
  const patientName = req.body.patientName || 'Patient';

  let result;
  if (channel === 'sms') {
    result = await sendTwilioSMS({ to: phone || '+1234567890', patientName, medicineName, dose });
  } else if (channel === 'email') {
    result = await sendSendGridEmail({ to: email || 'test@example.com', patientName, medicineName, dose, schedule: '08:00 AM', timeBlock: 'morning' });
  } else if (channel === 'fcm') {
    result = await sendFCMNotification({ token: fcmToken || 'dummy_token', patientName, medicineName, dose, slot: 'morning' });
  } else {
    return error(res, 400, 'Invalid channel. Choose sms, email, or fcm.');
  }

  res.json({ ok: true, result });
});

export default router;
