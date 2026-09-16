import 'dotenv/config';
import mongoose from 'mongoose';
import { createServer } from 'node:http';
import app from './app.js';
import { port, mongodbUri, clientOrigin } from './config/env.js';
import { initSocket } from './socket.js';
import { startRefillCron } from './jobs/refillJob.js';
import { startSmartReminderEngine } from './jobs/smartReminderEngine.js';

const httpServer = createServer(app);
initSocket(httpServer, clientOrigin);
startRefillCron();
startSmartReminderEngine();

const isAtlas = mongodbUri.includes('mongodb+srv') || (!mongodbUri.includes('127.0.0.1') && !mongodbUri.includes('localhost'));
const maskedUri = mongodbUri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1*****$3');

mongoose.connect(mongodbUri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log(`Connected to MongoDB ${isAtlas ? '(Atlas / Remote)' : '(Local)'} [${maskedUri}]`);
    httpServer.listen(port, () => console.log(`PillSync server listening on http://localhost:${port}`));
  })
  .catch(async (e) => {
    if (isAtlas) {
      console.warn(`MongoDB Atlas connection failed (${e.message}). Falling back to local MongoDB (mongodb://127.0.0.1:27017/pillsync)...`);
      try {
        await mongoose.connect('mongodb://127.0.0.1:27017/pillsync', { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to local fallback MongoDB [mongodb://127.0.0.1:27017/pillsync]');
        httpServer.listen(port, () => console.log(`PillSync server listening on http://localhost:${port}`));
        return;
      } catch (localErr) {
        console.error('Local fallback MongoDB connection also failed:', localErr.message);
      }
    }
    console.error(`MongoDB connection failed (${isAtlas ? 'Atlas / Remote' : 'Local'}):`, e.message);
    process.exit(1);
  });
