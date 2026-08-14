import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar,
  X,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/UI/Card';
import Spinner from '../components/UI/Spinner';

const CalendarView = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Store status calculations for each date in current month
  // Key: YYYY-MM-DD, Value: { status: 'taken'|'missed'|'partial'|'none', logs: [] }
  const [monthData, setMonthData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null); // { dateStr, data }

  const fetchMonthLogs = async () => {
    setLoading(true);
    try {
      // Find start and end date of the month
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const res = await api.getHistory({
        date: start.toISOString().split('T')[0],
        type: 'month',
        limit: 1000
      });

      if (res && res.success) {
        // Group logs by YYYY-MM-DD date string
        const logsByDate = {};
        
        // Populate all days of this month with 'none' initially
        const totalDays = end.getDate();
        for (let d = 1; d <= totalDays; d++) {
          const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
          const dateStr = dateObj.toISOString().split('T')[0];
          logsByDate[dateStr] = { status: 'none', logs: [] };
        }

        // Fill with actual logs
        res.data.forEach(log => {
          const logDateStr = new Date(log.date).toISOString().split('T')[0];
          if (logsByDate[logDateStr]) {
            logsByDate[logDateStr].logs.push(log);
          }
        });

        // Determine color code for each day
        Object.keys(logsByDate).forEach(dateStr => {
          const dayLogs = logsByDate[dateStr].logs;
          if (dayLogs.length === 0) {
            logsByDate[dateStr].status = 'none';
          } else {
            const takenCount = dayLogs.filter(l => l.status === 'Taken').length;
            const missedCount = dayLogs.filter(l => l.status === 'Missed').length;
            const totalCount = dayLogs.length;

            if (takenCount === totalCount) {
              logsByDate[dateStr].status = 'taken';
            } else if (missedCount === totalCount) {
              logsByDate[dateStr].status = 'missed';
            } else {
              logsByDate[dateStr].status = 'partial';
            }
          }
        });

        setMonthData(logsByDate);
        
        // If drawer is open, refresh selected date details
        if (selectedDate) {
          const dateStr = selectedDate.dateStr;
          setSelectedDate({
            dateStr,
            data: logsByDate[dateStr] || { status: 'none', logs: [] }
          });
        }
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthLogs();
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Generate calendar grid dates
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of current month
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    
    // Total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Total days in previous month
    const prevMonthDays = new Date(year, month, 0).getDate();

    const calendarGrid = [];

    // Fill previous month overflow padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      calendarGrid.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        dateStr: null
      });
    }

    // Fill current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      // Format as YYYY-MM-DD using timezone-safe method
      const offset = dateObj.getTimezoneOffset();
      const localDate = new Date(dateObj.getTime() - (offset*60*1000));
      const dateStr = localDate.toISOString().split('T')[0];

      calendarGrid.push({
        day: d,
        isCurrentMonth: true,
        dateStr
      });
    }

    // Fill next month overflow padding to align grid to multiples of 7
    const remainingSlots = 42 - calendarGrid.length;
    for (let n = 1; n <= remainingSlots; n++) {
      calendarGrid.push({
        day: n,
        isCurrentMonth: false,
        dateStr: null
      });
    }

    return calendarGrid;
  };

  const calendarDays = getCalendarDays();
  const monthName = currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' });

  // Update status for a clicked date log
  const handleUpdateLogStatus = async (medId, time, targetStatus) => {
    try {
      const payload = {
        date: selectedDate.dateStr,
        scheduledTime: time
      };

      let res;
      if (targetStatus === 'Taken') res = await api.markTaken(medId, payload);
      if (targetStatus === 'Missed') res = await api.markMissed(medId, payload);
      if (targetStatus === 'Skipped') res = await api.markSkipped(medId, payload);

      if (res && res.success) {
        showToast(`Log entry updated to ${targetStatus}`, 'success');
        fetchMonthLogs();
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          Monthly Adherence Calendar
        </h3>
        <p className="text-xs text-slate-400">
          Color-coded calendar grid summarizing daily compliance results. Click any date to audit details.
        </p>
      </div>

      {/* Color Code Legend */}
      <Card className="py-3 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-500" />
          <span className="text-slate-650 dark:text-slate-405">All Taken</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-red-500" />
          <span className="text-slate-650 dark:text-slate-405">All Missed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-amber-500" />
          <span className="text-slate-650 dark:text-slate-405">Partially Taken</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-slate-200 dark:bg-slate-800" />
          <span className="text-slate-650 dark:text-slate-405">No Schedule</span>
        </div>
      </Card>

      {/* Main Calendar Card container */}
      <Card className="p-0 overflow-hidden">
        {/* Month Navigation Banner */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-darkbg-900/30">
          <button
            onClick={handlePrevMonth}
            className="p-2 border border-slate-250 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            {monthName}
          </h4>

          <button
            onClick={handleNextMonth}
            className="p-2 border border-slate-250 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center py-2.5 bg-slate-100/50 dark:bg-darkbg-900/10 text-[10px] font-bold text-slate-400 dark:text-slate-500 border-b border-slate-200/20 uppercase tracking-widest">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Calendar days grid */}
        {loading ? (
          <div className="py-24">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/35 dark:divide-slate-800/30 border-t border-l border-slate-200/20 dark:border-slate-800/20">
            {calendarDays.map((cell, index) => {
              const dateInfo = cell.dateStr ? monthData[cell.dateStr] : null;
              const cellStatus = dateInfo ? dateInfo.status : 'none';
              
              let bgClass = 'bg-white dark:bg-darkbg-900 text-slate-900 dark:text-slate-200';
              if (!cell.isCurrentMonth) {
                bgClass = 'bg-slate-50/50 dark:bg-darkbg-950/20 text-slate-350 dark:text-slate-700 pointer-events-none';
              } else if (cellStatus === 'taken') {
                bgClass = 'calendar-tile-taken cursor-pointer';
              } else if (cellStatus === 'missed') {
                bgClass = 'calendar-tile-missed cursor-pointer';
              } else if (cellStatus === 'partial') {
                bgClass = 'calendar-tile-partial cursor-pointer';
              } else {
                bgClass = 'calendar-tile-none cursor-pointer';
              }

              const isSelected = selectedDate?.dateStr === cell.dateStr && cell.isCurrentMonth;

              return (
                <div
                  key={index}
                  onClick={() => {
                    if (cell.isCurrentMonth) {
                      setSelectedDate({
                        dateStr: cell.dateStr,
                        data: dateInfo || { status: 'none', logs: [] }
                      });
                    }
                  }}
                  className={`
                    h-20 sm:h-24 p-2 flex flex-col justify-between transition-all relative
                    ${bgClass}
                    ${isSelected ? 'ring-2 ring-primary-500 ring-inset z-10' : ''}
                  `}
                >
                  <span className="text-xs font-bold leading-none">{cell.day}</span>
                  {cell.isCurrentMonth && dateInfo && dateInfo.logs.length > 0 && (
                    <div className="flex flex-col gap-0.5 mt-1 overflow-hidden">
                      <span className="text-[8px] font-medium leading-none truncate block opacity-70">
                        {dateInfo.logs.filter(l => l.status === 'Taken').length}/{dateInfo.logs.length} Taken
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Slide-over details drawer for selected date */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-white dark:bg-darkbg-900 shadow-2xl p-6 flex flex-col justify-between animate-slide-in relative border-l border-slate-200 dark:border-slate-800">
            
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
                <div>
                  <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                    <Calendar className="w-5 h-5 text-primary-500" /> Logs Audit Detail
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wide">
                    {new Date(selectedDate.dateStr).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Doses scheduled on clicked day list */}
              <div className="mt-6 space-y-4 overflow-y-auto max-h-[70vh] pr-1 custom-scrollbar">
                {selectedDate.data.logs.length > 0 ? (
                  selectedDate.data.logs.map((log, index) => {
                    const isTaken = log.status === 'Taken';
                    const isMissed = log.status === 'Missed';
                    const isSkipped = log.status === 'Skipped';
                    return (
                      <div key={index} className="p-4 bg-slate-50 dark:bg-darkbg-850 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex flex-col justify-between gap-3 text-left">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/30 text-primary-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Clock className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {log.medication ? log.medication.medicineName : 'Unknown'}
                              </h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Scheduled: <strong className="text-slate-650 dark:text-slate-350">{log.scheduledTime}</strong> ({log.medication ? log.medication.dosage : ''})
                              </p>
                            </div>
                          </div>

                          <span className={`
                            text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded
                            ${isTaken ? 'bg-emerald-500/10 text-emerald-500' :
                              isMissed ? 'bg-red-500/10 text-red-500' :
                              isSkipped ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' :
                              'bg-amber-500/10 text-amber-500'
                            }
                          `}>
                            {log.status}
                          </span>
                        </div>

                        {log.takenTime && (
                          <p className="text-[10px] text-slate-450 dark:text-slate-450 italic">
                            Logged Intake at {new Date(log.takenTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                        
                        {log.notes && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic bg-white dark:bg-darkbg-900 border border-slate-200/20 p-1.5 rounded-lg">
                            "{log.notes}"
                          </p>
                        )}

                        {/* Audit corrections buttons */}
                        <div className="flex items-center justify-end gap-1.5 border-t border-slate-200/30 pt-2">
                          <button
                            disabled={isTaken}
                            onClick={() => handleUpdateLogStatus(log.medicationId, log.scheduledTime, 'Taken')}
                            className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold disabled:opacity-40 shadow-sm"
                          >
                            Mark Taken
                          </button>
                          <button
                            disabled={isMissed}
                            onClick={() => handleUpdateLogStatus(log.medicationId, log.scheduledTime, 'Missed')}
                            className="px-2.5 py-1 rounded bg-red-500 hover:bg-red-650 text-white text-[10px] font-bold disabled:opacity-40 shadow-sm"
                          >
                            Mark Missed
                          </button>
                          <button
                            disabled={isSkipped}
                            onClick={() => handleUpdateLogStatus(log.medicationId, log.scheduledTime, 'Skipped')}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-405 text-[10px] font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 bg-slate-50 dark:bg-darkbg-850 rounded-2xl border border-slate-200/50 dark:border-slate-800 text-slate-400 text-xs">
                    No medications scheduled for this date.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 flex-shrink-0">
              <button
                onClick={() => setSelectedDate(null)}
                className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                Close Audit panel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
