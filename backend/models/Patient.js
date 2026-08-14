const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true
    },
    age: {
      type: Number,
      required: [true, 'Age is required']
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other']
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood Group is required']
    },
    height: {
      type: Number, // In cm
      required: [true, 'Height is required']
    },
    weight: {
      type: Number, // In kg
      required: [true, 'Weight is required']
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    emergencyContact: {
      type: String,
      required: [true, 'Emergency contact is required'],
      trim: true
    },
    doctorName: {
      type: String,
      required: [true, 'Assigned Doctor name is required'],
      trim: true
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    allergies: {
      type: [String],
      default: []
    },
    chronicDisease: {
      type: String,
      default: 'None',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Patient', PatientSchema);
