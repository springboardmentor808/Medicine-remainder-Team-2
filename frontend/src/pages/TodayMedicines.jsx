import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Pill, 
  Search,
  ChevronRight,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/UI/Card';
import Spinner from '../components/UI/Spinner';

const TodayMedicines = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [doses, setDoses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, taken, pending, missed, skipped
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notesModal, setNotesModal] = useState({ open: false, log: null, noteText: '', status: '' });

  const fetchTodaySchedule = async () => {
    try {
      const res = await api.getDashboard();
      if (res && res.success) {
        setDoses(res.data.todayMedicines || []);
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaySchedule();
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleAction = async (medId, time, status, notes = '') => {
    try {
      const payload = {
        date: new Date().toISOString().split('T')[0],
        scheduledTime: time,
        notes
      };

      let res;
      if (status === 'Taken') {
        res = await api.markTaken(medId, payload);
      } else if (status === 'Missed') {
        res = await api.markMissed(medId, payload);
      } else if (status === 'Skipped') {
        res = await api.markSkipped(medId, payload);
      }

      if (res && res.success) {
        showToast(`Dose successfully logged as ${status}`, 'success');
        fetchTodaySchedule();
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const getRemainingTime = (scheduledTime) => {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date();
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    const diff = scheduledDateTime - currentTime;
    if (diff < 0) {
      // Overdue
      const overdueMins = Math.floor(Math.abs(diff) / (1000 * 60));
      if (overdueMins < 60) return `Overdue by ${overdueMins} mins`;
      return `Overdue by ${Math.floor(overdueMins / 60)} hrs`;
    }

    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 60) return `Due in ${mins} min${mins !== 1 ? 's' : ''}`;
    return `Due in ${Math.floor(mins / 60)} hr ${mins % 60} mins`;
  };

  // Filter in-memory
  const filteredDoses = doses.filter(dose => {
    // Search filter
    const nameMatch = dose.medication?.medicineName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Tab filter
    if (activeTab === 'all') return nameMatch;
    return nameMatch && dose.status.toLowerCase() === activeTab.toLowerCase();
  });

  const getTabCount = (tabName) => {
    if (tabName === 'all') return doses.length;
    return doses.filter(d => d.status.toLowerCase() === tabName.toLowerCase()).length;
  };

  if (loading) return <Spinner fullPage />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Today's Scheduled Regimen
          </h3>
          <p className="text-xs text-slate-400">
            Realtime checklist for <span className="font-semibold text-slate-700 dark:text-slate-350">{new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>
        <Link
          to="/medications/new"
          className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-glow-primary transition-all"
        >
          Add New Medication
        </Link>
      </div>

      {/* Control panel (Search & Tabs) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-darkbg-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md">
        
        {/* Search input */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 text-sm bg-white/70 dark:bg-darkbg-850 border border-slate-200 dark:border-slate-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-200"
            placeholder="Search today's medicine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tab List */}
        <div className="flex flex-wrap gap-1.5">
          {['all', 'pending', 'taken', 'missed', 'skipped'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5
                ${activeTab === tab 
                  ? 'bg-primary-500 text-white shadow-glow-primary' 
                  : 'bg-white/40 dark:bg-darkbg-900/30 text-slate-600 dark:text-slate-400 border border-slate-200/30 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-850'
                }
              `}
            >
              <span>{tab}</span>
              <span className={`px-1.5 py-0.5 text-[10px] rounded-md ${activeTab === tab ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                {getTabCount(tab)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid listing */}
      {filteredDoses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDoses.map((dose, index) => {
            const isTaken = dose.status === 'Taken';
            const isMissed = dose.status === 'Missed';
            const isSkipped = dose.status === 'Skipped';
            const isPending = dose.status === 'Pending';
            
            return (
              <Card key={index} className="flex flex-col justify-between border-l-4 border-l-slate-200 dark:border-l-slate-800"
                style={{
                  borderLeftColor: 
                    isTaken ? '#10b981' : 
                    isMissed ? '#ef4444' : 
                    isSkipped ? '#94a3b8' : '#f59e0b'
                }}
              >
                <div>
                  {/* Top time & badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-850 px-2.5 py-1 rounded-lg">
                      <Clock className="w-4 h-4 text-primary-500" /> {dose.scheduledTime}
                    </span>

                    {/* Status Badge */}
                    <span className={`
                      text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg
                      ${isTaken 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : isMissed 
                        ? 'bg-red-500/10 text-red-500' 
                        : isSkipped 
                        ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' 
                        : 'bg-amber-500/10 text-amber-500 animate-pulse'
                      }
                    `}>
                      {dose.status}
                    </span>
                  </div>

                  {/* Medicine core details */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl border flex-shrink-0
                      ${isTaken ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        isMissed ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        isSkipped ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400' :
                        'bg-amber-500/10 border-amber-500/20 text-amber-500'
                      }
                    `}>
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100">
                        {dose.medication?.medicineName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Dosage: <strong className="text-slate-700 dark:text-slate-350">{dose.medication?.dosage}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Instructions */}
                  {dose.medication?.instructions && (
                    <div className="mt-3 bg-slate-50 dark:bg-darkbg-900/60 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-850 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-primary-500 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {dose.medication.instructions}
                      </p>
                    </div>
                  )}

                  {/* Action logs */}
                  {isTaken && (
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-3 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Taken at {new Date(dose.takenTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}

                  {isSkipped && dose.notes && (
                    <div className="mt-3 bg-slate-100/50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200/20">
                      <p className="text-[11px] italic text-slate-400 dark:text-slate-500">
                        Reason: "{dose.notes}"
                      </p>
                    </div>
                  )}

                  {/* Countdown indicator */}
                  {isPending && (
                    <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-3 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" /> {getRemainingTime(dose.scheduledTime)}
                    </p>
                  )}
                </div>

                {/* Card Action footer bar */}
                <div className="mt-5 pt-3.5 border-t border-slate-200/40 dark:border-slate-850 flex items-center justify-between">
                  <Link
                    to={`/medications/${dose.medicationId}`}
                    className="text-xs font-bold text-slate-400 hover:text-primary-500 transition-colors flex items-center gap-0.5"
                  >
                    Details <ChevronRight className="w-4.5 h-4.5" />
                  </Link>

                  {isPending && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAction(dose.medicationId, dose.scheduledTime, 'Taken')}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow"
                      >
                        Mark Taken
                      </button>
                      <button
                        onClick={() => {
                          setNotesModal({ open: true, log: dose, noteText: '', status: 'Skipped' });
                        }}
                        className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-semibold transition-colors"
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => handleAction(dose.medicationId, dose.scheduledTime, 'Missed')}
                        className="px-2.5 py-1.5 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-colors"
                      >
                        Missed
                      </button>
                    </div>
                  )}

                  {!isPending && (
                    <button
                      onClick={() => {
                        // Undo action: delete log and revert status back to Pending
                        // We achieve this in MERN backend by changing status back to Pending, or simply deleting the log entry
                        // We will allow users to log again by reopening note model
                        setNotesModal({ open: true, log: dose, noteText: dose.notes || '', status: 'Taken' });
                      }}
                      className="text-[11px] font-bold text-slate-400 hover:text-primary-500 transition-colors"
                    >
                      Update Note/Status
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/20 dark:bg-darkbg-900/20 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
          <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h4 className="font-bold text-slate-700 dark:text-slate-350">No Doses Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            We couldn't find any medications matching your active filter. Check details or change your tab select.
          </p>
        </div>
      )}

      {/* Note modal */}
      {notesModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl mx-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Log Details for {notesModal.log?.medication?.medicineName}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select status or write notes below:
            </p>

            {/* Note text field */}
            <textarea
              className="w-full mt-4 p-3 border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl text-sm focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-200"
              rows="3"
              placeholder="Add intake observations (e.g. taken with orange juice)..."
              value={notesModal.noteText}
              onChange={(e) => setNotesModal(prev => ({ ...prev, noteText: e.target.value }))}
            />

            {/* Selection status buttons */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {['Taken', 'Skipped', 'Missed'].map(statusOption => (
                <button
                  key={statusOption}
                  type="button"
                  onClick={() => setNotesModal(prev => ({ ...prev, status: statusOption }))}
                  className={`
                    py-2 rounded-xl text-xs font-bold transition-all border
                    ${notesModal.status === statusOption
                      ? 'bg-primary-500 border-primary-500 text-white shadow'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-450'
                    }
                  `}
                >
                  {statusOption}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setNotesModal({ open: false, log: null, noteText: '', status: '' })}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleAction(
                    notesModal.log.medicationId,
                    notesModal.log.scheduledTime,
                    notesModal.status || 'Taken',
                    notesModal.noteText
                  );
                  setNotesModal({ open: false, log: null, noteText: '', status: '' });
                }}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                Log Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayMedicines;
