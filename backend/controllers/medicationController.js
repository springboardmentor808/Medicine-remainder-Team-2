const Medication = require('../models/Medication');
const MedicationLog = require('../models/MedicationLog');
const { normalizeDate } = require('../utils/logHelper');
const { asyncHandler } = require('../middleware/errorMiddleware');

/**
 * @desc    Get all medications for a specific patient (with search, pagination, sorting, active status filter)
 * @route   GET /api/medications
 * @access  Public
 */
const getMedications = asyncHandler(async (req, res) => {
  const patientId = req.query.patientId || req.headers['x-patient-id'] || 'P001';
  
  // Search query
  const search = req.query.search ? String(req.query.search).trim() : '';
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  
  // Filter by active status
  const filter = { patientId };
  if (search) {
    filter.medicineName = { $regex: search, $options: 'i' };
  }
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  // Sorting
  let sortOption = { createdAt: -1 };
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':');
    sortOption = { [parts[0]]: parts[1] === 'desc' ? -1 : 1 };
  }

  const total = await Medication.countDocuments(filter);
  const medications = await Medication.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: medications.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: medications
  });
});

/**
 * @desc    Get a single medication by ID
 * @route   GET /api/medications/:id
 * @access  Public
 */
const getMedicationById = asyncHandler(async (req, res) => {
  const patientId = req.query.patientId || req.headers['x-patient-id'] || 'P001';
  const medication = await Medication.findOne({ _id: req.params.id, patientId });

  if (!medication) {
    res.status(404);
    throw new Error('Medication not found');
  }

  res.status(200).json({
    success: true,
    data: medication
  });
});

/**
 * @desc    Create a new medication regimen for a patient
 * @route   POST /api/medications
 * @access  Public
 */
const createMedication = asyncHandler(async (req, res) => {
  const patientId = req.body.patientId || req.headers['x-patient-id'] || 'P001';
  const { medicineName, dosage, frequency, specificDays, timesPerDay, scheduledTimes, startDate, endDate, instructions } = req.body;

  // Validation
  if (!medicineName) {
    res.status(400);
    throw new Error('Medicine name is required');
  }
  if (!dosage) {
    res.status(400);
    throw new Error('Dosage description is required');
  }
  if (!frequency) {
    res.status(400);
    throw new Error('Frequency is required');
  }
  if (!scheduledTimes || !Array.isArray(scheduledTimes) || scheduledTimes.length === 0) {
    res.status(400);
    throw new Error('At least one scheduled time is required');
  }
  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Start and End dates are required');
  }

  const parsedStart = new Date(startDate);
  const parsedEnd = new Date(endDate);
  if (parsedEnd < parsedStart) {
    res.status(400);
    throw new Error('End date cannot be earlier than start date');
  }

  // Duplicate name check (case-insensitive) for the same patient
  const existingMed = await Medication.findOne({
    patientId,
    medicineName: { $regex: new RegExp(`^${medicineName.trim()}$`, 'i') }
  });

  if (existingMed) {
    res.status(400);
    throw new Error(`A medication named "${medicineName}" already exists for this patient`);
  }

  const medication = await Medication.create({
    patientId,
    medicineName: medicineName.trim(),
    dosage: dosage.trim(),
    frequency,
    specificDays: specificDays || [],
    timesPerDay: timesPerDay || scheduledTimes.length,
    scheduledTimes,
    startDate: parsedStart,
    endDate: parsedEnd,
    instructions: instructions ? instructions.trim() : ''
  });

  res.status(201).json({
    success: true,
    data: medication
  });
});

/**
 * @desc    Update a medication regimen
 * @route   PUT /api/medications/:id
 * @access  Public
 */
const updateMedication = asyncHandler(async (req, res) => {
  const patientId = req.body.patientId || req.headers['x-patient-id'] || 'P001';
  const { medicineName, dosage, frequency, specificDays, timesPerDay, scheduledTimes, startDate, endDate, instructions, isActive } = req.body;

  let medication = await Medication.findOne({ _id: req.params.id, patientId });
  if (!medication) {
    res.status(404);
    throw new Error('Medication not found');
  }

  // If changing name, check duplicates for the same patient
  if (medicineName && medicineName.trim().toLowerCase() !== medication.medicineName.toLowerCase()) {
    const existingMed = await Medication.findOne({
      patientId,
      medicineName: { $regex: new RegExp(`^${medicineName.trim()}$`, 'i') }
    });
    if (existingMed) {
      res.status(400);
      throw new Error(`A medication named "${medicineName}" already exists for this patient`);
    }
  }

  medication.medicineName = medicineName !== undefined ? medicineName.trim() : medication.medicineName;
  medication.dosage = dosage !== undefined ? dosage.trim() : medication.dosage;
  medication.frequency = frequency !== undefined ? frequency : medication.frequency;
  medication.specificDays = specificDays !== undefined ? specificDays : medication.specificDays;
  medication.timesPerDay = timesPerDay !== undefined ? timesPerDay : medication.timesPerDay;
  medication.scheduledTimes = scheduledTimes !== undefined ? scheduledTimes : medication.scheduledTimes;
  medication.instructions = instructions !== undefined ? instructions.trim() : medication.instructions;
  medication.isActive = isActive !== undefined ? isActive : medication.isActive;

  if (startDate) medication.startDate = new Date(startDate);
  if (endDate) medication.endDate = new Date(endDate);

  if (medication.endDate < medication.startDate) {
    res.status(400);
    throw new Error('End date cannot be earlier than start date');
  }

  await medication.save();

  res.status(200).json({
    success: true,
    data: medication
  });
});

/**
 * @desc    Delete a medication and all its logs
 * @route   DELETE /api/medications/:id
 * @access  Public
 */
const deleteMedication = asyncHandler(async (req, res) => {
  const patientId = req.query.patientId || req.headers['x-patient-id'] || 'P001';
  
  const medication = await Medication.findOne({ _id: req.params.id, patientId });
  if (!medication) {
    res.status(404);
    throw new Error('Medication not found');
  }

  // Delete all logs for this medication
  await MedicationLog.deleteMany({ medicationId: medication._id, patientId });

  // Delete medication itself
  await Medication.findByIdAndDelete(medication._id);

  res.status(200).json({
    success: true,
    message: 'Medication and all its tracking history deleted successfully'
  });
});

/**
 * Helper to update or create log status
 */
const logStatusUpdate = async (req, res, targetStatus) => {
  const patientId = req.body.patientId || req.query.patientId || req.headers['x-patient-id'] || 'P001';
  const medicationId = req.params.id;
  const { date, scheduledTime, notes } = req.body;

  if (!date || !scheduledTime) {
    res.status(400);
    throw new Error('date and scheduledTime are required');
  }

  // Check if medication exists for this patient
  const medication = await Medication.findOne({ _id: medicationId, patientId });
  if (!medication) {
    res.status(404);
    throw new Error('Medication not found');
  }

  const normalizedLogDate = normalizeDate(date);

  // Search for existing log
  let log = await MedicationLog.findOne({
    patientId,
    medicationId,
    date: normalizedLogDate,
    scheduledTime
  });

  const now = new Date();

  if (log) {
    log.status = targetStatus;
    log.notes = notes !== undefined ? notes : log.notes;
    log.takenTime = targetStatus === 'Taken' ? now : undefined;
    await log.save();
  } else {
    log = await MedicationLog.create({
      patientId,
      medicationId,
      scheduledTime,
      status: targetStatus,
      date: normalizedLogDate,
      takenTime: targetStatus === 'Taken' ? now : undefined,
      notes: notes || ''
    });
  }

  res.status(200).json({
    success: true,
    data: log
  });
};

/**
 * @desc    Mark a dose slot as Taken
 * @route   POST /api/medications/:id/taken
 * @access  Public
 */
const markTaken = asyncHandler(async (req, res) => {
  await logStatusUpdate(req, res, 'Taken');
});

/**
 * @desc    Mark a dose slot as Missed
 * @route   POST /api/medications/:id/missed
 * @access  Public
 */
const markMissed = asyncHandler(async (req, res) => {
  await logStatusUpdate(req, res, 'Missed');
});

/**
 * @desc    Mark a dose slot as Skipped
 * @route   POST /api/medications/:id/skipped
 * @access  Public
 */
const markSkipped = asyncHandler(async (req, res) => {
  await logStatusUpdate(req, res, 'Skipped');
});

module.exports = {
  getMedications,
  getMedicationById,
  createMedication,
  updateMedication,
  deleteMedication,
  markTaken,
  markMissed,
  markSkipped
};
