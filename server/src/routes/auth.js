import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { refreshSecret } from '../config/env.js';
import { publicUser, signAccess, issueRefresh, hashToken } from '../utils/tokens.js';
import { error } from '../utils/errors.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !phone || !password || !['patient', 'caregiver'].includes(role))
      return error(res, 400, 'Please complete your name, email, phone, password, and account type.');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return error(res, 400, 'Please enter a valid email address.');
    const cleanPhone = phone.trim().replace(/[\s\-()]/g, '');
    if (cleanPhone.length < 10) return error(res, 400, 'Please enter a valid phone number with at least 10 digits.');
    if (password.length < 8) return error(res, 400, 'Use a password with at least 8 characters.');
    if (await User.exists({ $or: [{ email: email.toLowerCase() }, { phone: phone.trim() }] }))
      return error(res, 409, 'An account with this email or phone already exists.');
    const user = await User.create({
      name,
      email,
      phone: phone.trim(),
      passwordHash: await bcrypt.hash(password, 10),
      role,
      linkCode: role === 'patient' ? `PS-${crypto.randomBytes(3).toString('hex').toUpperCase()}` : undefined,
    });
    const refresh = await issueRefresh(user);
    const access = signAccess(user);
    res.cookie('pillsync_access', access, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 15 * 60 * 1000 });
    res.cookie('pillsync_refresh', refresh, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7 * 86400000 });
    res.status(201).json({ accessToken: access, user: publicUser(user) });
  } catch (e) {
    console.error(e);
    return error(res, 500, 'We could not create your account right now.');
  }
});

router.post('/login', async (req, res) => {
  try {
    const login = req.body.login?.trim();
    const { role } = req.body;
    const user = await User.findOne({ $or: [{ email: login?.toLowerCase() }, { phone: login }] });
    if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash)))
      return error(res, 401, 'Email or password is not correct.');
    if (role && user.role !== role) {
      return error(res, 403, `This account is registered as a ${user.role}. Please sign in through the ${user.role} workspace.`);
    }
    const refresh = await issueRefresh(user);
    const access = signAccess(user);
    res.cookie('pillsync_access', access, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 15 * 60 * 1000 });
    res.cookie('pillsync_refresh', refresh, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7 * 86400000 });
    res.json({ accessToken: access, user: publicUser(user) });
  } catch (e) {
    console.error(e);
    return error(res, 500, 'We could not sign you in right now.');
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies.pillsync_refresh;
    if (!token) return error(res, 401, 'Please sign in to continue.');
    const payload = jwt.verify(token, refreshSecret);
    const hash = hashToken(token);
    const session = await Session.findOne({ userId: payload.sub, refreshHash: hash, expiresAt: { $gt: new Date() } });
    const user = await User.findById(payload.sub);
    if (!session || !user) return error(res, 401, 'Please sign in again.');
    const newAccess = signAccess(user);
    res.cookie('pillsync_access', newAccess, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 15 * 60 * 1000 });
    res.json({ accessToken: newAccess, user: publicUser(user) });
  } catch {
    return error(res, 401, 'Please sign in again.');
  }
});

router.post('/logout', async (req, res) => {
  const token = req.cookies.pillsync_refresh;
  if (token) await Session.deleteOne({ refreshHash: hashToken(token) });
  res.clearCookie('pillsync_access');
  res.clearCookie('pillsync_refresh');
  res.json({ ok: true });
});

export default router;
