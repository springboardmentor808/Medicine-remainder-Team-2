import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const taken = payload.find((p) => p.dataKey === 'taken')?.value ?? 0;
  const missed = payload.find((p) => p.dataKey === 'missed')?.value ?? 0;
  return (
    <div className="bg-white border border-[#e2e8e1] rounded-lg px-2.5 py-2 text-xs shadow-md">
      <div className="font-bold mb-1 text-[#24302b]">{label}</div>
      <div className="text-[#2c7a59] font-semibold">Taken: {taken}</div>
      <div className="text-[#a35d4c] font-semibold">Missed: {missed}</div>
    </div>
  );
}

export default function HistoryChart({ data }) {
  const chartData = (data || []).map((d) => ({
    day: d.date.slice(5),
    taken: d.taken,
    missed: d.missed,
  }));
  return (
    <div className="w-full h-[140px]">
      <ResponsiveContainer>
        <BarChart data={chartData} barCategoryGap="20%">
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} allowDecimals={false} domain={[0, 4]} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0f3ef' }} />
          <Bar dataKey="taken" stackId="a" fill="#2c7a59" radius={[4, 4, 0, 0]} />
          <Bar dataKey="missed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
