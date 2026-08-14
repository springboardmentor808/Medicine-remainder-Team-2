const Patient = require('../models/Patient');
const Medication = require('../models/Medication');
const MedicationLog = require('../models/MedicationLog');
const { syncMedicationLogsForRange, normalizeDate } = require('../utils/logHelper');
const { asyncHandler } = require('../middleware/errorMiddleware');
const seedData = require('../utils/seed');

/**
 * @desc    Get dashboard metrics, next dose, recent activity, and timeline preview for a specific patient
 * @route   GET /api/dashboard
 * @access  Public
 */
const getDashboardData = asyncHandler(async (req, res) => {
  const isGlobal = req.query.global === 'true';
  const today = normalizeDate(new Date());

  if (isGlobal) {
    // 1. Calculate overall clinic statistics
    const totalPatients = await Patient.countDocuments({});
    const activeMedications = await Medication.countDocuments({ isActive: true });

    // Fetch all patients to loop and sync today's schedules
    const patientsList = await Patient.find({}, { patientId: 1 });
    const todayAllMedicines = [];
    for (const p of patientsList) {
      const todayLogs = await syncMedicationLogsForRange(p.patientId, today, today);
      todayAllMedicines.push(...todayLogs);
    }

    const total = todayAllMedicines.length;
    const taken = todayAllMedicines.filter(log => log.status === 'Taken').length;
    const missed = todayAllMedicines.filter(log => log.status === 'Missed').length;
    const pending = todayAllMedicines.filter(log => log.status === 'Pending').length;
    const skipped = todayAllMedicines.filter(log => log.status === 'Skipped').length;

    // Overall clinic adherence
    const pastLogs = await MedicationLog.find({ status: { $ne: 'Pending' } });
    const totalPast = pastLogs.length;
    const takenPast = pastLogs.filter(l => l.status === 'Taken').length;
    const overallAdherence = totalPast > 0 ? Math.round((takenPast / totalPast) * 100) : 100;

    // 2. Weekly Adherence Trend (last 7 days)
    const weeklyAdherence = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dNormalized = normalizeDate(d);
      const dStr = dNormalized.toISOString().split('T')[0];

      let dayTotal = 0;
      let dayTaken = 0;

      for (const p of patientsList) {
        const dayLogs = await syncMedicationLogsForRange(p.patientId, dNormalized, dNormalized);
        dayTotal += dayLogs.length;
        dayTaken += dayLogs.filter(l => l.status === 'Taken').length;
      }

      const rate = dayTotal > 0 ? Math.round((dayTaken / dayTotal) * 100) : 100;
      weeklyAdherence.push({
        date: dStr,
        label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        adherence: rate
      });
    }

    // 3. Medication Status today counts
    const statusCounts = {
      taken,
      missed,
      pending,
      skipped
    };

    // 4. Missed Dose Trend (last 30 days)
    const missedTrend = [];
    const startOfTrend = new Date(today);
    startOfTrend.setDate(today.getDate() - 29); // Last 30 days

    const missedLogsGrouped = await MedicationLog.aggregate([
      {
        $match: {
          status: 'Missed',
          date: { $gte: startOfTrend, $lte: today }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 }
        }
      }
    ]);

    const missedTrendMap = {};
    missedLogsGrouped.forEach(item => {
      missedTrendMap[item._id] = item.count;
    });

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      missedTrend.push({
        date: dStr,
        label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        count: missedTrendMap[dStr] || 0
      });
    }

    // 5. Recent Activities across all patients
    const recentLogs = await MedicationLog.find({ status: { $ne: 'Pending' } })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('medicationId');

    const patientIds = [...new Set(recentLogs.map(l => l.patientId))];
    const patientsInfo = await Patient.find({ patientId: { $in: patientIds } });
    const patientsMap = {};
    patientsInfo.forEach(p => {
      patientsMap[p.patientId] = p;
    });

    const recentActivity = recentLogs.map(log => {
      const patientObj = patientsMap[log.patientId];
      return {
        _id: log._id,
        patientId: log.patientId,
        patientName: patientObj ? patientObj.name : 'Unknown Patient',
        medicationId: log.medicationId ? log.medicationId._id : null,
        medicineName: log.medicationId ? log.medicationId.medicineName : 'Deleted Medication',
        dosage: log.medicationId ? log.medicationId.dosage : '',
        status: log.status,
        scheduledTime: log.scheduledTime,
        takenTime: log.takenTime,
        updatedAt: log.updatedAt,
        notes: log.notes
      };
    });

    // 6. Upcoming Medicines
    const nowTime = new Date();
    const upcoming = [];

    todayAllMedicines.forEach(log => {
      if (log.status !== 'Pending') return;
      const [hours, minutes] = log.scheduledTime.split(':').map(Number);
      const scheduledDateTime = new Date(today);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
      if (scheduledDateTime > nowTime) {
        upcoming.push({
          patientId: log.patientId,
          medicationId: log.medicationId,
          medicineName: log.medication ? log.medication.medicineName : 'Unknown',
          dosage: log.medication ? log.medication.dosage : '',
          scheduledTime: log.scheduledTime,
          date: log.date,
          scheduledDateTime: scheduledDateTime.getTime()
        });
      }
    });

    upcoming.sort((a, b) => a.scheduledDateTime - b.scheduledDateTime);

    if (upcoming.length < 5) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      for (const p of patientsList) {
        const tomorrowLogs = await syncMedicationLogsForRange(p.patientId, tomorrow, tomorrow);
        tomorrowLogs.forEach(log => {
          if (log.status !== 'Pending') return;
          const [hours, minutes] = log.scheduledTime.split(':').map(Number);
          const scheduledDateTime = new Date(tomorrow);
          scheduledDateTime.setHours(hours, minutes, 0, 0);
          upcoming.push({
            patientId: log.patientId,
            medicationId: log.medicationId,
            medicineName: log.medication ? log.medication.medicineName : 'Unknown',
            dosage: log.medication ? log.medication.dosage : '',
            scheduledTime: log.scheduledTime,
            date: log.date,
            scheduledDateTime: scheduledDateTime.getTime()
          });
        });
      }
    }

    upcoming.sort((a, b) => a.scheduledDateTime - b.scheduledDateTime);
    const upcomingFiltered = upcoming.slice(0, 10);

    const upcomingPatientIds = [...new Set(upcomingFiltered.map(u => u.patientId))];
    const upcomingPatientsInfo = await Patient.find({ patientId: { $in: upcomingPatientIds } });
    const upcomingPatientsMap = {};
    upcomingPatientsInfo.forEach(p => {
      upcomingPatientsMap[p.patientId] = p;
    });

    const upcomingMedicines = upcomingFiltered.map(u => {
      const pObj = upcomingPatientsMap[u.patientId];
      return {
        ...u,
        patientName: pObj ? pObj.name : 'Unknown Patient'
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPatients,
          activeMedications,
          todayScheduledDoses: total,
          takenDoses: taken,
          missedDoses: missed,
          overallAdherence
        },
        weeklyAdherence,
        statusCounts,
        missedTrend,
        recentActivity,
        upcomingMedicines
      }
    });
  } else {
    // Return patient-scoped data
    const patientId = req.query.patientId || req.headers['x-patient-id'] || 'P001';

    // 1. Sync & fetch today's logs
    const todayLogs = await syncMedicationLogsForRange(patientId, today, today);
    
    const total = todayLogs.length;
    const taken = todayLogs.filter(log => log.status === 'Taken').length;
    const missed = todayLogs.filter(log => log.status === 'Missed').length;
    const pending = todayLogs.filter(log => log.status === 'Pending').length;
    const skipped = todayLogs.filter(log => log.status === 'Skipped').length;
    const adherence = total > 0 ? Math.round((taken / total) * 100) : 100;

    // 2. Determine Next Upcoming Dose (Today or Tomorrow)
    let nextDose = null;
    const now = new Date();

    // Find first pending dose for the rest of today
    const pendingToday = todayLogs.filter(log => {
      if (log.status !== 'Pending') return false;
      const [hours, minutes] = log.scheduledTime.split(':').map(Number);
      const scheduledDateTime = new Date(today);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
      return scheduledDateTime > now;
    });

    if (pendingToday.length > 0) {
      const log = pendingToday[0];
      nextDose = {
        medicationId: log.medicationId,
        medicineName: log.medication ? log.medication.medicineName : 'Unknown',
        dosage: log.medication ? log.medication.dosage : '',
        scheduledTime: log.scheduledTime,
        date: log.date,
        scheduledDateTime: new Date(today).setHours(...log.scheduledTime.split(':').map(Number), 0, 0)
      };
    } else {
      // Look at tomorrow's logs
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowLogs = await syncMedicationLogsForRange(patientId, tomorrow, tomorrow);
      const pendingTomorrow = tomorrowLogs.filter(log => log.status === 'Pending');

      if (pendingTomorrow.length > 0) {
        const log = pendingTomorrow[0];
        nextDose = {
          medicationId: log.medicationId,
          medicineName: log.medication ? log.medication.medicineName : 'Unknown',
          dosage: log.medication ? log.medication.dosage : '',
          scheduledTime: log.scheduledTime,
          date: log.date,
          scheduledDateTime: new Date(tomorrow).setHours(...log.scheduledTime.split(':').map(Number), 0, 0)
        };
      }
    }

    // 3. Recent Activity (Last 5 log changes)
    const recentLogs = await MedicationLog.find({
      patientId,
      status: { $ne: 'Pending' }
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('medicationId');

    const recentActivity = recentLogs.map(log => ({
      _id: log._id,
      medicationId: log.medicationId ? log.medicationId._id : null,
      medicineName: log.medicationId ? log.medicationId.medicineName : 'Deleted Medication',
      dosage: log.medicationId ? log.medicationId.dosage : '',
      status: log.status,
      scheduledTime: log.scheduledTime,
      takenTime: log.takenTime,
      updatedAt: log.updatedAt,
      notes: log.notes
    }));

    // 4. Timeline Events Chronology
    const allMedications = await Medication.find({ patientId });
    const timelineEvents = [];

    allMedications.forEach(med => {
      // Treatment started event
      timelineEvents.push({
        type: 'medication_start',
        title: 'Treatment Started',
        description: `Started regimen of ${med.medicineName} (${med.dosage})`,
        time: med.startDate,
        medicationId: med._id,
        medicineName: med.medicineName
      });

      // Completed event
      if (new Date(med.endDate) < now) {
        timelineEvents.push({
          type: 'medication_end',
          title: 'Treatment Completed',
          description: `Completed regimen of ${med.medicineName}`,
          time: med.endDate,
          medicationId: med._id,
          medicineName: med.medicineName
        });
      }
    });

    // Get past logs to inject into timeline
    const pastLogs = await MedicationLog.find({
      patientId,
      status: { $in: ['Taken', 'Missed', 'Skipped'] }
    })
      .sort({ date: -1 })
      .limit(20)
      .populate('medicationId');

    pastLogs.forEach(log => {
      if (!log.medicationId) return;
      const eventTime = log.takenTime || new Date(new Date(log.date).setHours(...log.scheduledTime.split(':').map(Number), 0, 0));
      
      let title = `Dose ${log.status}`;
      if (log.status === 'Taken') title = 'Dose Taken';
      if (log.status === 'Missed') title = 'Dose Missed';
      if (log.status === 'Skipped') title = 'Dose Skipped';

      timelineEvents.push({
        type: `dose_${log.status.toLowerCase()}`,
        title,
        description: `${log.medicationId.medicineName} scheduled for ${log.scheduledTime}`,
        time: eventTime,
        medicationId: log.medicationId._id,
        medicineName: log.medicationId.medicineName,
        notes: log.notes
      });
    });

    // Sort timeline events: newest first
    timelineEvents.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Limit preview length
    const timelinePreview = timelineEvents.slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        todaySummary: {
          total,
          taken,
          missed,
          pending,
          skipped,
          adherence
        },
        nextDose,
        todayMedicines: todayLogs,
        recentActivity,
        timelineEvents: timelinePreview
      }
    });
  }
});

/**
 * @desc    Clear DB and Re-seed with multi-patient history data
 * @route   POST /api/dashboard/reset-seed
 * @access  Public
 */
const resetSeed = asyncHandler(async (req, res) => {
  await seedData(false);
  res.status(200).json({
    success: true,
    message: 'Database initialized and seeded successfully.'
  });
});

/**
 * @desc    Wipe all database records for a patient
 * @route   POST /api/dashboard/clear-all
 * @access  Public
 */
const clearAll = asyncHandler(async (req, res) => {
  const patientId = req.query.patientId || req.headers['x-patient-id'] || 'P001';
  
  await MedicationLog.deleteMany({ patientId });
  await Medication.deleteMany({ patientId });
  await Patient.deleteOne({ patientId });
  
  res.status(200).json({
    success: true,
    message: `All tracking history for patient ${patientId} has been wiped.`
  });
});

module.exports = {
  getDashboardData,
  resetSeed,
  clearAll
};
