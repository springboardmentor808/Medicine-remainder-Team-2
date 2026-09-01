import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import Session from '../models/Session.js';
import { accessSecret, refreshSecret } from '../config/env.js';

export const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  linkCode: user.linkCode,
  conditions: user.conditions,
  emergencyContacts: user.emergencyContacts,
  hasProfileImage: !!user.profileImage,
  profileImageMimeType: user.profileImageMimeType || null,
});

export const signAccess = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role, name: user.name }, accessSecret, { expiresIn: '15m' });

export const issueRefresh = async (user) => {
  const token = jwt.sign({ sub: user._id.toString() }, refreshSecret, { expiresIn: '7d' });
  await Session.create({
    userId: user._id,
    refreshHash: crypto.createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + 7 * 86400000),
  });
  return token;
};

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
