import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Pill, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Clock, 
  ArrowRight, 
  ChevronRight, 
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/UI/Card';
import Spinner from '../components/UI/Spinner';

const Dashboard = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const res = await api.getClinicalDashboard();
      if (res && res.success) {
        setDashboardData(res.data);
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <Spinner fullPage />;

  const { 
    summary, 
    weeklyAdherence, 
    statusCounts, 
    missedTrend, 
    recentActivity, 
    upcomingMedicines 
  } = dashboardData || {
    summary: { totalPatients: 0, activeMedications: 0, todayScheduledDoses: 0, takenDoses: 0, missedDoses: 0, overallAdherence: 100 },
    weeklyAdherence: [],
    statusCounts: { taken: 0, missed: 0, pending: 0, skipped: 0 },
    missedTrend: [],
    recentActivity: [],
    upcomingMedicines: []
  };

  // Pie chart parameters
  const pieData = [
    { name: 'Taken', value: statusCounts.taken, color: '#10b981' },
    { name: 'Missed', value: statusCounts.missed, color: '#ef4444' },
    { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  // Fallback if pieData is empty
  const hasDosesToday = pieData.length > 0;
  const emptyPieData = [{ name: 'No Doses Today', value: 1, color: '#94a3b8' }];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left">
      
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-700 dark:to-indigo-800 text-white shadow-glow-primary animate-slide-in">
        <div className="space-y-1">
          <h3 className="text-xl font-bold flex items-center gap-2">
            Clinical Management & Adherence Dashboard
          </h3>
          <p className="text-primary-100 text-xs">
            Review clinic-wide statistics, monitor patient compliance, and manage medication logs.
          </p>
        </div>
        <Link 
          to="/patients"
          className="self-start md:self-center px-4 py-2.5 rounded-xl bg-white text-primary-600 font-semibold text-xs hover:bg-primary-50 transition-all flex items-center gap-1.5 shadow"
        >
          View Patients Directory <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Summary KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Total Patients */}
        <Card className="flex flex-col justify-between py-4 border-l-4 border-l-primary-500">
          <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Total Patients
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{summary.totalPatients}</span>
          </div>
        </Card>

        {/* Active Medications */}
        <Card className="flex flex-col justify-between py-4 border-l-4 border-l-indigo-500">
          <p className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Pill className="w-3.5 h-3.5" /> Active Regimens
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{summary.activeMedications}</span>
          </div>
        </Card>

        {/* Today's Scheduled Doses */}
        <Card className="flex flex-col justify-between py-4 border-l-4 border-l-amber-500">
          <p className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Scheduled Today
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-850 dark:text-slate-100">{summary.todayScheduledDoses}</span>
          </div>
        </Card>

        {/* Taken Doses */}
        <Card className="flex flex-col justify-between py-4 border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Doses Taken
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{summary.takenDoses}</span>
          </div>
        </Card>

        {/* Missed Doses */}
        <Card className="flex flex-col justify-between py-4 border-l-4 border-l-red-500">
          <p className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Doses Missed
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-red-600 dark:text-red-400">{summary.missedDoses}</span>
          </div>
        </Card>

        {/* Overall Adherence */}
        <Card className="flex flex-col justify-between py-4 border-l-4 border-l-purple-500">
          <p className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Overall Adherence
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-purple-650 dark:text-purple-400">{summary.overallAdherence}%</span>
          </div>
        </Card>
      </div>

      {/* Graphs & Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Adherence Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" /> Weekly Adherence Trend
            </h3>
            <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider">
              Last 7 Days (Clinic-wide Average)
            </span>
          </div>

          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyAdherence}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="clinicAdh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-850" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis domain={[0, 100]} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    color: '#0f172a'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="adherence" 
                  stroke="#4f46e5" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#clinicAdh)" 
                  name="Adherence %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Medication Status Pie Chart */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" /> Today's Doses Status
            </h3>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hasDosesToday ? pieData : emptyPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(hasDosesToday ? pieData : emptyPieData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Total Doses
              </span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {summary.todayScheduledDoses}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-[10px] font-bold mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-550 dark:text-slate-400">Taken ({statusCounts.taken})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-slate-555 dark:text-slate-400">Missed ({statusCounts.missed})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-555 dark:text-slate-400">Pending ({statusCounts.pending})</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Second Charts & Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Missed Dose Trend (Last 30 Days) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" /> Missed Dose Trend
            </h3>
            <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider">
              Last 30 Days Count
            </span>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={missedTrend}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-850" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    color: '#0f172a'
                  }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} name="Missed Doses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Upcoming scheduled medications across the clinic */}
        <Card className="flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Upcoming Medicines
            </h3>
            <span className="text-[10px] font-semibold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-full">
              Next 10 Doses
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
            {upcomingMedicines.length > 0 ? (
              upcomingMedicines.map((med, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-darkbg-850 border border-slate-250/45 dark:border-slate-800/80 rounded-2xl gap-3">
                  <div className="text-left space-y-0.5 min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {med.medicineName} <span className="font-normal text-slate-400">({med.dosage})</span>
                    </h4>
                    <p className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 truncate">
                      {med.patientName}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-white dark:bg-darkbg-900 border border-slate-200/40 dark:border-slate-800/40 px-2.5 py-1 rounded-xl flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-primary-500" /> {med.scheduledTime}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">
                No upcoming scheduled doses found today.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity feed across all patients */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" /> Recent Activities Feed
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Real-time audit log
            </span>
          </div>

          <div className="space-y-4 pr-1 overflow-y-auto max-h-96 custom-scrollbar">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const isTaken = activity.status === 'Taken';
                const isMissed = activity.status === 'Missed';
                const isSkipped = activity.status === 'Skipped';
                const time = new Date(activity.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = new Date(activity.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                
                return (
                  <div key={index} className="flex gap-4 items-start text-left border-b border-slate-100 dark:border-slate-800/20 pb-3 last:border-0 last:pb-0">
                    <div className={`
                      w-8 h-8 rounded-xl flex items-center justify-center border-2 flex-shrink-0 mt-0.5
                      ${isTaken 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                        : isMissed 
                        ? 'bg-red-500/10 border-red-500 text-red-500'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-500'
                      }
                    `}>
                      {isTaken && <CheckCircle className="w-4 h-4" />}
                      {isMissed && <XCircle className="w-4 h-4" />}
                      {isSkipped && <AlertCircle className="w-4 h-4" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {activity.patientName} • <span className="font-extrabold text-primary-500">{activity.medicineName}</span> <span className="font-normal text-slate-400">({activity.dosage})</span>
                        </h4>
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded
                          ${isTaken ? 'bg-emerald-500/10 text-emerald-500' :
                            isMissed ? 'bg-red-500/10 text-red-500' :
                            'bg-slate-100 text-slate-500 dark:bg-slate-800'
                          }
                        `}>
                          {activity.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        Scheduled for {activity.scheduledTime} • Logged on {dateStr} at {time}
                      </p>
                      {activity.notes && (
                        <p className="text-[10px] italic text-slate-500 dark:text-slate-400 mt-1 bg-slate-50 dark:bg-darkbg-900 border border-slate-200/20 p-2 rounded-xl max-w-xl">
                          "{activity.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No recent logged activities.
              </div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
};

export default Dashboard;
