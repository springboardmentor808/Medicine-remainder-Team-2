const Medication = require('../models/Medication');
const { syncMedicationLogsForRange, normalizeDate } = require('../utils/logHelper');
const { asyncHandler } = require('../middleware/errorMiddleware');

/**
 * @desc    Get adherence percentages (daily, weekly, monthly, overall) for a patient
 * @route   GET /api/adherence
 * @access  Public
 */
const getAdherence = asyncHandler(async (req, res) => {
  const patientId = req.query.patientId || req.headers['x-patient-id'] || 'P001';
  
  const today = normalizeDate(new Date());

  // 1. Daily Adherence (Today only)
  const dailyLogs = await syncMedicationLogsForRange(patientId, today, today);
  const dailyScheduled = dailyLogs.length;
  const dailyTaken = dailyLogs.filter(log => log.status === 'Taken').length;
  const dailyAdherence = dailyScheduled > 0 ? Math.round((dailyTaken / dailyScheduled) * 100) : 100;

  // 2. Weekly Adherence (Trailing 7 days)
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 6);
  const weeklyLogs = await syncMedicationLogsForRange(patientId, oneWeekAgo, today);
  const weeklyScheduled = weeklyLogs.length;
  const weeklyTaken = weeklyLogs.filter(log => log.status === 'Taken').length;
  const weeklyAdherence = weeklyScheduled > 0 ? Math.round((weeklyTaken / weeklyScheduled) * 100) : 100;

  // 3. Monthly Adherence (Trailing 30 days)
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setDate(today.getDate() - 29);
  const monthlyLogs = await syncMedicationLogsForRange(patientId, oneMonthAgo, today);
  const monthlyScheduled = monthlyLogs.length;
  const monthlyTaken = monthlyLogs.filter(log => log.status === 'Taken').length;
  const monthlyAdherence = monthlyScheduled > 0 ? Math.round((monthlyTaken / monthlyScheduled) * 100) : 100;

  // 4. Overall Adherence
  // Find the oldest medication start date for this patient
  const oldestMed = await Medication.findOne({ patientId }).sort({ startDate: 1 });
  let overallStart = new Date(today);
  overallStart.setDate(today.getDate() - 89); // Default to trailing 90 days

  if (oldestMed && oldestMed.startDate) {
    const oldestStartNormalized = normalizeDate(oldestMed.startDate);
    if (oldestStartNormalized < today) {
      overallStart = oldestStartNormalized;
    }
  }

  const overallLogs = await syncMedicationLogsForRange(patientId, overallStart, today);
  const overallScheduled = overallLogs.length;
  const overallTaken = overallLogs.filter(log => log.status === 'Taken').length;
  const overallAdherence = overallScheduled > 0 ? Math.round((overallTaken / overallScheduled) * 100) : 100;

  res.status(200).json({
    success: true,
    data: {
      daily: dailyAdherence,
      weekly: weeklyAdherence,
      monthly: monthlyAdherence,
      overall: overallAdherence
    }
  });
});

module.exports = {
  getAdherence
};
