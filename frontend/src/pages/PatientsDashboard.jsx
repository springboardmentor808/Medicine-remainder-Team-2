import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  UserPlus, 
  Activity, 
  ShieldAlert, 
  TrendingUp, 
  Calendar,
  Users,
  Award,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/UI/Card';
import Spinner from '../components/UI/Spinner';
import AddPatientModal from '../components/AddPatientModal';

const PatientsDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Filters & Controls
  const [search, setSearch] = useState('');
  const [disease, setDisease] = useState('All');
  const [complianceFilter, setComplianceFilter] = useState('All'); // All, High (>90), Moderate (80-90), Low (<80)
  const [sortBy, setSortBy] = useState('name'); // name, overallAdherence, lastUpdated
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, pages: 1 });

  // Clinic wide KPIs
  const [kpis, setKpis] = useState({ totalPatients: 0, avgAdherence: 100, atRiskCount: 0 });

  const fetchPatientsList = async () => {
    setLoading(true);
    try {
      // Compliance range parameters mapping
      let minAdherence = 0;
      let maxAdherence = 100;
      if (complianceFilter === 'high') {
        minAdherence = 90;
      } else if (complianceFilter === 'moderate') {
        minAdherence = 80;
        maxAdherence = 89;
      } else if (complianceFilter === 'low') {
        maxAdherence = 79;
      }

      const res = await api.getPatients({
        search,
        disease,
        minAdherence,
        maxAdherence,
        sortBy,
        sortOrder,
        page,
        limit
      });

      if (res && res.success) {
        setPatients(res.data || []);
        setPagination(res.pagination);

        // Fetch all patients for KPI aggregation
        const allRes = await api.getPatients({ limit: 1000 });
        if (allRes && allRes.success) {
          const list = allRes.data || [];
          const total = list.length;
          const sumAdherence = list.reduce((acc, curr) => acc + curr.overallAdherence, 0);
          const avg = total > 0 ? Math.round(sumAdherence / total) : 100;
          const atRisk = list.filter(p => p.overallAdherence < 80).length;

          setKpis({
            totalPatients: total,
            avgAdherence: avg,
            atRiskCount: atRisk
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
    fetchPatientsList();
  }, [disease, complianceFilter, sortBy, sortOrder, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPatientsList();
  };

  const handleToggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const diseasesList = [
    'All', 'Asthma', 'Migraine', 'Diabetes Type 2', 
    'Hypertension', 'Thyroid Disorder', 'GERD', 'Anemia', 
    'Osteoarthritis', 'Anxiety', 'Chronic Bronchitis', 'Vitamin Deficiency'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Clinic Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-700 dark:to-indigo-800 text-white shadow-glow-primary animate-slide-in">
        <div className="space-y-1">
          <h3 className="text-xl font-bold flex items-center gap-2">
            Hospital Patients Management Directory
          </h3>
          <p className="text-primary-100 text-xs">
            Indian Health Clinic Medication Adherence Portal. Track patient compliance and logs.
          </p>
        </div>
        
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-white text-primary-600 font-semibold text-xs hover:bg-primary-50 transition-all flex items-center gap-1.5 shadow"
        >
          <UserPlus className="w-4 h-4" /> Register New Patient
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Patients */}
        <Card className="flex items-center gap-4 py-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-950/40 rounded-2xl text-primary-500">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
              Total Patients Monitor
            </p>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {kpis.totalPatients}
            </h4>
          </div>
        </Card>

        {/* Average Compliance */}
        <Card className="flex items-center gap-4 py-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-2xl text-emerald-500">
            <Award className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
              Clinic Average Adherence
            </p>
            <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {kpis.avgAdherence}%
            </h4>
          </div>
        </Card>

        {/* Patients at Risk */}
        <Card className="flex items-center gap-4 py-4 border-l-4 border-l-red-500">
          <div className="p-3 bg-red-100 dark:bg-red-950/40 rounded-2xl text-red-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
              High Risk Cases (&lt;80% compliance)
            </p>
            <h4 className="text-2xl font-black text-red-600 dark:text-red-400 mt-0.5">
              {kpis.atRiskCount} patients
            </h4>
          </div>
        </Card>
      </div>

      {/* Control panel (Search & Filter) */}
      <Card>
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-450" />
              <input
                type="text"
                placeholder="Search patient name..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Disease Dropdown */}
            <div>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-150"
                value={disease}
                onChange={(e) => {
                  setDisease(e.target.value);
                  setPage(1);
                }}
              >
                {diseasesList.map(d => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Diseases' : d}
                  </option>
                ))}
              </select>
            </div>

            {/* Compliance Filter Dropdown */}
            <div>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-150"
                value={complianceFilter}
                onChange={(e) => {
                  setComplianceFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All Compliance Rates</option>
                <option value="high">High Adherence (&gt;90%)</option>
                <option value="moderate">Moderate (80-90%)</option>
                <option value="low">Low Adherence (&lt;80%)</option>
              </select>
            </div>

            {/* Submit search button */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow"
              >
                Filter Patients
              </button>
            </div>

          </div>
        </form>
      </Card>

      {/* Datatable Listing Card */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-24">
            <Spinner />
          </div>
        ) : patients.length > 0 ? (
          <div className="space-y-4">
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-darkbg-900/30">
                    <th className="p-4">Patient ID</th>
                    <th className="p-4 cursor-pointer" onClick={() => handleToggleSort('name')}>
                      <span className="flex items-center gap-1">Patient Name <ArrowUpDown className="w-3.5 h-3.5" /></span>
                    </th>
                    <th className="p-4">Age / Gender</th>
                    <th className="p-4">Chronic Disease</th>
                    <th className="p-4">Today Doses</th>
                    <th className="p-4">Missed Today</th>
                    <th className="p-4 cursor-pointer" onClick={() => handleToggleSort('overallAdherence')}>
                      <span className="flex items-center gap-1">Overall Adherence <ArrowUpDown className="w-3.5 h-3.5" /></span>
                    </th>
                    <th className="p-4 cursor-pointer" onClick={() => handleToggleSort('lastUpdated')}>
                      <span className="flex items-center gap-1">Last Log Action <ArrowUpDown className="w-3.5 h-3.5" /></span>
                    </th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {patients.map((patient, index) => {
                    const isRisk = patient.overallAdherence < 80;
                    const logDate = new Date(patient.lastUpdated).toLocaleDateString([], { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    return (
                      <tr key={index} className="text-slate-700 dark:text-slate-250 hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                        <td className="p-4 font-bold text-slate-500">{patient.patientId}</td>
                        <td className="p-4 font-extrabold text-slate-800 dark:text-slate-100">{patient.name}</td>
                        <td className="p-4 font-medium">{patient.age} / {patient.gender}</td>
                        <td className="p-4">
                          <span className="font-semibold text-slate-650 dark:text-slate-350">{patient.chronicDisease}</span>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded font-bold text-slate-500">
                            {patient.todayMedicinesCount} scheduled
                          </span>
                        </td>
                        <td className="p-4">
                          {patient.missedTodayCount > 0 ? (
                            <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-extrabold">
                              {patient.missedTodayCount} missed
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-black ${isRisk ? 'text-red-500' : 'text-emerald-500'}`}>
                              {patient.overallAdherence}%
                            </span>
                            
                            {/* Small progress bar */}
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                              <div className={`h-full rounded-full ${isRisk ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${patient.overallAdherence}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500">{logDate}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              // Save dynamic patient id to trigger context updates
                              localStorage.setItem('medi-track-patient-id', patient.patientId);
                              navigate(`/patients/${patient.patientId}`);
                            }}
                            className="px-3.5 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all shadow-sm"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-200/20 text-xs font-semibold">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  className="px-3.5 py-2 border border-slate-250 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-40 transition-colors flex items-center gap-1 text-slate-600 dark:text-slate-400"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <span className="text-slate-400">
                  Page <strong className="text-slate-700 dark:text-slate-350">{page}</strong> of {pagination.pages}
                </span>

                <button
                  disabled={page === pagination.pages}
                  onClick={() => setPage(p => Math.min(p + 1, pagination.pages))}
                  className="px-3.5 py-2 border border-slate-250 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-40 transition-colors flex items-center gap-1 text-slate-600 dark:text-slate-400"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            
          </div>
        ) : (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-750 mx-auto mb-4" />
            <h4 className="font-bold text-slate-700 dark:text-slate-350">No Patients Registered</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              We couldn't find any patient matching the filters. Check settings or adjust compliance values.
            </p>
          </div>
        )}
      </Card>

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPatientAdded={() => fetchPatientsList()}
      />
    </div>
  );
};

export default PatientsDashboard;
