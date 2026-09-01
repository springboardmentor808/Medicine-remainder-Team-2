import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { clientOrigin } from './config/env.js';
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patient.js';
import caregiverRoutes from './routes/caregiver.js';
import User from './models/User.js';
import CaregiverLink from './models/CaregiverLink.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import { profileUpload } from './middleware/upload.js';
import { publicUser } from './utils/tokens.js';
import { error } from './utils/errors.js';

const app = express();

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'pillsync-server' }));
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/caregiver', caregiverRoutes);
// Legacy compatibility: POST /api/link used by existing clients (App.jsx calls /link)
app.post('/api/link', requireAuth, requireRole('caregiver'), async (req, res) => {
  const patient = await User.findOne({ linkCode: req.body.linkCode?.trim().toUpperCase(), role: 'patient' });
  if (!patient) return error(res, 404, 'That patient code was not found.');
  await User.findByIdAndUpdate(req.auth.sub, { $addToSet: { linkedPatients: patient._id } });
  await CaregiverLink.updateOne({ patientId: patient._id, caregiverId: req.auth.sub }, { $setOnInsert: { accessLevel: 'view' } }, { upsert: true });
  res.json({ patient: publicUser(patient), message: `${patient.name} is now linked to your view.` });
});

// Profile image — caregiver & patient (saved as Buffer in Compass User collection)
app.post('/api/profile/image', requireAuth, profileUpload.single('image'), async (req, res) => {
  if (!req.file) return error(res, 400, 'Please upload JPG/PNG/WebP under 5MB.');
  // magic-byte check
  const h = req.file.buffer.subarray(0, 12);
  const isJpeg = h[0]===0xFF && h[1]===0xD8;
  const isPng = h[0]===0x89 && h[1]===0x50 && h[2]===0x4E && h[3]===0x47;
  const isWebp = h[8]===0x57 && h[9]===0x45 && h[10]===0x42 && h[11]===0x50;
  if (!isJpeg && !isPng && !isWebp) return error(res, 400, 'Invalid image file.');
  await User.findByIdAndUpdate(req.auth.sub, {
    profileImage: req.file.buffer,
    profileImageMimeType: req.file.mimetype,
    profileImageFilename: req.file.originalname.replace(/[^a-zA-Z0-9._-]/g,'')
  });
  res.json({ ok:true, hasProfileImage:true });
});

// Serve any user's profile image (mam can see in browser, Compass shows Buffer)
app.get('/api/profile/image/:userId', async (req, res) => {
  const user = await User.findById(req.params.userId).lean();
  if (!user || !user.profileImage) return error(res, 404, 'No profile image.');
  res.set('Content-Type', user.profileImageMimeType || 'image/jpeg');
  res.set('Cache-Control','public, max-age=86400');
  res.send(user.profileImage);
});
app.get('/api/profile/me/image', requireAuth, async (req, res) => {
  const user = await User.findById(req.auth.sub).lean();
  if (!user || !user.profileImage) return error(res, 404, 'No profile image.');
  res.set('Content-Type', user.profileImageMimeType || 'image/jpeg');
  res.send(user.profileImage);
});

export default app;
