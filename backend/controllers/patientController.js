const Patient = require('../models/Patient');
const Medication = require('../models/Medication');
const MedicationLog = require('../models/MedicationLog');
const { syncMedicationLogsForRange, normalizeDate } = require('../utils/logHelper');
const { asyncHandler } = require('../middleware/errorMiddleware');

/**
 * @desc    Get all patients with search, filters, sorting, and pagination
 * @route   GET /api/patients
 * @access  Public (Auth ready)
 */
const getPatients = asyncHandler(async (req, res) => {
  const search = req.query.search ? String(req.query.search).trim() : '';
  const disease = req.query.disease ? String(req.query.disease).trim() : '';
  const minAdherence = parseInt(req.query.minAdherence, 10) || 0;
  const maxAdherence = parseInt(req.query.maxAdherence, 10) || 100;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build basic MongoDB filter for patients
  const filter = {};
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }
  if (disease && disease.toLowerCase() !== 'all') {
    filter.chronicDisease = { $regex: new RegExp(`^${disease}$`, 'i') };
  }

  // Fetch candidate patients
  const patients = await Patient.find(filter);
  const today = normalizeDate(new Date());

  // Aggregate stats in memory for each candidate patient
  const patientDataList = [];
  for (const patient of patients) {
    const pid = patient.patientId;

    // 1. Calculate overall compliance
    const pastLogs = await MedicationLog.find({ patientId: pid, status: { $ne: 'Pending' } });
    const totalDoses = pastLogs.length;
    const takenDoses = pastLogs.filter(l => l.status === 'Taken').length;
    const overallAdherence = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    // Filter by adherence rate range if requested
    if (overallAdherence < minAdherence || overallAdherence > maxAdherence) {
      continue;
    }

    // 2. Fetch today's schedule logs to check today's totals and missed doses count
    const todayLogs = await syncMedicationLogsForRange(pid, today, today);
    const todayMedicinesCount = todayLogs.length;
    const missedTodayCount = todayLogs.filter(l => l.status === 'Missed').length;

    // 3. Find last logged action timestamp
    const latestLog = await MedicationLog.findOne({ patientId: pid }).sort({ updatedAt: -1 });
    const lastUpdated = latestLog ? latestLog.updatedAt : patient.updatedAt;

    patientDataList.push({
      _id: patient._id,
      patientId: pid,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      chronicDisease: patient.chronicDisease,
      allergies: patient.allergies,
      doctorName: patient.doctorName,
      mobile: patient.mobile,
      overallAdherence,
      todayMedicinesCount,
      missedTodayCount,
      lastUpdated
    });
  }

  // Apply sorting options
  const sortBy = req.query.sortBy || 'name'; // name, overallAdherence, lastUpdated
  const sortOrder = req.query.sortOrder || 'asc'; // asc, desc

  patientDataList.sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'name') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    
    // Numbers/Dates sort
    valA = valA instanceof Date ? valA.getTime() : valA;
    valB = valB instanceof Date ? valB.getTime() : valB;

    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  // Apply pagination
  const total = patientDataList.length;
  const paginatedList = patientDataList.slice(skip, skip + limit);

  res.status(200).json({
    success: true,
    count: paginatedList.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: paginatedList
  });
});

/**
 * @desc    Get patient profile details
 * @route   GET /api/patients/:patientId
 * @access  Public
 */
const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ patientId: req.params.patientId });
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Compute profile statistics
  const pid = patient.patientId;
  const pastLogs = await MedicationLog.find({ patientId: pid, status: { $ne: 'Pending' } });
  const totalDoses = pastLogs.length;
  const takenDoses = pastLogs.filter(l => l.status === 'Taken').length;
  const overallAdherence = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

  const patientObj = patient.toObject();
  patientObj.overallAdherence = overallAdherence;

  res.status(200).json({
    success: true,
    data: patientObj
  });
});

/**
 * @desc    Create a new patient profile
 * @route   POST /api/patients
 * @access  Public
 */
const createPatient = asyncHandler(async (req, res) => {
  let { 
    patientId, name, age, gender, bloodGroup, height, weight, 
    mobile, address, emergencyContact, doctorName, allergies, chronicDisease 
  } = req.body;

  if (!name || !age || !gender || !bloodGroup || !mobile || !address || !doctorName) {
    res.status(400);
    throw new Error('Please fill in all required patient fields (Full Name, Age, Gender, Blood Group, Mobile, Address, Doctor)');
  }

  // Auto-generate Patient ID if not explicitly provided
  if (!patientId || !patientId.trim()) {
    const allPatients = await Patient.find({}, { patientId: 1 });
    let maxNum = 0;
    allPatients.forEach(p => {
      const match = p.patientId ? p.patientId.match(/P(\d+)/i) : null;
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    patientId = `P${String(maxNum + 1).padStart(3, '0')}`;
  } else {
    patientId = patientId.trim();
  }

  const exists = await Patient.findOne({ patientId });
  if (exists) {
    res.status(400);
    throw new Error(`Patient ID "${patientId}" already exists`);
  }

  // Format allergies array
  let processedAllergies = [];
  if (Array.isArray(allergies)) {
    processedAllergies = allergies.map(a => String(a).trim()).filter(Boolean);
  } else if (typeof allergies === 'string' && allergies.trim()) {
    processedAllergies = allergies.split(',').map(a => a.trim()).filter(Boolean);
  }

  const patient = await Patient.create({
    patientId,
    name: name.trim(),
    age: Number(age),
    gender,
    bloodGroup,
    height: height ? Number(height) : 170,
    weight: weight ? Number(weight) : 65,
    mobile: mobile.trim(),
    address: address.trim(),
    emergencyContact: emergencyContact ? emergencyContact.trim() : mobile.trim(),
    doctorName: doctorName.trim(),
    allergies: processedAllergies,
    chronicDisease: chronicDisease ? chronicDisease.trim() : 'None'
  });

  res.status(201).json({
    success: true,
    data: patient
  });
});

/**
 * @desc    Update a patient profile
 * @route   PUT /api/patients/:patientId
 * @access  Public
 */
const updatePatient = asyncHandler(async (req, res) => {
  let patient = await Patient.findOne({ patientId: req.params.patientId });
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  const { 
    name, age, gender, bloodGroup, height, weight, 
    mobile, address, emergencyContact, doctorName, allergies, chronicDisease 
  } = req.body;

  patient.name = name !== undefined ? name.trim() : patient.name;
  patient.age = age !== undefined ? Number(age) : patient.age;
  patient.gender = gender !== undefined ? gender : patient.gender;
  patient.bloodGroup = bloodGroup !== undefined ? bloodGroup : patient.bloodGroup;
  patient.height = height !== undefined ? Number(height) : patient.height;
  patient.weight = weight !== undefined ? Number(weight) : patient.weight;
  patient.mobile = mobile !== undefined ? mobile.trim() : patient.mobile;
  patient.address = address !== undefined ? address.trim() : patient.address;
  patient.emergencyContact = emergencyContact !== undefined ? emergencyContact.trim() : patient.emergencyContact;
  patient.doctorName = doctorName !== undefined ? doctorName.trim() : patient.doctorName;

  if (allergies !== undefined) {
    if (Array.isArray(allergies)) {
      patient.allergies = allergies.map(a => String(a).trim()).filter(Boolean);
    } else if (typeof allergies === 'string') {
      patient.allergies = allergies.split(',').map(a => a.trim()).filter(Boolean);
    }
  }

  patient.chronicDisease = chronicDisease !== undefined ? chronicDisease.trim() : patient.chronicDisease;

  await patient.save();

  res.status(200).json({
    success: true,
    data: patient
  });
});

/**
 * @desc    Delete a patient, their medications, and all logs
 * @route   DELETE /api/patients/:patientId
 * @access  Public
 */
const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ patientId: req.params.patientId });
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  const pid = patient.patientId;

  // Clean up medications & logs
  await MedicationLog.deleteMany({ patientId: pid });
  await Medication.deleteMany({ patientId: pid });
  await Patient.findByIdAndDelete(patient._id);

  res.status(200).json({
    success: true,
    message: `Patient ${pid} and all associated medication data have been deleted.`
  });
});

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
};
