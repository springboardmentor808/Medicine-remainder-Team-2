import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Pill, 
  Clock, 
  Calendar, 
  Trash2, 
  Edit3, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/UI/Card';
import Spinner from '../components/UI/Spinner';

const MedicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [medication, setMedication] = useState(null);
  const [logs, setLogs] = useState([]);
  const [adherence, setAdherence] = useState(100);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const loadData = async () => {
    try {
      const medRes = await api.getMedicationById(id);
      if (medRes && medRes.success) {
        setMedication(medRes.data);
        
        // Fetch logs for this medication specifically
        // To compute this medication's specific adherence, we fetch all logs in history filtered by this medication
        const logsRes = await api.getHistory({ limit: 1000 }); // fetch range logs
        if (logsRes && logsRes.success) {
          const filteredLogs = logsRes.data.filter(log => log.medicationId === id);
          setLogs(filteredLogs);

          // Calculate adherence specifically for this medication
          const activeLogs = filteredLogs.filter(l => l.status !== 'Pending');
          const totalScheduled = activeLogs.length;
          const taken = activeLogs.filter(l => l.status === 'Taken').length;
          const percentage = totalScheduled > 0 ? Math.round((taken / totalScheduled) * 100) : 100;
          setAdherence(percentage);
        }
      }
    } catch (e) {
      showToast(e.message, 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDelete = async () => {
    try {
      const res = await api.deleteMedication(id);
      if (res && res.success) {
        showToast('Medication and all history logs deleted successfully.', 'success');
        navigate('/');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const getFrequencyLabel = (freq) => {
    switch (freq) {
      case 'daily': return 'Every Single Day';
      case 'alternate_days': return 'Every Other Day';
      case 'specific_days': return 'Specific Weekdays';
      case 'weekly': return 'Once per Week';
      default: return freq;
    }
  };

  if (loading) return <Spinner fullPage />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top back routing bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link 
            to="/"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-xs text-slate-400 font-medium">
            Back to Dashboard
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/medications/${id}/edit`}
            className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-600 dark:text-slate-400 hover:text-primary-500 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <Edit3 className="w-4 h-4" /> Edit Regimen
          </Link>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="p-2 border border-red-200 dark:border-red-950/40 hover:bg-red-500/10 rounded-xl text-red-500 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <Trash2 className="w-4 h-4" /> Delete Regimen
          </button>
        </div>
      </div>

      {/* Main split details view */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core Medication Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-950/40 rounded-2xl text-primary-500">
                <Pill className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {medication.medicineName}
                  </h3>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md ${medication.isActive ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {medication.isActive ? 'Active' : 'Completed/Paused'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dosage: <strong className="text-slate-700 dark:text-slate-300">{medication.dosage}</strong>
                </p>
              </div>
            </div>

            {/* Info details grid */}
            <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-slate-50 dark:bg-darkbg-900 rounded-2xl border border-slate-200/50 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Frequency Regimen
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-250 mt-0.5">
                  {getFrequencyLabel(medication.frequency)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Intake Times per Day
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-250 mt-0.5">
                  {medication.timesPerDay} intake{medication.timesPerDay !== 1 ? 's' : ''} daily
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Schedule Hours
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-250 mt-0.5">
                  {medication.scheduledTimes.join(', ')}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Active Duration
                </p>
                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-250 mt-0.5">
                  {new Date(medication.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(medication.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Instructions */}
            {medication.instructions && (
              <div className="mt-6">
                <h4 className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Special Instructions
                </h4>
                <div className="bg-slate-50 dark:bg-darkbg-900/60 p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    {medication.instructions}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Adherence Card */}
        <div>
          <Card className="text-center flex flex-col justify-between h-full">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Medication Adherence
              </p>
              <h4 className="text-4xl font-black text-slate-800 dark:text-slate-100 mt-2">
                {adherence}%
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Based on past scheduled doses
              </p>
            </div>

            <div className="my-6 flex justify-center">
              <div className="p-4 bg-primary-50 dark:bg-primary-950/20 rounded-full text-primary-500">
                <TrendingUp className="w-10 h-10" />
              </div>
            </div>

            <div className="text-xs text-slate-400 dark:text-slate-500 space-y-1 bg-slate-50 dark:bg-darkbg-900 p-3 rounded-2xl border border-slate-250/20">
              <div className="flex justify-between">
                <span>Total Recorded:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{logs.length} doses</span>
              </div>
              <div className="flex justify-between">
                <span>Taken Successfully:</span>
                <span className="font-bold text-emerald-500">{logs.filter(l => l.status === 'Taken').length} doses</span>
              </div>
              <div className="flex justify-between">
                <span>Missed Doses:</span>
                <span className="font-bold text-red-500">{logs.filter(l => l.status === 'Missed').length} doses</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Medication-specific Log history table */}
      <Card>
        <h3 className="font-bold text-slate-850 dark:text-slate-105 mb-4 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
          Medication Intake Log History
        </h3>

        {logs.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-450 uppercase font-bold tracking-wider">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Scheduled</th>
                  <th className="py-2.5">Logged Status</th>
                  <th className="py-2.5">Taken Timestamp</th>
                  <th className="py-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
                {logs.slice(0, 15).map((log, index) => {
                  const logDate = new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <tr key={index} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3 font-semibold">{logDate}</td>
                      <td className="py-3 font-medium text-slate-500">{log.scheduledTime}</td>
                      <td className="py-3">
                        <span className={`
                          text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded
                          ${log.status === 'Taken' ? 'bg-emerald-500/10 text-emerald-500' :
                            log.status === 'Missed' ? 'bg-red-500/10 text-red-500' :
                            'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }
                        `}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">
                        {log.takenTime ? new Date(log.takenTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td className="py-3 text-slate-400 dark:text-slate-500 italic max-w-xs truncate" title={log.notes}>
                        {log.notes || '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {logs.length > 15 && (
              <p className="text-[10px] text-slate-450 text-center mt-3 italic">
                Showing top 15 log entries. Use History Logs Page to view full listings.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 italic">
            No history logs recorded for this medication.
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl mx-4">
            <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" /> Delete Medication Regimen?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-700 dark:text-slate-350">{medication.medicineName}</strong>? 
              This action is permanent and will delete the schedule configuration along with all associated historical dose tracking logs.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-slate-250 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              >
                Keep Medication
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                Delete regimine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationDetail;
