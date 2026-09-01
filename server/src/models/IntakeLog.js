import mongoose from 'mongoose';

const intakeLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
  scheduledFor: { type: Date, required: true },
  slot: { type: String, enum: ['morning', 'afternoon', 'night'], required: true },
  status: { type: String, enum: ['taken', 'missed', 'snoozed'], required: true },
  source: { type: String, enum: ['patient', 'auto'], default: 'patient' },
  istDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
}, { timestamps: true });

intakeLogSchema.index({ patientId: 1, scheduledFor: -1 });
intakeLogSchema.index({ medicineId: 1, scheduledFor: -1 });
intakeLogSchema.index({ patientId: 1, istDate: 1 });
intakeLogSchema.index({ patientId: 1, medicineId: 1, istDate: 1, slot: 1 }, { unique: true, sparse: false });

const IntakeLog = mongoose.model('IntakeLog', intakeLogSchema);
export default IntakeLog;
