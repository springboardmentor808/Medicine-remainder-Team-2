import mongoose from 'mongoose';

const caregiverLinkSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  caregiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  accessLevel: { type: String, enum: ['view', 'manage'], default: 'view' },
}, { timestamps: true });

caregiverLinkSchema.index({ patientId: 1, caregiverId: 1 }, { unique: true });

const CaregiverLink = mongoose.model('CaregiverLink', caregiverLinkSchema);
export default CaregiverLink;
