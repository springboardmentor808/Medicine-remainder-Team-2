const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true
    },
    medicineName: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true
    },
    dosage: {
      type: String,
      required: [true, 'Dosage description is required'],
      trim: true
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      enum: {
        values: ['daily', 'alternate_days', 'specific_days', 'weekly'],
        message: '{VALUE} is not a valid frequency option'
      }
    },
    // For alternate_days or weekly or specific_days:
    // If specific_days: list of weekdays like [0, 2, 4] (Sunday is 0, etc.)
    // If weekly: day of the week, e.g. [1] (Monday)
    specificDays: {
      type: [Number],
      default: []
    },
    timesPerDay: {
      type: Number,
      required: true,
      default: 1
    },
    scheduledTimes: {
      type: [String], // Array of 'HH:MM' times, e.g. ['08:00', '20:00']
      required: [true, 'At least one scheduled time is required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A medication must have at least one scheduled time.'
      }
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    instructions: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate medicines for the same patient
MedicationSchema.index({ patientId: 1, medicineName: 1 }, { unique: true });

module.exports = mongoose.model('Medication', MedicationSchema);
