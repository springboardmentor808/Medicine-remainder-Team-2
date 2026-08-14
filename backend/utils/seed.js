require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Medication = require('../models/Medication');
const MedicationLog = require('../models/MedicationLog');
const { normalizeDate, isMedicationActiveOnDate } = require('./logHelper');

const IndianPatients = [
  {
    patientId: 'P001',
    name: 'Aarav Sharma',
    age: 28,
    gender: 'Male',
    bloodGroup: 'A+',
    height: 175,
    weight: 70,
    mobile: '+91 9876543210',
    address: 'Connaught Place, New Delhi, Delhi',
    emergencyContact: '9876543211 (Brother)',
    doctorName: 'Dr. Alok Sen (Pulmonologist)',
    allergies: ['Dust', 'Pollen'],
    chronicDisease: 'Asthma'
  },
  {
    patientId: 'P002',
    name: 'Priya Verma',
    age: 34,
    gender: 'Female',
    bloodGroup: 'O+',
    height: 162,
    weight: 58,
    mobile: '+91 9812345678',
    address: 'Hazratganj, Lucknow, Uttar Pradesh',
    emergencyContact: '9812345679 (Spouse)',
    doctorName: 'Dr. S. K. Gupta (Neurologist)',
    allergies: ['Sulfa Drugs'],
    chronicDisease: 'Migraine'
  },
  {
    patientId: 'P003',
    name: 'Rahul Singh',
    age: 45,
    gender: 'Male',
    bloodGroup: 'B+',
    height: 180,
    weight: 85,
    mobile: '+91 9000123456',
    address: 'Kankarbagh, Patna, Bihar',
    emergencyContact: '9000123457 (Spouse)',
    doctorName: 'Dr. R. P. Sinha (Diabetologist)',
    allergies: ['Gluten', 'Penicillin'],
    chronicDisease: 'Diabetes Type 2'
  },
  {
    patientId: 'P004',
    name: 'Ananya Gupta',
    age: 22,
    gender: 'Female',
    bloodGroup: 'AB+',
    height: 158,
    weight: 50,
    mobile: '+91 9988776655',
    address: 'Malviya Nagar, Jaipur, Rajasthan',
    emergencyContact: '9988776656 (Mother)',
    doctorName: 'Dr. Meera Bai (General Physician)',
    allergies: ['Peanuts'],
    chronicDisease: 'None'
  },
  {
    patientId: 'P005',
    name: 'Vivek Patel',
    age: 52,
    gender: 'Male',
    bloodGroup: 'A-',
    height: 172,
    weight: 78,
    mobile: '+91 9123456789',
    address: 'Satellite, Ahmedabad, Gujarat',
    emergencyContact: '9123456780 (Son)',
    doctorName: 'Dr. H. J. Mehta (Cardiologist)',
    allergies: [],
    chronicDisease: 'Hypertension'
  },
  {
    patientId: 'P006',
    name: 'Sneha Reddy',
    age: 31,
    gender: 'Female',
    bloodGroup: 'O-',
    height: 165,
    weight: 60,
    mobile: '+91 9334455667',
    address: 'Banjara Hills, Hyderabad, Telangana',
    emergencyContact: '9334455668 (Father)',
    doctorName: 'Dr. K. S. Rao (Endocrinologist)',
    allergies: ['Shellfish'],
    chronicDisease: 'Thyroid Disorder'
  },
  {
    patientId: 'P007',
    name: 'Rohan Mehta',
    age: 40,
    gender: 'Male',
    bloodGroup: 'B-',
    height: 178,
    weight: 82,
    mobile: '+91 9090909090',
    address: 'Andheri West, Mumbai, Maharashtra',
    emergencyContact: '9090909091 (Spouse)',
    doctorName: 'Dr. Farhan Contractor (Gastroenterologist)',
    allergies: ['Lactose'],
    chronicDisease: 'GERD'
  },
  {
    patientId: 'P008',
    name: 'Kavya Nair',
    age: 27,
    gender: 'Female',
    bloodGroup: 'A+',
    height: 160,
    weight: 52,
    mobile: '+91 9447788990',
    address: 'Ernakulam, Kochi, Kerala',
    emergencyContact: '9447788991 (Sister)',
    doctorName: 'Dr. Lakshmi Menon (Hematologist)',
    allergies: [],
    chronicDisease: 'Anemia'
  },
  {
    patientId: 'P009',
    name: 'Amit Kumar',
    age: 60,
    gender: 'Male',
    bloodGroup: 'AB-',
    height: 170,
    weight: 75,
    mobile: '+91 9556677889',
    address: 'Arera Colony, Bhopal, Madhya Pradesh',
    emergencyContact: '9556677880 (Spouse)',
    doctorName: 'Dr. Sunil Patil (Rheumatologist)',
    allergies: ['Penicillin'],
    chronicDisease: 'Osteoarthritis'
  },
  {
    patientId: 'P010',
    name: 'Neha Joshi',
    age: 38,
    gender: 'Female',
    bloodGroup: 'O+',
    height: 163,
    weight: 56,
    mobile: '+91 9778899001',
    address: 'Kothrud, Pune, Maharashtra',
    emergencyContact: '9778899002 (Mother)',
    doctorName: 'Dr. Ananya Deshmukh (Psychiatrist)',
    allergies: ['NSAIDs'],
    chronicDisease: 'Anxiety'
  },
  {
    patientId: 'P011',
    name: 'Arjun Mishra',
    age: 49,
    gender: 'Male',
    bloodGroup: 'A+',
    height: 176,
    weight: 80,
    mobile: '+91 9887766554',
    address: 'Lanka, Varanasi, Uttar Pradesh',
    emergencyContact: '9887766555 (Son)',
    doctorName: 'Dr. V. K. Pandey (General Physician)',
    allergies: [],
    chronicDisease: 'Chronic Bronchitis'
  },
  {
    patientId: 'P012',
    name: 'Pooja Yadav',
    age: 29,
    gender: 'Female',
    bloodGroup: 'B+',
    height: 159,
    weight: 54,
    mobile: '+91 9665544332',
    address: 'Vijay Nagar, Indore, Madhya Pradesh',
    emergencyContact: '9665544333 (Brother)',
    doctorName: 'Dr. Sandeep Yadav (General Physician)',
    allergies: [],
    chronicDisease: 'Vitamin Deficiency'
  }
];

const indianMedsList = [
  { medicineName: 'Paracetamol 650 mg', dosage: '1 tablet', frequency: 'daily', timesPerDay: 3, scheduledTimes: ['08:00', '14:00', '20:00'], instructions: 'Take after meals' },
  { medicineName: 'Dolo 650', dosage: '1 tablet', frequency: 'daily', timesPerDay: 2, scheduledTimes: ['09:00', '21:00'], instructions: 'Take in case of active fever/body ache' },
  { medicineName: 'Metformin 500 mg', dosage: '1 tablet', frequency: 'daily', timesPerDay: 2, scheduledTimes: ['08:30', '20:30'], instructions: 'Take with food (breakfast and dinner)' },
  { medicineName: 'Telmisartan 40 mg', dosage: '1 tablet', frequency: 'daily', timesPerDay: 1, scheduledTimes: ['09:05'], instructions: 'Take in the morning on an empty stomach' },
  { medicineName: 'Amlodipine 5 mg', dosage: '1 tablet', frequency: 'daily', timesPerDay: 1, scheduledTimes: ['08:00'], instructions: 'Take with water in the morning' },
  { medicineName: 'Atorvastatin 10 mg', dosage: '1 tablet', frequency: 'daily', timesPerDay: 1, scheduledTimes: ['21:30'], instructions: 'Take at night' },
  { medicineName: 'Pantoprazole 40 mg', dosage: '1 tablet', frequency: 'daily', timesPerDay: 1, scheduledTimes: ['07:30'], instructions: 'Take 30 minutes before breakfast' },
  { medicineName: 'Thyronorm 50 mcg', dosage: '1 tablet', frequency: 'daily', timesPerDay: 1, scheduledTimes: ['07:00'], instructions: 'Take first thing in morning, empty stomach' },
  { medicineName: 'Ecosprin 75', dosage: '1 tablet', frequency: 'daily', timesPerDay: 1, scheduledTimes: ['20:00'], instructions: 'Take after dinner' },
  { medicineName: 'Vitamin D3', dosage: '1 capsule', frequency: 'weekly', timesPerDay: 1, scheduledTimes: ['10:00'], instructions: 'Take on Sunday mornings after breakfast' },
  { medicineName: 'Iron + Folic Acid', dosage: '1 tablet', frequency: 'daily', timesPerDay: 1, scheduledTimes: ['15:00'], instructions: 'Take with lunch' },
  { medicineName: 'Calcium Tablets', dosage: '1 tablet', frequency: 'daily', timesPerDay: 1, scheduledTimes: ['14:00'], instructions: 'Take after lunch' },
  { medicineName: 'Zinc Tablets', dosage: '1 tablet', frequency: 'daily', timesPerDay: 1, scheduledTimes: ['13:00'], instructions: 'Take with lunch' },
  { medicineName: 'Levocetirizine 5 mg', dosage: '1 tablet', frequency: 'daily', timesPerDay: 1, scheduledTimes: ['21:00'], instructions: 'Take at night, may cause drowsiness' },
  { medicineName: 'Amoxicillin 500 mg', dosage: '1 capsule', frequency: 'daily', timesPerDay: 3, scheduledTimes: ['07:00', '15:00', '23:00'], instructions: 'Complete full course of antibiotics' },
  { medicineName: 'Azithromycin 500 mg', dosage: '1 tablet', frequency: 'daily', timesPerDay: 1, scheduledTimes: ['11:00'], instructions: 'Complete 3-day course, take 1 hr before meals' }
];

const seedData = async (isCliCall = false) => {
  try {
    if (isCliCall) {
      const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medication_tracker';
      console.log('Connecting to database for seeding...');
      await mongoose.connect(mongoUri);
    }

    console.log('Clearing existing patients, medications, and logs...');
    await Patient.deleteMany({});
    await Medication.deleteMany({});
    await MedicationLog.deleteMany({});

    console.log(`Creating ${IndianPatients.length} Indian Patients...`);
    const patients = await Patient.insertMany(IndianPatients);

    const now = new Date();
    const logsToInsert = [];
    const medicationsCreated = [];

    console.log('Seeding patient medications regimens...');

    for (const patient of patients) {
      const pid = patient.patientId;
      const chronic = patient.chronicDisease;

      // Determine which medicines to assign based on chronic disease
      let assignedMeds = [];

      if (chronic === 'Asthma') {
        assignedMeds = [
          indianMedsList.find(m => m.medicineName.startsWith('Levocetirizine')),
          indianMedsList.find(m => m.medicineName.startsWith('Pantoprazole')),
          indianMedsList.find(m => m.medicineName.startsWith('Calcium'))
        ];
      } else if (chronic === 'Migraine') {
        assignedMeds = [
          indianMedsList.find(m => m.medicineName.startsWith('Paracetamol')),
          indianMedsList.find(m => m.medicineName.startsWith('Ecosprin')),
          indianMedsList.find(m => m.medicineName.startsWith('Vitamin D3'))
        ];
      } else if (chronic === 'Diabetes Type 2') {
        assignedMeds = [
          indianMedsList.find(m => m.medicineName.startsWith('Metformin')),
          indianMedsList.find(m => m.medicineName.startsWith('Telmisartan')),
          indianMedsList.find(m => m.medicineName.startsWith('Atorvastatin'))
        ];
      } else if (chronic === 'Hypertension') {
        assignedMeds = [
          indianMedsList.find(m => m.medicineName.startsWith('Amlodipine')),
          indianMedsList.find(m => m.medicineName.startsWith('Telmisartan')),
          indianMedsList.find(m => m.medicineName.startsWith('Ecosprin'))
        ];
      } else if (chronic === 'Thyroid Disorder') {
        assignedMeds = [
          indianMedsList.find(m => m.medicineName.startsWith('Thyronorm')),
          indianMedsList.find(m => m.medicineName.startsWith('Vitamin D3')),
          indianMedsList.find(m => m.medicineName.startsWith('Iron'))
        ];
      } else if (chronic === 'GERD') {
        assignedMeds = [
          indianMedsList.find(m => m.medicineName.startsWith('Pantoprazole')),
          indianMedsList.find(m => m.medicineName.startsWith('Calcium')),
          indianMedsList.find(m => m.medicineName.startsWith('Dolo 650'))
        ];
      } else if (chronic === 'Anemia') {
        assignedMeds = [
          indianMedsList.find(m => m.medicineName.startsWith('Iron')),
          indianMedsList.find(m => m.medicineName.startsWith('Vitamin D3')),
          indianMedsList.find(m => m.medicineName.startsWith('Zinc'))
        ];
      } else if (chronic === 'Osteoarthritis') {
        assignedMeds = [
          indianMedsList.find(m => m.medicineName.startsWith('Paracetamol')),
          indianMedsList.find(m => m.medicineName.startsWith('Calcium')),
          indianMedsList.find(m => m.medicineName.startsWith('Pantoprazole'))
        ];
      } else if (chronic === 'Anxiety') {
        assignedMeds = [
          indianMedsList.find(m => m.medicineName.startsWith('Levocetirizine')), // drowsiness aids sleep
          indianMedsList.find(m => m.medicineName.startsWith('Vitamin D3')),
          indianMedsList.find(m => m.medicineName.startsWith('Dolo 650'))
        ];
      } else if (chronic === 'Chronic Bronchitis') {
        assignedMeds = [
          indianMedsList.find(m => m.medicineName.startsWith('Amoxicillin')), // antibiotic
          indianMedsList.find(m => m.medicineName.startsWith('Pantoprazole')),
          indianMedsList.find(m => m.medicineName.startsWith('Dolo 650'))
        ];
      } else {
        // Fallback for Vitamin Deficiency and general patients
        assignedMeds = [
          indianMedsList.find(m => m.medicineName.startsWith('Vitamin D3')),
          indianMedsList.find(m => m.medicineName.startsWith('Calcium')),
          indianMedsList.find(m => m.medicineName.startsWith('Zinc'))
        ];
      }

      // Add a random 4th medicine for extra variety
      const randomMedIndex = Math.floor(Math.random() * indianMedsList.length);
      const randomMed = indianMedsList[randomMedIndex];
      if (!assignedMeds.some(m => m.medicineName === randomMed.medicineName)) {
        assignedMeds.push(randomMed);
      }

      // Adherence rate: simulate factors between 70% and 100%
      const adherenceFactor = 0.70 + Math.random() * 0.28;

      for (const rawMed of assignedMeds) {
        const startDate = new Date();
        startDate.setDate(now.getDate() - 30); // 30 days ago
        const endDate = new Date();
        endDate.setDate(now.getDate() + 30); // 30 days from now

        const medDoc = await Medication.create({
          patientId: pid,
          medicineName: rawMed.medicineName,
          dosage: rawMed.dosage,
          frequency: rawMed.frequency,
          timesPerDay: rawMed.timesPerDay,
          scheduledTimes: rawMed.scheduledTimes,
          startDate,
          endDate,
          instructions: rawMed.instructions,
          isActive: true
        });
        medicationsCreated.push(medDoc);

        // Generate logs for the past 30 days
        for (let offset = 30; offset >= 0; offset--) {
          const logDay = new Date(now);
          logDay.setDate(now.getDate() - offset);
          const normalizedDay = normalizeDate(logDay);
          const dayStr = normalizedDay.toISOString().split('T')[0];

          if (isMedicationActiveOnDate(medDoc, normalizedDay)) {
            for (const time of medDoc.scheduledTimes) {
              const [hours, minutes] = time.split(':').map(Number);
              const scheduledDateTime = new Date(normalizedDay);
              scheduledDateTime.setHours(hours, minutes, 0, 0);

              if (scheduledDateTime > now) continue;

              const roll = Math.random();
              let status = 'Taken';
              let takenTime = null;
              let notes = '';

              if (roll < adherenceFactor) {
                status = 'Taken';
                const minuteOffset = Math.floor(Math.random() * 40) - 10;
                takenTime = new Date(scheduledDateTime);
                takenTime.setMinutes(takenTime.getMinutes() + minuteOffset);
                notes = 'Dose taken successfully';
              } else {
                // Determine missed vs skipped
                if (Math.random() < 0.65) {
                  status = 'Missed';
                  notes = 'Patient missed scheduled intake reminder';
                } else {
                  status = 'Skipped';
                  notes = 'Dose skipped due to stomach upset/side-effects';
                }
              }

              logsToInsert.push({
                patientId: pid,
                medicationId: medDoc._id,
                scheduledTime: time,
                status,
                takenTime,
                date: normalizedDay,
                notes
              });
            }
          }
        }
      }
    }

    console.log(`Inserting ${medicationsCreated.length} medications regimens...`);
    console.log(`Inserting ${logsToInsert.length} log records...`);
    await MedicationLog.insertMany(logsToInsert);
    console.log('Database seeding successfully upgraded to Multi-Patient Healthcare records!');

    if (isCliCall) {
      await mongoose.connection.close();
      process.exit(0);
    }
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    if (isCliCall) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedData(true);
}

module.exports = seedData;
