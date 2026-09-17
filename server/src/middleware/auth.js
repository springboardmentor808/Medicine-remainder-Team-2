import jwt from 'jsonwebtoken';
import { accessSecret } from '../config/env.js';
import { error } from '../utils/errors.js';

export const requireAuth = (req, res, next) => {
  const headerToken = req.headers.authorization?.replace('Bearer ', '');
  const cookieToken = req.cookies?.pillsync_access;
  const token = headerToken || cookieToken;
  if (!token) return error(res, 401, 'Please sign in to continue.');
  try {
    req.auth = jwt.verify(token, accessSecret);
    next();
  } catch {
    return error(res, 401, 'Your session has expired. Please sign in again.');
  }
};

export const requireRole = (role) => (req, res, next) =>
  req.auth.role === role ? next() : error(res, 403, 'This area is for another account type.');
