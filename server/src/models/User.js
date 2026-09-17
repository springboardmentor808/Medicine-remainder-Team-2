import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true, maxlength: 20 },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['patient', 'caregiver'], required: true },
  linkCode: { type: String, unique: true, sparse: true },
  linkedPatients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  conditions: [{ type: String, trim: true }],
  age: { type: Number, min: 0, max: 130 },
  gender: { type: String, trim: true, maxlength: 30 },
  emergencyContacts: [{
    name: { type: String, trim: true, maxlength: 80 },
    phone: { type: String, trim: true, maxlength: 20 },
    relation: { type: String, trim: true, maxlength: 40 },
  }],
  profileImage: { type: Buffer },
  profileImageMimeType: { type: String, trim: true },
  profileImageFilename: { type: String, trim: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
