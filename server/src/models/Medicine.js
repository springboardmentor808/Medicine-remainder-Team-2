import mongoose from 'mongoose';

const conditionEnum = ['Blood Pressure', 'Diabetes', 'Thyroid', 'Antibiotics', 'Vitamins', 'Heart', 'Heart Medications', 'Other'];

const medicineSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  dose: { type: String, required: true, trim: true },
  schedule: { type: String, required: true, trim: true },
  slot: { type: String, enum: ['morning', 'afternoon', 'night'], required: true },
  status: { type: String, enum: ['taken', 'missed', 'snoozed', 'upcoming'], default: 'upcoming' },
  composition: { type: String, trim: true },
  uses: { type: String, trim: true },
  sideEffects: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  manufacturer: { type: String, trim: true },
  // Added per gap #2 - optional for now to preserve behaviour
  initialQuantity: { type: Number, min: 0 },
  quantityPerDose: { type: String, required: false, trim: true },
  formType: { type: String, enum: ['oral', 'topical', 'liquid', 'injection'], default: 'oral' },
  specialInstructions: { type: String, trim: true, maxlength: 500 },
  frequency: { type: String, trim: true },
  conditionTag: { type: String, enum: conditionEnum, trim: true },
  expiryDate: { type: Date },
}, { timestamps: true });

medicineSchema.index({ patientId: 1, conditionTag: 1 });
medicineSchema.index({ patientId: 1, createdAt: -1 });

const Medicine = mongoose.model('Medicine', medicineSchema);
export default Medicine;
export { conditionEnum };
