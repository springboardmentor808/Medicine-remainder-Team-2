import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeeklyBar({ data }) {
  // data: [{date: '2026-08-25', taken: 2, missed: 1}, ...]
  const chartData = data.map(d => ({
    day: d.date.slice(5), // MM-DD
    taken: d.taken,
    missed: d.missed,
  }));
  return (
    <div style={{ width: '100%', height: 140 }}>
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="taken" stackId="a" fill="#2c7a59" radius={[4,4,0,0]} />
          <Bar dataKey="missed" stackId="a" fill="#e8a09a" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
