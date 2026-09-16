import cron from 'node-cron';
import Medicine from '../models/Medicine.js';
import IntakeLog from '../models/IntakeLog.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { deliverNotification } from '../utils/delivery.js';
import { emitToCaregiver } from '../socket.js';

function parseQty(str) {
  const n = parseFloat(String(str ?? '1'));
  return isNaN(n) || n <= 0 ? 1 : n;
}

export async function runRefillOnce() {
  const patients = await User.find({ role: 'patient' }).select('_id name').lean();
  for (const patient of patients) {
    const meds = await Medicine.find({ patientId: patient._id, initialQuantity: { $type: 'number' } }).lean();
    for (const med of meds) {
      const takenLogs = await IntakeLog.countDocuments({ patientId: patient._id, medicineId: med._id, status: 'taken' });
      const doseQty = parseQty(med.quantityPerDose || med.dose);
      const remaining = Math.max(0, med.initialQuantity - takenLogs * doseQty);
      const daysElapsed = Math.max(1, Math.ceil((Date.now() - new Date(med.createdAt)) / 86400000));
      const avgDaily = (takenLogs * doseQty) / daysElapsed || doseQty;
      const daysLeft = avgDaily > 0 ? Math.ceil(remaining / avgDaily) : null;
      if (daysLeft != null && daysLeft <= 5) {
        const caregivers = await User.find({ linkedPatients: patient._id, role: 'caregiver' }).lean();
        for (const cg of caregivers) {
          const exists = await Notification.findOne({
            recipientId: cg._id, type: 'low_stock',
            message: { $regex: med.name }, createdAt: { $gte: new Date(Date.now() - 24*3600000) }
          });
          if (exists) continue;
          const notif = await Notification.create({
            recipientId: cg._id, type: 'low_stock', title: 'Low stock alert',
            message: `${patient.name}'s ${med.name} is expected to finish in ${daysLeft} days. Please arrange a refill.`
          });
          await deliverNotification(cg, notif);
          emitToCaregiver(cg._id, 'alert', notif);
          // also for patient
          const pNotif = await Notification.create({
            recipientId: patient._id, type: 'low_stock', title: 'Low stock',
            message: `Your ${med.name} is expected to finish in ${daysLeft} days. Please arrange a refill.`
          });
          await deliverNotification(patient, pNotif);
        }
      }
    }
  }
}

export function startRefillCron() {
  // daily at 02:00 server time (0 2 * * *)
  cron.schedule('0 2 * * *', async () => {
    try { await runRefillOnce(); console.log('Refill job completed'); } catch (e) { console.error('Refill job failed', e.message); }
  });
}
