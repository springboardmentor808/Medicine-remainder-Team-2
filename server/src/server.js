import 'dotenv/config';
import mongoose from 'mongoose';
import { createServer } from 'node:http';
import app from './app.js';
import { port, mongodbUri, clientOrigin } from './config/env.js';
import { initSocket } from './socket.js';
import { startRefillCron } from './jobs/refillJob.js';

const httpServer = createServer(app);
initSocket(httpServer, clientOrigin);
startRefillCron();

mongoose.connect(mongodbUri)
  .then(() => httpServer.listen(port, () => console.log(`PillSync server listening on http://localhost:${port}`)))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
