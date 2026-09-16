import mongoose from 'mongoose';

const reminderLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
  doseKey: { type: String, required: true, index: true }, // e.g. medicineId_YYYY-MM-DD_slot
  scheduledDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // user-local date
  slot: { type: String, required: true }, // 'morning' | 'afternoon' | 'night' | '08:00' | interval label
  scheduledTime: { type: String, required: true }, // e.g. '08:00'
  timezone: { type: String, default: 'Asia/Kolkata' },
  status: {
    type: String,
    enum: ['scheduled', 'alerted', 'snoozed', 'taken', 'missed'],
    default: 'scheduled',
    index: true,
  },
  alertedAt: { type: Date },
  snoozedUntil: { type: Date, index: true },
  snoozeCount: { type: Number, default: 0 },
  channels: [{ type: String, enum: ['sms', 'email', 'fcm', 'in_app'] }],
  deliveryMeta: {
    smsMessageId: { type: String },
    emailMessageId: { type: String },
    fcmMessageId: { type: String },
    lastError: { type: String },
  },
}, { timestamps: true });

// Compound unique index for absolute dose idempotency per scheduled slot per day
reminderLogSchema.index({ patientId: 1, medicineId: 1, scheduledDate: 1, slot: 1 }, { unique: true });

const ReminderLog = mongoose.model('ReminderLog', reminderLogSchema);
export default ReminderLog;
