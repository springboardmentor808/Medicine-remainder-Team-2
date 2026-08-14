const { syncMedicationLogsForRange, normalizeDate } = require('../utils/logHelper');
const { asyncHandler } = require('../middleware/errorMiddleware');

/**
 * @desc    Get medication history logs with filters (day, week, month, year) for a patient
 * @route   GET /api/history
 * @access  Public
 */
const getHistory = asyncHandler(async (req, res) => {
  const patientId = req.query.patientId || req.headers['x-patient-id'] || 'P001';
  
  const baseDateVal = req.query.date ? new Date(req.query.date) : new Date();
  const type = req.query.type || 'day'; // day, week, month, year
  const search = req.query.search ? String(req.query.search).trim() : '';
  const status = req.query.status || '';
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  let start = new Date(baseDateVal);
  let end = new Date(baseDateVal);

  // Normalize hours to avoid offset issues
  start = normalizeDate(start);
  end = normalizeDate(end);

  if (type === 'day') {
    // Single day
  } else if (type === 'week') {
    // Trailing 7 days (including baseDateVal)
    start.setDate(end.getDate() - 6);
  } else if (type === 'month') {
    // Full calendar month
    start.setDate(1);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0); // Last day of month
  } else if (type === 'year') {
    // Full calendar year
    start.setMonth(0, 1); // Jan 1st
    end.setMonth(11, 31); // Dec 31st
  } else {
    res.status(400);
    throw new Error('Invalid history type filter. Supported: day, week, month, year');
  }

  // Fetch and sync logs in range for this specific patient
  let logs = await syncMedicationLogsForRange(patientId, start, end);

  // Apply in-memory search and status filters
  let filteredLogs = [...logs];
  
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filteredLogs = filteredLogs.filter(log => 
      log.medication && searchRegex.test(log.medication.medicineName)
    );
  }

  if (status) {
    filteredLogs = filteredLogs.filter(log => 
      log.status.toLowerCase() === status.toLowerCase()
    );
  }

  // Reverse logs to show the most recent first
  filteredLogs.reverse();

  // Paginate logs
  const total = filteredLogs.length;
  const startIndex = (page - 1) * limit;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + limit);

  res.status(200).json({
    success: true,
    range: {
      type,
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    },
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: paginatedLogs
  });
});

module.exports = {
  getHistory
};
