import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Heart, 
  Pill, 
  Activity, 
  Calendar, 
  GitCommit, 
  History, 
  ArrowLeft,
  Phone,
  FileText,
  AlertCircle,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/UI/Card';
import Spinner from '../components/UI/Spinner';

// Import adjusted tracking modules
import TodayMedicines from './TodayMedicines';
import Analytics from './Analytics';
import HistoryPage from './History';
import CalendarView from './CalendarView';
import TimelineView from './TimelineView';

const PatientProfile = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('daily'); // daily, analytics, history, calendar, timeline, meds
  const [medications, setMedications] = useState([]);
  const [medLoading, setMedLoading] = useState(false);

  const fetchPatientProfile = async () => {
    try {
      const res = await api.getPatientById(patientId);
      if (res && res.success) {
        setPatient(res.data);
      }
    } catch (e) {
      showToast(e.message, 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientMedications = async () => {
    setMedLoading(true);
    try {
      const res = await api.getMedications({ patientId });
      if (res && res.success) {
        setMedications(res.data || []);
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setMedLoading(false);
    }
  };

  useEffect(() => {
    // Set dynamic active patient ID in localStorage to keep API client in sync
    localStorage.setItem('medi-track-patient-id', patientId);
    fetchPatientProfile();
  }, [patientId]);

  useEffect(() => {
    if (activeTab === 'meds') {
      fetchPatientMedications();
    }
  }, [activeTab]);

  const handleDeleteMed = async (medId) => {
    if (!window.confirm('Are you sure you want to delete this medication configuration?')) {
      return;
    }
    try {
      const res = await api.deleteMedication(medId, patientId);
      if (res && res.success) {
        showToast('Medication deleted successfully', 'success');
        fetchPatientMedications();
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading) return <Spinner fullPage />;
  if (!patient) return null;

  const tabs = [
    { id: 'daily', name: 'Daily Intake Checklist', icon: Pill },
    { id: 'analytics', name: 'Adherence Analytics', icon: Activity },
    { id: 'history', name: 'Logs History', icon: History },
    { id: 'calendar', name: 'Calendar Tracker', icon: Calendar },
    { id: 'timeline', name: 'Treatment Timeline', icon: GitCommit },
    { id: 'meds', name: 'Medications List', icon: FileText }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-2">
        <Link 
          to="/"
          className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="text-xs text-slate-400 font-medium">
          Back to Patients Directory
        </span>
      </div>

      {/* Patient Medical Bio Banner */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200/50 dark:border-slate-800/50 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-glow-primary">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-850 dark:text-slate-100">
                  {patient.name}
                </h2>
                <span className="text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                  {patient.patientId}
                </span>
                <span className="text-[10px] font-extrabold uppercase bg-primary-500/10 text-primary-600 px-2 py-0.5 rounded">
                  Compliance: {patient.overallAdherence}%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Age/Gender: <strong>{patient.age} years / {patient.gender}</strong> • Chronic Condition: <strong>{patient.chronicDisease}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-darkbg-900 border border-slate-250/30 rounded-xl text-xs font-semibold">
              <span className="text-slate-400">Weight: </span>
              <strong className="text-slate-700 dark:text-slate-300">{patient.weight} kg</strong>
            </div>
            <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-darkbg-900 border border-slate-250/30 rounded-xl text-xs font-semibold">
              <span className="text-slate-400">Height: </span>
              <strong className="text-slate-700 dark:text-slate-300">{patient.height} cm</strong>
            </div>
            <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-darkbg-900 border border-slate-250/30 rounded-xl text-xs font-semibold">
              <span className="text-slate-400">Blood: </span>
              <strong className="text-slate-700 dark:text-slate-300">{patient.bloodGroup}</strong>
            </div>
          </div>
        </div>

        {/* Detailed Medical Information grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide">Mobile Contacts</p>
            <p className="font-semibold text-slate-880 dark:text-slate-200 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {patient.mobile}</p>
            <p className="text-[11px] text-slate-500">Emergency: {patient.emergencyContact}</p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide">Attending Physician</p>
            <p className="font-semibold text-slate-880 dark:text-slate-200">{patient.doctorName}</p>
            <p className="text-[11px] text-slate-500">Registered: {new Date(patient.registrationDate).toLocaleDateString()}</p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide">Allergies & Reactions</p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {patient.allergies.length > 0 ? (
                patient.allergies.map(a => (
                  <span key={a} className="bg-red-500/10 text-red-500 text-[10px] px-2 py-0.5 rounded font-bold">
                    {a}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">No allergies registered</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide">Residential Address</p>
            <p className="font-semibold text-slate-700 dark:text-slate-300 leading-normal truncate" title={patient.address}>
              {patient.address}
            </p>
          </div>
        </div>
      </Card>

      {/* Tab Select Bar */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-px scrollbar-none gap-2">
        {tabs.map(tab => {
          const ActiveIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wide uppercase border-b-2 transition-all flex-shrink-0
                ${isActive
                  ? 'border-primary-500 text-primary-500 dark:text-primary-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
                }
              `}
            >
              <ActiveIcon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab details routing panels */}
      <div className="animate-slide-in">
        {activeTab === 'daily' && (
          <TodayMedicines />
        )}
        
        {activeTab === 'analytics' && (
          <Analytics />
        )}

        {activeTab === 'history' && (
          <HistoryPage />
        )}

        {activeTab === 'calendar' && (
          <CalendarView />
        )}

        {activeTab === 'timeline' && (
          <TimelineView />
        )}

        {activeTab === 'meds' && (
          <Card>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-800/50">
              <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary-500" /> Prescribed Medications Regimen
              </h3>
              
              <Link
                to="/medications/new"
                className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Prescribe Medicine
              </Link>
            </div>

            {medLoading ? (
              <Spinner />
            ) : medications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medications.map((med, index) => (
                  <div key={index} className="p-4 bg-slate-50 dark:bg-darkbg-850 border border-slate-250/40 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-4 text-left">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">
                          {med.medicineName}
                        </h4>
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${med.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 text-slate-500'}`}>
                          {med.isActive ? 'Active' : 'Completed'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                        Dosage: <strong>{med.dosage}</strong> • Frequency: <strong>{med.frequency}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Scheduled: {med.scheduledTimes.join(', ')}
                      </p>

                      {med.instructions && (
                        <div className="mt-3 bg-white dark:bg-darkbg-900 border border-slate-200/20 p-2.5 rounded-xl flex gap-2">
                          <AlertCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                            {med.instructions}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-200/30 pt-3">
                      <Link
                        to={`/medications/${med._id}`}
                        className="text-xs text-slate-400 hover:text-primary-500 font-semibold px-2 py-1"
                      >
                        Profile
                      </Link>
                      <Link
                        to={`/medications/${med._id}/edit`}
                        className="px-3 py-1.5 border border-slate-250 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-405 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteMed(med._id)}
                        className="px-3 py-1.5 border border-red-200 dark:border-red-950/20 rounded-xl text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No medications currently prescribed for this patient. Click "Prescribe Medicine" to configure.
              </div>
            )}
          </Card>
        )}
      </div>

    </div>
  );
};

export default PatientProfile;
