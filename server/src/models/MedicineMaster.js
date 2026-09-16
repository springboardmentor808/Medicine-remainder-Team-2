import mongoose from 'mongoose';

const medicineMasterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  normalizedName: { type: String, required: true, trim: true, lowercase: true },
  composition: { type: String, trim: true },
  uses: { type: String, trim: true },
  sideEffects: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  manufacturer: { type: String, trim: true },
  reviewStats: {
    excellentPercent: Number,
    averagePercent: Number,
    poorPercent: Number,
  },
  source: { type: String, default: 'csv-import' },
  importedAt: { type: Date, default: Date.now },
}, { timestamps: false });

// Index for fast prefix/contains lookup (planning 17A)
medicineMasterSchema.index({ normalizedName: 1 });
// Text index for broader keyword search
medicineMasterSchema.index({ name: 'text', composition: 'text' });

const MedicineMaster = mongoose.model('MedicineMaster', medicineMasterSchema);
export default MedicineMaster;
