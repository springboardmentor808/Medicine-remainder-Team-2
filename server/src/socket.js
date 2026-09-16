import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { accessSecret } from './config/env.js';

let io = null;

export function initSocket(httpServer, clientOrigin) {
  io = new Server(httpServer, { cors: { origin: clientOrigin, credentials: true } });
  io.use((socket, next) => {
    let token = socket.handshake.auth?.token?.replace('Bearer ', '');
    if (!token && socket.handshake.headers?.cookie) {
      const m = socket.handshake.headers.cookie.match(/pillsync_access=([^;]+)/);
      if (m) token = decodeURIComponent(m[1]);
    }
    if (!token) return next(new Error('No token'));
    try { socket.auth = jwt.verify(token, accessSecret); next(); } catch { next(new Error('Invalid token')); }
  });
  io.on('connection', (socket) => {
    // caregiver joins their own id room; patient joins their own id room for nudge
    if (socket.auth?.sub) socket.join(socket.auth.sub.toString());
    if (socket.auth?.role === 'caregiver') socket.join(`caregiver:${socket.auth.sub}`);
    if (socket.auth?.role === 'patient') socket.join(`patient:${socket.auth.sub}`);
    socket.on('disconnect', () => {});
  });
  return io;
}

export function emitToCaregiver(caregiverId, event, payload) {
  if (io) io.to(caregiverId.toString()).emit(event, payload);
}

export function emitToPatient(patientId, event, payload) {
  if (io) io.to(patientId.toString()).emit(event, payload);
}
