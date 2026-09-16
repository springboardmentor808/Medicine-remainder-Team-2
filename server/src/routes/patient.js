import express from 'express';
import fs from 'node:fs';
import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import MedicineMaster from '../models/MedicineMaster.js';
import Notification from '../models/Notification.js';
import IntakeLog from '../models/IntakeLog.js';
import CaregiverLink from '../models/CaregiverLink.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ocrUpload } from '../middleware/upload.js';
import { publicUser } from '../utils/tokens.js';
import { error } from '../utils/errors.js';
import { deliverNotification } from '../utils/delivery.js';
import { ocrServiceUrl, ocrInternalToken } from '../config/env.js';
import { emitToCaregiver } from '../socket.js';
import { toISTDateString, istDayRange, istDateNDaysAgo } from '../utils/time.js';
import { validate, medicineCreateSchema, medicineUpdateSchema, refillSchema, profileUpdateSchema, statusPatchSchema } from '../middleware/validate.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Helper: calculate adherence + streak from IntakeLogs — IST-aware
async function getAdherenceStats(patientId, range = 'weekly') {
  const days = range === 'monthly' ? 30 : 7;
  const startIST = istDateNDaysAgo(days - 1);
  const { start: since } = istDayRange(startIST);
  const logs = await IntakeLog.find({ patientId, createdAt: { $gte: since } }).lean();
  const taken = logs.filter(l => l.status === 'taken').length;
  const missed = logs.filter(l => l.status === 'missed').length;
  const total = taken + missed;
  const adherence = total === 0 ? 0 : Math.round((taken / total) * 100);
  // streak: consecutive IST days with at least one taken and no missed, counting backwards from today IST
  let streak = 0;
  const byDay = {};
  logs.forEach(l => {
    const d = l.istDate || toISTDateString(l.createdAt);
    if (!byDay[d]) byDay[d] = { taken: 0, missed: 0 };
    if (l.status === 'taken') byDay[d].taken++;
    if (l.status === 'missed') byDay[d].missed++;
  });
  for (let i = 0; i < 30; i++) {
    const key = istDateNDaysAgo(i);
    const day = byDay[key];
    if (day && day.taken > 0 && day.missed === 0) streak++;
    else if (i === 0 && !day) continue;
    else break;
  }
  return { adherence, streak, taken, missed, total };
}

// Dashboard
router.get('/dashboard', requireAuth, requireRole('patient'), async (req, res) => {
  const medicines = await Medicine.find({ patientId: req.auth.sub }).sort({ slot: 1, createdAt: -1 }).lean();
  const user = await User.findById(req.auth.sub).lean();
  const stats = await getAdherenceStats(req.auth.sub, 'weekly');
  const takenToday = medicines.filter((m) => m.status === 'taken').length;
  res.json({
    user: publicUser(user),
    summary: {
      adherence: stats.adherence,
      takenToday,
      dueToday: medicines.length || 3,
      streak: stats.streak,
    },
    medicines,
  });
});

// GET /api/patient/adherence?range=weekly|monthly -> taken/(taken+missed) + streak + daily buckets (IST)
router.get('/adherence', requireAuth, requireRole('patient'), async (req, res) => {
  const range = req.query.range === 'monthly' ? 'monthly' : 'weekly';
  const days = range === 'monthly' ? 30 : 7;
  const startIST = istDateNDaysAgo(days - 1);
  const { start: since } = istDayRange(startIST);
  const logs = await IntakeLog.find({ patientId: req.auth.sub, createdAt: { $gte: since } }).sort({ createdAt: 1 }).lean();
  const taken = logs.filter(l => l.status === 'taken').length;
  const missed = logs.filter(l => l.status === 'missed').length;
  const total = taken + missed;
  const adherence = total === 0 ? 0 : Math.round((taken / total) * 100);
  let streak = 0;
  const byDay = {};
  logs.forEach(l => {
    const d = l.istDate || toISTDateString(l.createdAt);
    if (!byDay[d]) byDay[d] = { taken: 0, missed: 0, snoozed: 0 };
    byDay[d][l.status] = (byDay[d][l.status] || 0) + 1;
  });
  for (let i = 0; i < 30; i++) {
    const key = istDateNDaysAgo(i);
    const day = byDay[key];
    if (day && day.taken > 0 && !day.missed) streak++;
    else if (i === 0 && !day) continue;
    else break;
  }
  const daily = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = istDateNDaysAgo(i);
    const day = byDay[key] || { taken: 0, missed: 0, snoozed: 0 };
    daily.push({ date: key, ...day });
  }
  res.json({ range, adherence, streak, taken, missed, total, daily });
});

// GET /api/patient/history?date=YYYY-MM-DD (IST)
router.get('/history', requireAuth, requireRole('patient'), async (req, res) => {
  const dateStr = req.query.date;
  if (dateStr && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return error(res, 400, 'Invalid date format. Use YYYY-MM-DD.');
  }
  let start, end;
  if (dateStr) {
    const r = istDayRange(dateStr);
    start = r.start; end = r.end;
  } else {
    const startIST = istDateNDaysAgo(30);
    start = istDayRange(startIST).start;
    end = new Date();
  }
  const logs = await IntakeLog.find({ patientId: req.auth.sub, createdAt: { $gte: start, $lte: end } })
    .populate('medicineId', 'name dose slot').sort({ createdAt: -1 }).lean();
  res.json(logs);
});

// Search MedicineMaster — anchored only, uses text index for performance
router.get('/medicines/search', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const raw = req.query.q?.trim();
    if (!raw) return res.json([]);
    if (raw.length > 80) return error(res, 400, 'Search query too long.');
    const escaped = raw.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const results = await MedicineMaster.find({ normalizedName: { $regex: '^' + escaped } }).limit(10).lean().maxTimeMS(800);
    res.json(results.map((r) => ({
      name: r.name,
      composition: r.composition,
      uses: r.uses,
      sideEffects: r.sideEffects,
      imageUrl: r.imageUrl,
      manufacturer: r.manufacturer,
    })));
  } catch (e) {
    console.error(e);
    return error(res, 500, 'Search failed.');
  }
});

// List medicines (future-proof for My Medicines page)
router.get('/medicines', requireAuth, requireRole('patient'), async (req, res) => {
  const medicines = await Medicine.find({ patientId: req.auth.sub }).sort({ createdAt: -1 }).lean();
  res.json(medicines);
});

router.post('/medicines', requireAuth, requireRole('patient'), validate(medicineCreateSchema), async (req, res) => {
  const { name, dose, schedule, slot, composition, uses, sideEffects, imageUrl, manufacturer,
          initialQuantity, quantityPerDose, formType, specialInstructions, frequency, conditionTag, expiryDate } = req.body;
  if (!name || !dose || !schedule || !['morning', 'afternoon', 'night'].includes(slot))
    return error(res, 400, 'Please provide the medicine name, dose, time, and slot.');
  if (formType && !['oral', 'topical', 'liquid', 'injection'].includes(formType))
    return error(res, 400, 'Form type must be oral, topical, liquid, or injection.');
  const medicine = await Medicine.create({
    patientId: req.auth.sub, name, dose, schedule, slot, composition, uses, sideEffects, imageUrl, manufacturer,
    initialQuantity, quantityPerDose, formType, specialInstructions, frequency, conditionTag, expiryDate,
  });
  const patient = await User.findById(req.auth.sub).lean();
  const caregivers = await User.find({ linkedPatients: req.auth.sub, role: 'caregiver' }).lean();
  await Promise.all(caregivers.map(async (caregiver) => {
    const notification = await Notification.create({
      recipientId: caregiver._id, type: 'medicine_added', title: 'New medicine added',
      message: `${patient.name} added ${medicine.name} to their medicine routine.`,
    });
    await deliverNotification(caregiver, notification);
    emitToCaregiver(caregiver._id, 'alert', notification);
  }));
  res.status(201).json({ medicine });
});

router.patch('/medicines/:id/status', requireAuth, requireRole('patient'), validate(statusPatchSchema), async (req, res) => {
  const { status, snoozeMinutes } = req.body;
  if (!['taken', 'missed', 'snoozed', 'upcoming'].includes(status))
    return error(res, 400, 'Choose Taken, Missed, Snooze, or Upcoming.');
  if (snoozeMinutes != null) {
    const n = Number(snoozeMinutes);
    if (!Number.isInteger(n) || n < 1 || n > 240) return error(res, 400, 'Snooze must be 1-240 minutes.');
  }
  const medicine = await Medicine.findOneAndUpdate({ _id: req.params.id, patientId: req.auth.sub }, { status }, { new: true });
  if (!medicine) return error(res, 404, 'That medicine could not be found.');
  if (['taken', 'missed', 'snoozed'].includes(status)) {
    const istDate = toISTDateString(new Date());
    try {
      await IntakeLog.create({
        patientId: req.auth.sub,
        medicineId: medicine._id,
        scheduledFor: new Date(),
        slot: medicine.slot,
        status,
        source: 'patient',
        istDate,
      });
    } catch (e) {
      if (e.code === 11000) {
        return error(res, 409, 'Already logged for this medicine today. Please try next slot.');
      }
      throw e;
    }
  }
  // snooze does not alert caregiver, only missed does per planning 31
  if (status === 'missed') {
    const patient = await User.findById(req.auth.sub).lean();
    const caregivers = await User.find({ linkedPatients: req.auth.sub, role: 'caregiver' }).lean();
    await Promise.all(caregivers.map(async (caregiver) => {
      const notification = await Notification.create({
        recipientId: caregiver._id, type: 'missed_dose', title: 'A dose was missed',
        message: `A dose of ${medicine.name} was missed by ${patient.name}.`,
      });
      await deliverNotification(caregiver, notification);
      emitToCaregiver(caregiver._id, 'alert', notification);
    }));
  }
  // optional snooze reschedule hint for client
  const snoozeUntil = status === 'snoozed' && snoozeMinutes ? new Date(Date.now() + Number(snoozeMinutes) * 60000) : null;
  res.json({ medicine, snoozeUntil });
});

// Helper: frequency -> slot proposal (planning 29)
export function proposeSlots(frequency) {
  if (!frequency || typeof frequency !== 'string') return [];
  const f = frequency.toLowerCase().trim();
  if (/once|1\s*(time|x)|qd|od|daily.*once/.test(f) && !/twice|two|bd|bid|three|tds|tid/.test(f)) return ['morning'];
  if (/twice|2\s*(time|x)|bd|bid|two.*day/.test(f)) return ['morning', 'night'];
  if (/three|3\s*(time|x)|tds|tid|thrice/.test(f)) return ['morning', 'afternoon', 'night'];
  return [];
}
router.post('/schedule/preview', requireAuth, requireRole('patient'), (req, res) => {
  const { frequency } = req.body;
  if (!frequency) return error(res, 400, 'Frequency is required.');
  const proposed = proposeSlots(frequency);
  res.json({ frequency, proposed, needsManual: proposed.length === 0 });
});

router.post('/ocr', requireAuth, requireRole('patient'), rateLimit({ windowMs: 60000, max: 10, keyPrefix: 'ocr' }), ocrUpload.single('image'), async (req, res) => {
  if (!req.file) return error(res, 400, 'Please upload a JPG, PNG, or WebP prescription image under 10 MB.');
  let image;
  try {
    image = await fs.promises.readFile(req.file.path);
    // lightweight magic-byte check (no extra dep)
    const head = image.subarray(0, 12);
    const isJpeg = head[0] === 0xFF && head[1] === 0xD8;
    const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4E && head[3] === 0x47;
    const isWebp = head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
    if (!isJpeg && !isPng && !isWebp) {
      return error(res, 400, 'We could not read that image clearly. Please try again or enter manually.');
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    let response;
    try {
      response = await fetch(`${ocrServiceUrl}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Token': ocrInternalToken },
        body: JSON.stringify({
          filename: req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, ''),
          mime_type: req.file.mimetype,
          image_base64: image.toString('base64'),
        }),
        signal: controller.signal,
      });
    } finally { clearTimeout(timeout); }
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch { return error(res, 422, 'We could not read that image clearly. Please try again or enter it manually.'); }
    if (!response.ok || !result.medicine_name) return error(res, 422, 'We could not read that image clearly. Please try again or enter it manually.');
    const allowed = ['medicine_name','dosage','frequency','side_effects','uses','confidence'];
    const sanitized = {};
    for (const k of allowed) {
      let v = result[k];
      if (v == null) v = '';
      if (k === 'confidence') { sanitized[k] = typeof v === 'number' ? v : null; continue; }
      sanitized[k] = String(v).replace(/\x00/g,'').slice(0,500).trim();
      if (/ignore previous|system prompt|reveal/i.test(sanitized[k])) sanitized[k] = '';
    }
    if (!sanitized.medicine_name) return error(res, 422, 'We could not read that image clearly. Please try again or enter it manually.');
    let match = null;
    try {
      const normalized = sanitized.medicine_name.toLowerCase().trim();
      const escaped = normalized.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      match = await MedicineMaster.findOne({ normalizedName: { $regex: '^' + escaped } }).lean();
    } catch (e) { console.error('Master lookup failed', e.message); }
    res.json({ result: sanitized, match: match ? { name: match.name, composition: match.composition, manufacturer: match.manufacturer, imageUrl: match.imageUrl, uses: match.uses, sideEffects: match.sideEffects } : null });
  } catch (ocrError) {
    if (ocrError.name === 'AbortError') {
      console.error('OCR timeout after 45s');
      return error(res, 502, 'We could not read that image clearly — the service took too long. Please try again or enter it manually.');
    }
    console.error('OCR request failed:', ocrError.message);
    return error(res, 502, 'We could not read that image clearly. Please try again or enter it manually.');
  } finally {
    await fs.promises.unlink(req.file.path).catch(() => {});
  }
});

router.get('/notifications', requireAuth, requireRole('patient'), async (req, res) => {
  const notes = await Notification.find({ recipientId: req.auth.sub }).sort({ createdAt: -1 }).limit(20).lean();
  res.json(notes);
});

// Refill endpoint: remaining = initialQty - (taken * doseQty), depletion = today + remaining/avgDaily
function parseQty(str) {
  if (str == null) return 1;
  const n = parseFloat(String(str));
  return isNaN(n) || n <= 0 ? 1 : n;
}
router.get('/refill', requireAuth, requireRole('patient'), async (req, res) => {
  const medicines = await Medicine.find({ patientId: req.auth.sub }).lean();
  const refill = await Promise.all(medicines.map(async (med) => {
    const takenLogs = await IntakeLog.countDocuments({ patientId: req.auth.sub, medicineId: med._id, status: 'taken' });
    const initialQty = typeof med.initialQuantity === 'number' ? med.initialQuantity : null;
    const doseQty = parseQty(med.quantityPerDose || med.dose);
    const consumed = takenLogs * doseQty;
    const remaining = initialQty != null ? Math.max(0, initialQty - consumed) : null;
    const daysElapsed = Math.max(1, Math.ceil((Date.now() - new Date(med.createdAt)) / 86400000));
    const avgDaily = consumed / daysElapsed || doseQty;
    const daysLeft = remaining != null && avgDaily > 0 ? Math.ceil(remaining / avgDaily) : null;
    const depletionDate = daysLeft != null ? new Date(Date.now() + daysLeft * 86400000) : null;
    const lowStock = daysLeft != null && daysLeft <= 5;
    return {
      _id: med._id, name: med.name, slot: med.slot, initialQuantity: initialQty, quantityPerDose: med.quantityPerDose,
      takenLogs, consumed, remaining, avgDaily: Number(avgDaily.toFixed(2)), daysLeft, depletionDate, lowStock,
    };
  }));
  res.json(refill);
});

// Update medicine details
router.put('/medicines/:id', requireAuth, requireRole('patient'), validate(medicineUpdateSchema), async (req, res) => {
  const medicine = await Medicine.findOneAndUpdate(
    { _id: req.params.id, patientId: req.auth.sub },
    { $set: req.body },
    { new: true }
  );
  if (!medicine) return error(res, 404, 'That medicine could not be found.');
  res.json({ medicine });
});

// Delete medicine
router.delete('/medicines/:id', requireAuth, requireRole('patient'), async (req, res) => {
  const medicine = await Medicine.findOneAndDelete({ _id: req.params.id, patientId: req.auth.sub });
  if (!medicine) return error(res, 404, 'That medicine could not be found.');
  await IntakeLog.deleteMany({ patientId: req.auth.sub, medicineId: req.params.id }).catch(() => {});
  res.json({ ok: true, message: `${medicine.name} was removed from your routine.` });
});

// Refill / restock medicine units
router.post('/medicines/:id/refill', requireAuth, requireRole('patient'), validate(refillSchema), async (req, res) => {
  const medicine = await Medicine.findOne({ _id: req.params.id, patientId: req.auth.sub });
  if (!medicine) return error(res, 404, 'That medicine could not be found.');
  const addedQty = Number(req.body.quantity);
  const currentBase = typeof medicine.initialQuantity === 'number' ? medicine.initialQuantity : 0;
  medicine.initialQuantity = currentBase + addedQty;
  await medicine.save();

  const patient = await User.findById(req.auth.sub).lean();
  const caregivers = await User.find({ linkedPatients: req.auth.sub, role: 'caregiver' }).lean();
  await Promise.all(caregivers.map(async (caregiver) => {
    const notification = await Notification.create({
      recipientId: caregiver._id,
      type: 'refill_added',
      title: 'Medicine restocked',
      message: `${patient.name} restocked ${addedQty} units of ${medicine.name}.`,
    });
    await deliverNotification(caregiver, notification);
    emitToCaregiver(caregiver._id, 'alert', notification);
  }));

  res.json({ ok: true, medicine, added: addedQty, message: `Added ${addedQty} units to ${medicine.name}.` });
});

// Get linked caregivers for this patient
router.get('/caregivers', requireAuth, requireRole('patient'), async (req, res) => {
  const links = await CaregiverLink.find({ patientId: req.auth.sub }).lean();
  const caregiverIds = links.map(l => l.caregiverId);
  const caregivers = await User.find({ _id: { $in: caregiverIds } }).lean();
  const linkMap = new Map(links.map(l => [l.caregiverId.toString(), l]));

  const result = caregivers.map(c => {
    const link = linkMap.get(c._id.toString());
    return {
      _id: c._id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      accessLevel: link?.accessLevel || 'view',
      linkedAt: link?.createdAt || c.createdAt,
    };
  });
  res.json(result);
});

// Revoke caregiver access from patient side
router.delete('/caregivers/:caregiverId', requireAuth, requireRole('patient'), async (req, res) => {
  await CaregiverLink.deleteOne({ patientId: req.auth.sub, caregiverId: req.params.caregiverId });
  await User.findByIdAndUpdate(req.params.caregiverId, { $pull: { linkedPatients: req.auth.sub } });
  
  const patient = await User.findById(req.auth.sub).lean();
  const notification = await Notification.create({
    recipientId: req.params.caregiverId,
    type: 'link_revoked',
    title: 'Access revoked',
    message: `${patient.name} revoked caregiver access.`,
  });
  emitToCaregiver(req.params.caregiverId, 'alert', notification);

  res.json({ ok: true, message: 'Caregiver access revoked.' });
});

// Update patient profile (conditions, emergencyContacts, age, gender)
router.put('/profile', requireAuth, requireRole('patient'), validate(profileUpdateSchema), async (req, res) => {
  const updated = await User.findByIdAndUpdate(
    req.auth.sub,
    { $set: req.body },
    { new: true, runValidators: true }
  ).lean();
  if (!updated) return error(res, 404, 'User not found.');
  res.json({ ok: true, user: publicUser(updated) });
});

export default router;
