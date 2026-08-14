const mongoose = require('mongoose');

const MedicationLogSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true
    },
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
      required: [true, 'Medication reference is required']
    },
    scheduledTime: {
      type: String, // 'HH:MM'
      required: [true, 'Scheduled time is required']
    },
    takenTime: {
      type: Date // Date and time when the medication was actually taken
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Taken', 'Missed', 'Skipped'],
      default: 'Pending'
    },
    date: {
      type: Date, // Represents the specific day, set to 00:00:00.000 (midnight UTC/local)
      required: [true, 'Log date is required'],
      index: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to guarantee a unique log entry per medication, date, and scheduled time slot
MedicationLogSchema.index({ medicationId: 1, date: 1, scheduledTime: 1 }, { unique: true });

module.exports = mongoose.model('MedicationLog', MedicationLogSchema);
