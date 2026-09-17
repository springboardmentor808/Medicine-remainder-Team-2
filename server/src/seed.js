import 'dotenv/config';
import fs from 'node:fs';
import readline from 'node:readline';
import mongoose from 'mongoose';

// Define schema locally for seeding script independence
const medicineMasterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  normalizedName: { type: String, required: true, trim: true, lowercase: true, index: true },
  composition: { type: String, trim: true },
  uses: { type: String, trim: true },
  sideEffects: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  manufacturer: { type: String, trim: true },
  reviewStats: {
    excellentPercent: Number,
    averagePercent: Number,
    poorPercent: Number
  }
});

const MedicineMaster = mongoose.model('MedicineMaster', medicineMasterSchema);

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      // Toggle quotes state and discard the double quote character
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function seed() {
  const csvPath = '../Medcine details T2.csv';
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pillsync');
  console.log(`Connected to database.`);

  // Clear existing MedicineMaster collection
  console.log('Clearing existing MedicineMaster collection...');
  await MedicineMaster.deleteMany({});
  console.log('Cleared.');

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  let successCount = 0;
  let batch = [];
  const BATCH_SIZE = 1000;

  console.log('Starting CSV parsing and seeding...');

  for await (const line of rl) {
    lineCount++;
    // Skip header line
    if (lineCount === 1) continue;

    if (!line.trim()) continue;

    const row = parseCsvLine(line);
    if (row.length < 6) {
      console.warn(`Line ${lineCount} has invalid columns, skipping:`, row);
      continue;
    }

    const doc = {
      name: row[0],
      normalizedName: row[0].toLowerCase(),
      composition: row[1] || '',
      uses: row[2] || '',
      sideEffects: row[3] || '',
      imageUrl: row[4] || '',
      manufacturer: row[5] || '',
      reviewStats: {
        excellentPercent: Number(row[6]) || 0,
        averagePercent: Number(row[7]) || 0,
        poorPercent: Number(row[8]) || 0
      }
    };

    batch.push(doc);

    if (batch.length >= BATCH_SIZE) {
      await MedicineMaster.insertMany(batch);
      successCount += batch.length;
      console.log(`Seeded ${successCount} records...`);
      batch = [];
    }
  }

  // Insert remaining docs
  if (batch.length > 0) {
    await MedicineMaster.insertMany(batch);
    successCount += batch.length;
  }

  console.log(`Seeding complete. Successfully seeded ${successCount} of ${lineCount - 1} records.`);
  
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
