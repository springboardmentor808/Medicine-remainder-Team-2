import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Pill, 
  Clock, 
  X,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/UI/Card';
import Spinner from '../components/UI/Spinner';

const HistoryPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Queries
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('week'); // day, week, month, year
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [logs, setLogs] = useState([]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getHistory({
        date,
        type,
        search,
        status,
        page,
        limit
      });
      if (res && res.success) {
        setLogs(res.data || []);
        setTotalPages(res.pagination.pages || 1);
        setTotalCount(res.pagination.total || 0);
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [date, type, status, page]);

  // Handle manual trigger for search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setType('week');
    setDate(new Date().toISOString().split('T')[0]);
    setPage(1);
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    if (logs.length === 0) {
      showToast('No logs available to export', 'warning');
      return;
    }

    const headers = ['Date', 'Scheduled Time', 'Medicine Name', 'Dosage', 'Status', 'Taken Time', 'Notes'];
    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const logDate = new Date(log.date).toISOString().split('T')[0];
      const name = log.medication ? log.medication.medicineName : 'Unknown';
      const dosage = log.medication ? log.medication.dosage : '';
      const takenTimeStr = log.takenTime ? new Date(log.takenTime).toLocaleTimeString() : '';
      const notesClean = log.notes ? log.notes.replace(/"/g, '""') : '';
      
      const row = [
        logDate,
        log.scheduledTime,
        `"${name}"`,
        `"${dosage}"`,
        log.status,
        takenTimeStr,
        `"${notesClean}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medication_history_${type}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Medication history exported to CSV!', 'success');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Historical Intake Records
          </h3>
          <p className="text-xs text-slate-400">
            Audit logs tracking medication compliance and scheduling metrics.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="self-start sm:self-center px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white/70 dark:bg-darkbg-900 hover:bg-slate-150 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-355 text-xs font-bold transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export Report (CSV)
        </button>
      </div>

      {/* Filter Control Box */}
      <Card>
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-450" />
              <input
                type="text"
                placeholder="Search medicine name..."
                className="w-full pl-10 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-650"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Date select */}
            <div className="relative">
              <Calendar className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-450" />
              <input
                type="date"
                className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-200"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Type frame selector */}
            <div>
              <select
                className="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-150"
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="day">Single Day</option>
                <option value="week">Trailing Week</option>
                <option value="month">Calendar Month</option>
                <option value="year">Calendar Year</option>
              </select>
            </div>

            {/* Status filters */}
            <div>
              <select
                className="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-150"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="Taken">Taken</option>
                <option value="Missed">Missed</option>
                <option value="Skipped">Skipped</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

          </div>

          <div className="flex items-center justify-between border-t border-slate-200/20 pt-3 flex-wrap gap-2 text-xs">
            <span className="text-slate-450">
              Found <strong className="text-slate-700 dark:text-slate-350">{totalCount}</strong> logs for this filter range.
            </span>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-slate-400 hover:text-slate-650 font-bold hover:underline"
              >
                Reset Filters
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold shadow"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </Card>

      {/* History table view */}
      <Card>
        {loading ? (
          <div className="py-12">
            <Spinner />
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3">Log Date</th>
                    <th className="py-3">Intake Time</th>
                    <th className="py-3">Medication Name</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Taken At</th>
                    <th className="py-3">Observation / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {logs.map((log, index) => {
                    const logDateStr = new Date(log.date).toLocaleDateString([], { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    });
                    
                    return (
                      <tr key={index} className="text-slate-700 dark:text-slate-250 hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                        <td className="py-3.5 font-semibold text-slate-850 dark:text-slate-200">{logDateStr}</td>
                        <td className="py-3.5 text-slate-500 font-medium">{log.scheduledTime}</td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 dark:text-slate-100">
                              {log.medication ? log.medication.medicineName : 'Unknown Medicine'}
                            </span>
                            <span className="text-slate-400">({log.medication ? log.medication.dosage : ''})</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className={`
                            text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg
                            ${log.status === 'Taken' ? 'bg-emerald-500/10 text-emerald-500' :
                              log.status === 'Missed' ? 'bg-red-500/10 text-red-500' :
                              log.status === 'Skipped' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                              'bg-amber-500/10 text-amber-500'
                            }
                          `}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-550">
                          {log.takenTime ? new Date(log.takenTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                        </td>
                        <td className="py-3.5 text-slate-400 dark:text-slate-500 italic max-w-xs truncate" title={log.notes}>
                          {log.notes || '--'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200/20 pt-4 text-xs font-semibold">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  className="px-3.5 py-2 border border-slate-250 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-40 transition-colors flex items-center gap-1 text-slate-600 dark:text-slate-400"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <span className="text-slate-400">
                  Page <strong className="text-slate-700 dark:text-slate-350">{page}</strong> of {totalPages}
                </span>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  className="px-3.5 py-2 border border-slate-250 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-40 transition-colors flex items-center gap-1 text-slate-600 dark:text-slate-400"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-750 mx-auto mb-4" />
            <h4 className="font-bold text-slate-700 dark:text-slate-350">No Historical Records</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              There are no log entries recorded in this range. Try modifying your filter conditions.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default HistoryPage;
