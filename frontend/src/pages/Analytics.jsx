import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Award, 
  Activity, 
  Calendar,
  Info,
  ChevronDown
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
  Legend
} from 'recharts';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/UI/Card';
import Spinner from '../components/UI/Spinner';

const Analytics = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [adherenceData, setAdherenceData] = useState({ daily: 100, weekly: 100, monthly: 100, overall: 100 });
  const [trendData, setTrendData] = useState([]);
  const [medicineLeaderboard, setMedicineLeaderboard] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // 1. Fetch compliance metrics
        const adhRes = await api.getAdherence();
        if (adhRes && adhRes.success) {
          setAdherenceData(adhRes.data);
        }

        // 2. Fetch history logs to compute trends and leaderboard
        const startRange = new Date();
        startRange.setDate(startRange.getDate() - 14); // Past 14 days
        const histRes = await api.getHistory({ 
          date: new Date().toISOString().split('T')[0], 
          type: 'week', // We fetch history which yields logs
          limit: 1000 
        });

        if (histRes && histRes.success) {
          const logs = histRes.data || [];
          
          // Compute Daily Trend for the past 14 days
          const dailyTrendMap = {};
          for (let i = 14; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dateLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
            dailyTrendMap[dateStr] = { dateStr, label: dateLabel, taken: 0, total: 0, missed: 0 };
          }

          logs.forEach(log => {
            const logDateStr = new Date(log.date).toISOString().split('T')[0];
            if (dailyTrendMap[logDateStr] && log.status !== 'Pending') {
              dailyTrendMap[logDateStr].total += 1;
              if (log.status === 'Taken') dailyTrendMap[logDateStr].taken += 1;
              if (log.status === 'Missed') dailyTrendMap[logDateStr].missed += 1;
            }
          });

          const trendList = Object.keys(dailyTrendMap).map(key => {
            const day = dailyTrendMap[key];
            const rate = day.total > 0 ? Math.round((day.taken / day.total) * 100) : 100;
            return {
              name: day.label,
              adherence: rate,
              taken: day.taken,
              missed: day.missed,
              total: day.total
            };
          });
          setTrendData(trendList);

          // Compute Per-Medicine leaderboard
          const medicineStats = {};
          logs.forEach(log => {
            if (!log.medication) return;
            const name = log.medication.medicineName;
            if (!medicineStats[name]) {
              medicineStats[name] = { name, taken: 0, total: 0, dosage: log.medication.dosage };
            }
            if (log.status !== 'Pending') {
              medicineStats[name].total += 1;
              if (log.status === 'Taken') medicineStats[name].taken += 1;
            }
          });

          const leaderboard = Object.keys(medicineStats).map(key => {
            const med = medicineStats[key];
            const rate = med.total > 0 ? Math.round((med.taken / med.total) * 100) : 100;
            return {
              ...med,
              adherence: rate
            };
          }).sort((a, b) => b.adherence - a.adherence);

          setMedicineLeaderboard(leaderboard);
        }
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <Spinner fullPage />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Title Header */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          Adherence Analytics Hub
        </h3>
        <p className="text-xs text-slate-400">
          In-depth statistics and visual trend analysis summarizing patient compliance levels.
        </p>
      </div>

      {/* Analytics KPI Dashboard Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily card */}
        <Card className="text-left border-l-4 border-l-primary-500">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Daily Adherence
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{adherenceData.daily}%</span>
            <span className="text-xs text-slate-400 font-medium">today</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-primary-500 h-full rounded-full" style={{ width: `${adherenceData.daily}%` }} />
          </div>
        </Card>

        {/* Weekly card */}
        <Card className="text-left border-l-4 border-l-indigo-500">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Weekly Adherence
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{adherenceData.weekly}%</span>
            <span className="text-xs text-slate-400 font-medium">7 days</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${adherenceData.weekly}%` }} />
          </div>
        </Card>

        {/* Monthly card */}
        <Card className="text-left border-l-4 border-l-purple-500">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Monthly Adherence
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{adherenceData.monthly}%</span>
            <span className="text-xs text-slate-400 font-medium">30 days</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${adherenceData.monthly}%` }} />
          </div>
        </Card>

        {/* Overall card */}
        <Card className="text-left border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Overall Adherence
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{adherenceData.overall}%</span>
            <span className="text-xs text-slate-400 font-medium">all-time</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${adherenceData.overall}%` }} />
          </div>
        </Card>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-800/50">
              <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" /> Adherence Percentage Trend
              </h3>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Last 14 Days
              </span>
            </div>

            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAdh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-850" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      color: '#0f172a'
                    }}
                    labelClassName="font-bold text-xs"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="adherence" 
                    stroke="#6366f1" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorAdh)" 
                    name="Adherence %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Bar Chart: Taken vs Missed counts */}
          <Card>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-800/50">
              <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" /> Intake Volume Comparison
              </h3>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Doses Taken vs Missed
              </span>
            </div>

            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-850" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="taken" fill="#10b981" radius={[4, 4, 0, 0]} name="Taken" />
                  <Bar dataKey="missed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Missed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right Column: Leaderboard / Medicine performance list */}
        <div>
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-800/50">
              <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Regimen Compliance Rank
              </h3>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
              {medicineLeaderboard.length > 0 ? (
                medicineLeaderboard.map((med, index) => {
                  let progressColor = 'bg-primary-500';
                  if (med.adherence >= 90) progressColor = 'bg-emerald-500';
                  else if (med.adherence < 75) progressColor = 'bg-red-500';
                  else if (med.adherence < 85) progressColor = 'bg-amber-500';

                  return (
                    <div key={index} className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {med.name}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            Dosage: {med.dosage}
                          </p>
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {med.adherence}%
                        </span>
                      </div>

                      {/* Progress slider bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${med.adherence}%` }} />
                      </div>
                      
                      <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500">
                        <span>Taken: {med.taken} dose{med.taken !== 1 ? 's' : ''}</span>
                        <span>Total: {med.total} dose{med.total !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 text-slate-400 text-xs">
                  No active tracking history logs available.
                </div>
              )}
            </div>

            {/* Hint Box */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-darkbg-900 rounded-xl border border-slate-250/20 text-left flex gap-2">
              <Info className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                Clinical standard adherence rate recommendation is <strong>80% or higher</strong> to maintain effective drug therapeutic levels.
              </p>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
