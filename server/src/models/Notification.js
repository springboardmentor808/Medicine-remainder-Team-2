import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['medicine_added', 'missed_dose', 'low_stock', 'nudge', 'system'], required: true },
  title: { type: String, required: true, maxlength: 120 },
  message: { type: String, required: true, maxlength: 500 },
  channels: [{ type: String, enum: ['in_app', 'email', 'sms'] }],
  delivery: { type: String, enum: ['queued', 'sent', 'partial'], default: 'queued' },
  createdAt: { type: Date, default: Date.now, index: true },
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
