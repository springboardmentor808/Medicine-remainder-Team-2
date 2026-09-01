import express from 'express';
import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import Notification from '../models/Notification.js';
import CaregiverLink from '../models/CaregiverLink.js';
import IntakeLog from '../models/IntakeLog.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { publicUser } from '../utils/tokens.js';
import { error } from '../utils/errors.js';
import { emitToCaregiver, emitToPatient } from '../socket.js';
import { deliverNotification } from '../utils/delivery.js';
import { toISTDateString, istDayRange, istDateNDaysAgo } from '../utils/time.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

function parseQty(str) {
  if (str == null) return 1;
  const n = parseFloat(String(str));
  return isNaN(n) || n <= 0 ? 1 : n;
}
async function getPatientRunway(patientId) {
  const meds = await Medicine.find({ patientId }).lean();
  let minDays = null;
  let lowStock = false;
  for (const med of meds) {
    const taken = await IntakeLog.countDocuments({ patientId, medicineId: med._id, status: 'taken' });
    const initialQty = typeof med.initialQuantity === 'number' ? med.initialQuantity : null;
    if (initialQty == null) continue;
    const doseQty = parseQty(med.quantityPerDose || med.dose);
    const remaining = Math.max(0, initialQty - taken * doseQty);
    const daysElapsed = Math.max(1, Math.ceil((Date.now() - new Date(med.createdAt)) / 86400000));
    const avgDaily = (taken * doseQty) / daysElapsed || doseQty;
    const daysLeft = avgDaily > 0 ? Math.ceil(remaining / avgDaily) : null;
    if (daysLeft != null) {
      if (minDays == null || daysLeft < minDays) minDays = daysLeft;
      if (daysLeft <= 5) lowStock = true;
    }
  }
  if (minDays == null) return { stock: 'Healthy', daysLeft: null, lowStock: false };
  if (lowStock) return { stock: `Refill needed — ${minDays} days left`, daysLeft: minDays, lowStock: true };
  return { stock: `${minDays} days remaining`, daysLeft: minDays, lowStock: false };
}

router.get('/dashboard', requireAuth, requireRole('caregiver'), async (req, res) => {
  const caregiver = await User.findById(req.auth.sub).lean();
  const patients = await User.find({ _id: { $in: caregiver.linkedPatients || [] } }).lean();
  const medicines = await Medicine.find({ patientId: { $in: patients.map((p) => p._id) } }).lean();
  const alerts = await Notification.find({ recipientId: req.auth.sub }).sort({ createdAt: -1 }).limit(30).lean();
  const links = await CaregiverLink.find({ caregiverId: req.auth.sub }).lean();
  const linkMap = Object.fromEntries(links.map(l => [l.patientId.toString(), l.accessLevel]));
  // per-patient adherence (weekly) + runway — IST window
  const patientExtras = await Promise.all(patients.map(async (patient) => {
    const startIST = istDateNDaysAgo(6);
    const { start: since } = istDayRange(startIST);
    const logs = await IntakeLog.find({ patientId: patient._id, createdAt: { $gte: since } }).lean();
    const taken = logs.filter(l=> l.status==='taken').length;
    const missed = logs.filter(l=> l.status==='missed').length;
    const adherence = (taken+missed)===0 ? 0 : Math.round(taken/(taken+missed)*100);
    const runway = await getPatientRunway(patient._id);
    return { id: patient._id.toString(), adherence, runway };
  }));
  const extraMap = Object.fromEntries(patientExtras.map(e => [e.id, e]));
  res.json({
    user: publicUser(caregiver),
    patients: patients.map((patient) => {
      const extra = extraMap[patient._id.toString()] || { adherence: 0, runway: { stock: 'Healthy', lowStock: false } };
      const runway = extra.runway;
      return {
        ...publicUser(patient),
        adherence: extra.adherence,
        nextDose: medicines.find((m) => m.patientId.toString() === patient._id.toString())?.schedule || 'No medicines yet',
        stock: runway.stock,
        daysLeft: runway.daysLeft,
        lowStock: runway.lowStock,
        accessLevel: linkMap[patient._id.toString()] || 'view',
      };
    }),
    alerts,
  });
});

router.post('/link', requireAuth, requireRole('caregiver'), async (req, res) => {
  const patient = await User.findOne({ linkCode: req.body.linkCode?.trim().toUpperCase(), role: 'patient' });
  if (!patient) return error(res, 404, 'That patient code was not found.');
  await User.findByIdAndUpdate(req.auth.sub, { $addToSet: { linkedPatients: patient._id } });
  await CaregiverLink.updateOne(
    { patientId: patient._id, caregiverId: req.auth.sub },
    { $setOnInsert: { accessLevel: 'view' } },
    { upsert: true }
  );
  res.json({ patient: publicUser(patient), message: `${patient.name} is now linked to your view.` });
});

// Patient Switcher detail (simple)
router.get('/patients/:patientId', requireAuth, requireRole('caregiver'), async (req, res) => {
  const link = await CaregiverLink.findOne({ patientId: req.params.patientId, caregiverId: req.auth.sub }).lean();
  if (!link && !(await User.findById(req.auth.sub).lean()).linkedPatients?.map(String).includes(req.params.patientId)) return error(res, 403, 'Not linked to this patient.');
  const patient = await User.findById(req.params.patientId).lean();
  if (!patient) return error(res, 404, 'Patient not found.');
  const medicines = await Medicine.find({ patientId: patient._id }).lean();
  const accessLevel = link?.accessLevel || 'view';
  res.json({ patient: publicUser(patient), medicines, accessLevel });
});

// Dedicated Patient Detail View — today's chronological timeline + emergencyContacts + runway inventory
router.get('/patients/:patientId/detail', requireAuth, requireRole('caregiver'), async (req, res) => {
  const link = await CaregiverLink.findOne({ patientId: req.params.patientId, caregiverId: req.auth.sub }).lean();
  const caregiver = await User.findById(req.auth.sub).lean();
  const isLinked = caregiver.linkedPatients?.map(String).includes(req.params.patientId) || !!link;
  if (!isLinked) return error(res, 403, 'Not linked to this patient.');
  const patient = await User.findById(req.params.patientId).lean();
  if (!patient) return error(res, 404, 'Patient not found.');
  const medicines = await Medicine.find({ patientId: patient._id }).sort({ slot: 1, schedule: 1 }).lean();
  // today's timeline: IST today window
  const todayIST = toISTDateString(new Date());
  const { start, end } = istDayRange(todayIST);
  const todayLogs = await IntakeLog.find({ patientId: patient._id, createdAt: { $gte: start, $lte: end } }).sort({ createdAt: 1 }).lean();
  const logMap = new Map(todayLogs.map(l => [l.medicineId.toString(), l]));
  const timeline = medicines.map(med => {
    const log = logMap.get(med._id.toString());
    const status = log ? log.status : med.status || 'upcoming';
    return {
      medicineId: med._id,
      name: med.name,
      dose: med.dose,
      quantityPerDose: med.quantityPerDose,
      formType: med.formType,
      schedule: med.schedule,
      slot: med.slot,
      status,
      logAt: log?.createdAt || null,
      specialInstructions: med.specialInstructions || '',
    };
  }).sort((a,b) => {
    const slotOrder = { morning: 0, afternoon: 1, night: 2 };
    return (slotOrder[a.slot] ?? 3) - (slotOrder[b.slot] ?? 3);
  });
  // runway per medicine
  const refillRows = await Promise.all(medicines.map(async (med) => {
    const taken = await IntakeLog.countDocuments({ patientId: patient._id, medicineId: med._id, status: 'taken' });
    const initialQty = typeof med.initialQuantity === 'number' ? med.initialQuantity : null;
    const doseQty = parseQty(med.quantityPerDose || med.dose);
    const remaining = initialQty != null ? Math.max(0, initialQty - taken * doseQty) : null;
    const daysElapsed = Math.max(1, Math.ceil((Date.now() - new Date(med.createdAt)) / 86400000));
    const avgDaily = (taken * doseQty) / daysElapsed || doseQty;
    const daysLeft = remaining != null && avgDaily > 0 ? Math.ceil(remaining / avgDaily) : null;
    const depletionDate = daysLeft != null ? new Date(Date.now() + daysLeft * 86400000) : null;
    return {
      _id: med._id, name: med.name, slot: med.slot, initialQuantity: initialQty,
      quantityPerDose: med.quantityPerDose, remaining, daysLeft, depletionDate,
      lowStock: daysLeft != null && daysLeft <= 5,
      runwayText: daysLeft == null ? 'No estimate' : daysLeft <= 5 ? `Refill needed by ${depletionDate.toLocaleDateString('en-GB', { weekday: 'long' })}` : `${daysLeft} days remaining`,
    };
  }));
  // adherence weekly — IST
  const weekStartIST = istDateNDaysAgo(6);
  const { start: since } = istDayRange(weekStartIST);
  const weekLogs = await IntakeLog.find({ patientId: patient._id, createdAt: { $gte: since } }).lean();
  const taken = weekLogs.filter(l=> l.status==='taken').length;
  const missed = weekLogs.filter(l=> l.status==='missed').length;
  const adherence = (taken+missed)===0 ? 0 : Math.round(taken/(taken+missed)*100);
  const accessLevel = link?.accessLevel || 'view';
  const hasOverdue = timeline.some(t => t.status === 'missed' || t.status === 'upcoming');
  res.json({
    patient: { ...publicUser(patient), emergencyContacts: patient.emergencyContacts || [], phone: patient.phone },
    medicines,
    timeline,
    refillRows,
    adherence,
    accessLevel,
    hasOverdue,
  });
});

// Nudge — Send Reminder to patient (caregiver only, linked only, rate-limited via middleware + durable Notification)
const nudgeLast = new Map();
router.post('/patients/:patientId/nudge', requireAuth, requireRole('caregiver'), rateLimit({ windowMs: 60000, max: 5, keyPrefix: 'nudge' }), async (req, res) => {
  const link = await CaregiverLink.findOne({ patientId: req.params.patientId, caregiverId: req.auth.sub }).lean();
  const caregiver = await User.findById(req.auth.sub).lean();
  const isLinked = caregiver.linkedPatients?.map(String).includes(req.params.patientId) || !!link;
  if (!isLinked) return error(res, 403, 'Not linked to this patient.');
  const key = `${req.auth.sub}:${req.params.patientId}`;
  const last = nudgeLast.get(key);
  if (last && Date.now() - last < 60000) return error(res, 429, 'Please wait a minute before nudging again.');
  nudgeLast.set(key, Date.now());
  const patient = await User.findById(req.params.patientId).lean();
  if (!patient) return error(res, 404, 'Patient not found.');
  const caregiverUser = await User.findById(req.auth.sub).lean();
  const patientNotif = await Notification.create({
    recipientId: patient._id, type: 'nudge', title: 'Caregiver reminder',
    message: `${caregiverUser.name} sent you a reminder to take your medicine.`,
  });
  await deliverNotification(patient, patientNotif);
  emitToPatient(patient._id, 'alert', patientNotif);
  emitToPatient(patient._id, 'nudge', patientNotif);
  const caregiverNotif = await Notification.create({
    recipientId: caregiverUser._id, type: 'nudge', title: 'Reminder sent',
    message: `You nudged ${patient.name}.`,
  });
  await deliverNotification(caregiverUser, caregiverNotif);
  emitToCaregiver(caregiverUser._id, 'alert', caregiverNotif);
  res.json({ ok: true, nudge: patientNotif });
});

// Alerts feed with filter chips: All/Missed/LowStock/medicine_added
router.get('/alerts', requireAuth, requireRole('caregiver'), async (req, res) => {
  const type = req.query.type;
  const filter = { recipientId: req.auth.sub };
  if (type && type !== 'All') {
    const map = { 'Missed Dose': 'missed_dose', Missed: 'missed_dose', LowStock: 'low_stock', 'Low Stock': 'low_stock', medicine_added: 'medicine_added' };
    filter.type = map[type] || type.toLowerCase();
  }
  const alerts = await Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  res.json(alerts);
});

// Reports weekly/monthly per linked patient
router.get('/reports', requireAuth, requireRole('caregiver'), async (req, res) => {
  const range = req.query.range === 'monthly' ? 'monthly' : 'weekly';
  const days = range === 'monthly' ? 30 : 7;
  const since = new Date(); since.setDate(since.getDate() - days);
  const caregiver = await User.findById(req.auth.sub).lean();
  const patients = await User.find({ _id: { $in: caregiver.linkedPatients || [] } }).lean();
  const reports = await Promise.all(patients.map(async (p) => {
    const logs = await IntakeLog.find({ patientId: p._id, createdAt: { $gte: since } }).lean();
    const taken = logs.filter(l=>l.status==='taken').length;
    const missed = logs.filter(l=>l.status==='missed').length;
    const adherence = (taken+missed)===0?0:Math.round(taken/(taken+missed)*100);
    return { patient: publicUser(p), taken, missed, adherence, range };
  }));
  res.json(reports);
});

// Revoke link
router.delete('/link/:patientId', requireAuth, requireRole('caregiver'), async (req, res) => {
  await User.findByIdAndUpdate(req.auth.sub, { $pull: { linkedPatients: req.params.patientId } });
  await CaregiverLink.deleteOne({ patientId: req.params.patientId, caregiverId: req.auth.sub });
  res.json({ ok: true });
});

export default router;
