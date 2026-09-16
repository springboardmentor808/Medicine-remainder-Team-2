import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

export default function ConsistencyTrackingCharts({ weeklyData = [], monthlyData = [] }) {
  const [chartMode, setChartMode] = useState('weekly'); // 'weekly' | 'monthly'

  // Default fallback data for 7-day Weekly Bar Chart (taken vs scheduled)
  const defaultWeekly = [
    { day: 'Mon', scheduled: 4, taken: 4, missed: 0, adherence: 100 },
    { day: 'Tue', scheduled: 4, taken: 3, missed: 1, adherence: 75 },
    { day: 'Wed', scheduled: 4, taken: 4, missed: 0, adherence: 100 },
    { day: 'Thu', scheduled: 4, taken: 4, missed: 0, adherence: 100 },
    { day: 'Fri', scheduled: 4, taken: 3, missed: 1, adherence: 75 },
    { day: 'Sat', scheduled: 4, taken: 4, missed: 0, adherence: 100 },
    { day: 'Sun', scheduled: 4, taken: 4, missed: 0, adherence: 100 },
  ];

  // Default fallback data for 30-day Monthly Line Graph
  const defaultMonthly = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    // Simulated realistic adherence curve
    let adherence = 80 + Math.sin(i * 0.4) * 15;
    if (i === 12 || i === 22) adherence = 60;
    if (i > 25) adherence = 95;
    adherence = Math.min(100, Math.max(45, Math.round(adherence)));

    return {
      date: `Day ${dayNum}`,
      adherence,
      benchmark: 80,
    };
  });

  const weekChartData = weeklyData.length > 0 ? weeklyData : defaultWeekly;
  const monthChartData = monthlyData.length > 0 ? monthlyData : defaultMonthly;

  // Calculate high-level summary
  const totalScheduled = weekChartData.reduce((acc, d) => acc + (d.scheduled || 0), 0);
  const totalTaken = weekChartData.reduce((acc, d) => acc + (d.taken || 0), 0);
  const weeklyAverage = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 90;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Header & Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Consistency Tracking
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              {weeklyAverage}% Weekly Consistency
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {chartMode === 'weekly'
              ? 'Weekly ratio of taken vs scheduled pills per day.'
              : 'Monthly adherence trend line over the past 30 days.'}
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setChartMode('weekly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              chartMode === 'weekly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Weekly Ratio (Bar)
          </button>
          <button
            type="button"
            onClick={() => setChartMode('monthly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              chartMode === 'monthly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📈 Monthly Trend (30 Days)
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[280px] w-full">
        {chartMode === 'weekly' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weekChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5">
                          {label}
                        </p>
                        <div className="flex justify-between gap-4">
                          <span className="text-emerald-400 font-semibold">Pills Taken:</span>
                          <span className="font-bold">{data.taken}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Scheduled:</span>
                          <span>{data.scheduled}</span>
                        </div>
                        {data.missed > 0 && (
                          <div className="flex justify-between gap-4 text-rose-400">
                            <span>Missed:</span>
                            <span>{data.missed}</span>
                          </div>
                        )}
                        <div className="border-t border-slate-800 pt-1 mt-1 text-[11px] text-teal-300 font-bold">
                          Adherence: {Math.round((data.taken / (data.scheduled || 1)) * 100)}%
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
              />
              <Bar
                dataKey="taken"
                name="Taken Pills"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="scheduled"
                name="Scheduled Dose Target"
                fill="#e2e8f0"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval={4}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                unit="%"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const val = payload[0].value;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs">
                        <div className="text-slate-400 text-[10px] mb-1">{label}</div>
                        <div className="font-extrabold text-sm text-teal-400">
                          {val}% Adherence
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {val >= 80 ? '✓ On Target (≥80%)' : '⚠ Below Target'}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                y={80}
                stroke="#0d9488"
                strokeDasharray="4 4"
                label={{
                  value: '80% Target',
                  fill: '#0d9488',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
              <Line
                type="monotone"
                dataKey="adherence"
                name="Adherence Trend"
                stroke="#0d9488"
                strokeWidth={3}
                dot={{ r: 2, fill: '#0d9488' }}
                activeDot={{ r: 6, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
        <div className="p-2 rounded-xl bg-slate-50">
          <span className="text-[11px] text-slate-500 font-medium block">Total Taken</span>
          <strong className="text-base font-bold text-slate-900">{totalTaken} pills</strong>
        </div>
        <div className="p-2 rounded-xl bg-slate-50">
          <span className="text-[11px] text-slate-500 font-medium block">Weekly Target</span>
          <strong className="text-base font-bold text-slate-900">{totalScheduled} pills</strong>
        </div>
        <div className="p-2 rounded-xl bg-slate-50">
          <span className="text-[11px] text-slate-500 font-medium block">Goal Status</span>
          <strong className="text-base font-bold text-emerald-600">
            {weeklyAverage >= 80 ? '✓ On Track' : 'Needs Focus'}
          </strong>
        </div>
      </div>
    </div>
  );
}
