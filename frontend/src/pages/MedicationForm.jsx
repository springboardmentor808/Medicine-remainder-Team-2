import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Pill, 
  Calendar, 
  Clock, 
  Trash2, 
  Plus, 
  Save, 
  ArrowLeft,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/UI/Card';
import Spinner from '../components/UI/Spinner';

const MedicationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  
  // Form fields
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [specificDays, setSpecificDays] = useState([]); // Array of numbers: 0=Sun, 1=Mon, etc.
  const [scheduledTimes, setScheduledTimes] = useState(['08:00']);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 30);
    return defaultEnd.toISOString().split('T')[0];
  });
  const [instructions, setInstructions] = useState('');
  const [isActive, setIsActive] = useState(true);

  const weekdays = [
    { label: 'S', value: 0, fullName: 'Sunday' },
    { label: 'M', value: 1, fullName: 'Monday' },
    { label: 'T', value: 2, fullName: 'Tuesday' },
    { label: 'W', value: 3, fullName: 'Wednesday' },
    { label: 'T', value: 4, fullName: 'Thursday' },
    { label: 'F', value: 5, fullName: 'Friday' },
    { label: 'S', value: 6, fullName: 'Saturday' },
  ];

  useEffect(() => {
    if (isEditMode) {
      const loadMedication = async () => {
        try {
          const res = await api.getMedicationById(id);
          if (res && res.success) {
            const med = res.data;
            setMedicineName(med.medicineName);
            setDosage(med.dosage);
            setFrequency(med.frequency);
            setSpecificDays(med.specificDays || []);
            setScheduledTimes(med.scheduledTimes || ['08:00']);
            setStartDate(new Date(med.startDate).toISOString().split('T')[0]);
            setEndDate(new Date(med.endDate).toISOString().split('T')[0]);
            setInstructions(med.instructions || '');
            setIsActive(med.isActive);
          }
        } catch (e) {
          showToast(e.message, 'error');
          navigate('/');
        } finally {
          setFetchingData(false);
        }
      };
      loadMedication();
    }
  }, [id, isEditMode]);

  // Handle schedule times add/remove
  const handleAddTimeSlot = () => {
    setScheduledTimes(prev => [...prev, '08:00']);
  };

  const handleRemoveTimeSlot = (index) => {
    if (scheduledTimes.length === 1) {
      showToast('At least one scheduled intake time is required', 'warning');
      return;
    }
    setScheduledTimes(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleTimeChange = (index, value) => {
    setScheduledTimes(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  // Handle specific day toggle
  const handleDayToggle = (dayVal) => {
    setSpecificDays(prev => {
      if (prev.includes(dayVal)) {
        return prev.filter(d => d !== dayVal);
      } else {
        return [...prev, dayVal].sort();
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!medicineName.trim()) {
      showToast('Medicine name is required', 'warning');
      return;
    }
    if (!dosage.trim()) {
      showToast('Dosage (e.g. 1 pill) is required', 'warning');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      showToast('End date cannot be earlier than start date', 'warning');
      return;
    }
    if ((frequency === 'specific_days' || frequency === 'weekly') && specificDays.length === 0) {
      showToast('Please select at least one day of the week', 'warning');
      return;
    }

    setLoading(true);

    const payload = {
      medicineName,
      dosage,
      frequency,
      specificDays: (frequency === 'specific_days' || frequency === 'weekly') ? specificDays : [],
      timesPerDay: scheduledTimes.length,
      scheduledTimes,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      instructions,
      isActive
    };

    try {
      let res;
      if (isEditMode) {
        res = await api.updateMedication(id, payload);
      } else {
        res = await api.createMedication(payload);
      }

      if (res && res.success) {
        showToast(
          `Medication ${isEditMode ? 'updated' : 'created'} successfully!`,
          'success'
        );
        navigate('/');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) return <Spinner fullPage />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Top back routing bar */}
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

      <Card>
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="p-2.5 bg-primary-100 dark:bg-primary-950/40 rounded-xl text-primary-500">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {isEditMode ? 'Edit Medication Regimen' : 'Add New Medication'}
            </h3>
            <p className="text-xs text-slate-400">
              {isEditMode ? 'Modify medication details and update schedules.' : 'Configure a new prescription schedule.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          
          {/* Active switch (Only in edit mode) */}
          {isEditMode && (
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-darkbg-900 rounded-2xl border border-slate-250/50 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Active Status
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Disable to temporarily halt scheduled dose reminders.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`
                  w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none
                  ${isActive ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'}
                `}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          )}

          {/* Medicine Name and Dosage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wide">
                Medicine Name *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
                placeholder="e.g. Metformin"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wide">
                Dosage Amount *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
                placeholder="e.g. 500 mg, 1 tablet, 10 ml"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
              />
            </div>
          </div>

          {/* Frequency & Weekdays Select */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wide">
                  Frequency Regimen *
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-150"
                  value={frequency}
                  onChange={(e) => {
                    setFrequency(e.target.value);
                    if (e.target.value === 'daily' || e.target.value === 'alternate_days') {
                      setSpecificDays([]);
                    }
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="alternate_days">Alternate Days</option>
                  <option value="specific_days">Specific Weekdays</option>
                  <option value="weekly">Once Weekly</option>
                </select>
              </div>
              
              <div className="self-end pb-2">
                <p className="text-[11px] text-slate-400 flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <span>
                    {frequency === 'daily' && 'Reminders trigger every day.'}
                    {frequency === 'alternate_days' && 'Reminders trigger every other day (every 2 days).'}
                    {frequency === 'specific_days' && 'Select weekdays you want to take it.'}
                    {frequency === 'weekly' && 'Reminders trigger on the selected day once a week.'}
                  </span>
                </p>
              </div>
            </div>

            {/* Days picker when frequency is specific_days or weekly */}
            {(frequency === 'specific_days' || frequency === 'weekly') && (
              <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-darkbg-900 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">
                  Select Days of Week *
                </label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {weekdays.map(day => {
                    const isSelected = specificDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`
                          w-9 h-9 rounded-xl text-xs font-extrabold flex items-center justify-center border transition-all
                          ${isSelected
                            ? 'bg-primary-500 border-primary-500 text-white shadow-glow-primary'
                            : 'bg-white dark:bg-darkbg-850 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-primary-500'
                          }
                        `}
                        title={day.fullName}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Intake Schedule Times List */}
          <div className="space-y-2 p-4 bg-slate-50 dark:bg-darkbg-900 rounded-2xl border border-slate-200/50 dark:border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-250/20">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary-500" /> Intake Times *
              </label>
              
              <button
                type="button"
                onClick={handleAddTimeSlot}
                className="text-xs text-primary-500 hover:text-primary-600 font-bold flex items-center gap-0.5"
              >
                <Plus className="w-4 h-4" /> Add Time
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {scheduledTimes.map((time, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-darkbg-850 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800 relative">
                  <input
                    type="time"
                    required
                    className="w-full bg-transparent text-sm border-none focus:outline-none dark:text-slate-200"
                    value={time}
                    onChange={(e) => handleTimeChange(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTimeSlot(idx)}
                    className="text-slate-400 hover:text-red-500 p-1"
                    title="Remove slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Date range selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-4 h-4 text-primary-500" /> Regimen Start Date *
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-4 h-4 text-primary-500" /> Regimen End Date *
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Special instructions */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wide">
              Special Instructions (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
              rows="3"
              placeholder="e.g. Take with food, avoid drinking alcohol, keep refrigerated..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-glow-primary transition-all"
            >
              {loading ? (
                <div className="w-4.5 h-4.5 border-2 border-t-white border-slate-300 rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4.5 h-4.5" />
                  <span>{isEditMode ? 'Save Regimen' : 'Create Regimen'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </Card>
    </div>
  );
};

export default MedicationForm;
