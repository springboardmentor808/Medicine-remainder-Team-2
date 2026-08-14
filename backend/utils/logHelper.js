const Medication = require('../models/Medication');
const MedicationLog = require('../models/MedicationLog');

/**
 * Normalizes a date to midnight local time.
 */
const normalizeDate = (dateInput) => {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Checks if a medication is active and scheduled on a specific date.
 */
const isMedicationActiveOnDate = (medication, date) => {
  const queryDate = normalizeDate(date);
  const start = normalizeDate(medication.startDate);
  const end = normalizeDate(medication.endDate);

  // Date range check
  if (queryDate < start || queryDate > end) {
    return false;
  }

  if (!medication.isActive) {
    return false;
  }

  const dayOfWeek = queryDate.getDay(); // 0 is Sunday, 1 is Monday, etc.

  switch (medication.frequency) {
    case 'daily':
      return true;

    case 'alternate_days': {
      const diffTime = queryDate.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays % 2 === 0;
    }

    case 'specific_days':
      return Array.isArray(medication.specificDays) && medication.specificDays.includes(dayOfWeek);

    case 'weekly':
      if (Array.isArray(medication.specificDays) && medication.specificDays.length > 0) {
        return medication.specificDays.includes(dayOfWeek);
      }
      return dayOfWeek === start.getDay();

    default:
      return false;
  }
};

/**
 * Checks all active medications for a user on a given date,
 * and creates "Missed" logs for any scheduled times that have already passed
 * if no log exists.
 * Returns both existing logs and virtual logs for future times.
 */
const syncMedicationLogsForDate = async (patientId, dateInput) => {
  const date = normalizeDate(dateInput);
  
  // Find all medications for this patient
  const medications = await Medication.find({ patientId });
  
  // Filter active ones for this date
  const activeMedications = medications.filter(med => isMedicationActiveOnDate(med, date));
  
  // Get all existing logs for this patient on this date
  const dateStart = new Date(date);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);
  
  const existingLogs = await MedicationLog.find({
    patientId,
    date: { $gte: dateStart, $lte: dateEnd }
  });

  const logsMap = new Map();
  existingLogs.forEach(log => {
    logsMap.set(`${log.medicationId.toString()}_${log.scheduledTime}`, log);
  });

  const now = new Date();
  const syncedLogs = [];

  for (const med of activeMedications) {
    for (const time of med.scheduledTimes) {
      const key = `${med._id.toString()}_${time}`;
      let log = logsMap.get(key);

      // Construct a Date object representing the scheduled dose time
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledDateTime = new Date(date);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const isPast = scheduledDateTime < now;

      if (!log) {
        if (isPast) {
          // Time has passed and no log was recorded: mark as Missed
          log = await MedicationLog.create({
            patientId,
            medicationId: med._id,
            scheduledTime: time,
            status: 'Missed',
            date: date,
            notes: 'Automatically marked missed by system'
          });
          logsMap.set(key, log);
        } else {
          // Future dose: return a virtual Pending log
          log = {
            medicationId: med._id,
            scheduledTime: time,
            status: 'Pending',
            date: date,
            virtual: true
          };
        }
      }
      
      // Inject medication information for the frontend view
      const logObj = log.toObject ? log.toObject() : { ...log };
      logObj.medication = med;
      syncedLogs.push(logObj);
    }
  }

  // Sort logs chronologically by scheduled time
  syncedLogs.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  return syncedLogs;
};

/**
 * Syncs and returns logs for a date range. It runs optimized queries and bulk insert
 * for missed logs, then resolves virtual pending logs.
 */
const syncMedicationLogsForRange = async (patientId, startRange, endRange) => {
  const start = normalizeDate(startRange);
  const end = normalizeDate(endRange);
  
  // Get all medications
  const medications = await Medication.find({ patientId });
  
  // Get existing logs in this range
  const logs = await MedicationLog.find({
    patientId,
    date: { $gte: start, $lte: end }
  });
  
  const logsMap = new Map();
  logs.forEach(log => {
    const dateStr = log.date.toISOString().split('T')[0];
    logsMap.set(`${log.medicationId.toString()}_${dateStr}_${log.scheduledTime}`, log);
  });
  
  const now = new Date();
  const logsToCreate = [];
  const allLogs = [];
  
  // Loop through each day in the range
  let current = new Date(start);
  while (current <= end) {
    const currentStr = current.toISOString().split('T')[0];
    const activeMeds = medications.filter(med => isMedicationActiveOnDate(med, current));
    
    for (const med of activeMeds) {
      for (const time of med.scheduledTimes) {
        const key = `${med._id.toString()}_${currentStr}_${time}`;
        let log = logsMap.get(key);
        
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledDateTime = new Date(current);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
        
        const isPast = scheduledDateTime < now;
        
        if (!log) {
          if (isPast) {
            logsToCreate.push({
              patientId,
              medicationId: med._id,
              scheduledTime: time,
              status: 'Missed',
              date: new Date(current),
              notes: 'Automatically marked missed by range sync'
            });
          } else {
            // Virtual pending log
            allLogs.push({
              medicationId: med._id,
              scheduledTime: time,
              status: 'Pending',
              date: new Date(current),
              virtual: true,
              medication: med
            });
          }
        } else {
          const logObj = log.toObject ? log.toObject() : { ...log };
          logObj.medication = med;
          allLogs.push(logObj);
        }
      }
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  // Bulk insert new missed logs
  if (logsToCreate.length > 0) {
    try {
      const createdLogs = await MedicationLog.insertMany(logsToCreate, { ordered: false });
      createdLogs.forEach(log => {
        const logObj = log.toObject();
        logObj.medication = medications.find(m => m._id.toString() === log.medicationId.toString());
        allLogs.push(logObj);
      });
    } catch (err) {
      // Query again to resolve any duplicates and capture successfully written records
      const savedLogs = await MedicationLog.find({
        patientId,
        date: { $gte: start, $lte: end }
      });
      
      const refreshedLogsMap = new Map();
      savedLogs.forEach(log => {
        const dateStr = log.date.toISOString().split('T')[0];
        refreshedLogsMap.set(`${log.medicationId.toString()}_${dateStr}_${log.scheduledTime}`, log);
      });
      
      allLogs.length = 0;
      
      let currentRe = new Date(start);
      while (currentRe <= end) {
        const currentStr = currentRe.toISOString().split('T')[0];
        const activeMeds = medications.filter(med => isMedicationActiveOnDate(med, currentRe));
        
        for (const med of activeMeds) {
          for (const time of med.scheduledTimes) {
            const key = `${med._id.toString()}_${currentStr}_${time}`;
            let log = refreshedLogsMap.get(key);
            
            if (!log) {
              allLogs.push({
                medicationId: med._id,
                scheduledTime: time,
                status: 'Pending',
                date: new Date(currentRe),
                virtual: true,
                medication: med
              });
            } else {
              const logObj = log.toObject ? log.toObject() : { ...log };
              logObj.medication = med;
              allLogs.push(logObj);
            }
          }
        }
        currentRe.setDate(currentRe.getDate() + 1);
      }
    }
  }
  
  // Sort all logs chronologically
  allLogs.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });
  
  return allLogs;
};

module.exports = {
  normalizeDate,
  isMedicationActiveOnDate,
  syncMedicationLogsForDate,
  syncMedicationLogsForRange
};
