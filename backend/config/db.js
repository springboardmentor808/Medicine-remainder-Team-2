const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Try standard MongoDB connection with a 2-second timeout
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medication_tracker', {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected (Standard): ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Standard MongoDB connection refused: ${error.message}`);
    console.log('Spinning up in-memory MongoDB fallback server...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB Connected (In-Memory): ${conn.connection.host}`);
      
      // Auto-populate in-memory database with compliance logs seeder
      console.log('Auto-populating in-memory database with compliance logs...');
      const seedData = require('../utils/seed');
      await seedData(false);
      console.log('In-memory database successfully seeded!');
    } catch (fallbackError) {
      console.error(`In-memory MongoDB server fallback failed: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
