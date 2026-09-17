import { useEffect, useState, lazy, Suspense } from 'react';
import { api } from '../../lib/api';
const WeeklyBar = lazy(() => import('./WeeklyBar.jsx'));

function ProgressRing({ adherence }) {
  const r = 36; const c = 2 * Math.PI * r; const off = c - (adherence / 100) * c;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} stroke="#e2e8e1" strokeWidth="8" fill="none" />
        <circle cx="44" cy="44" r={r} stroke="#2c7a59" strokeWidth="8" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform="rotate(-90 44 44)" />
        <text x="44" y="48" textAnchor="middle" fontSize="16" fontWeight="700" fill="#24302b">{adherence}%</text>
      </svg>
      <div><p style={{ margin: 0, fontWeight: 700 }}>{adherence}% adherence</p><small style={{ color: '#7a837d' }}>taken / (taken+missed)</small></div>
    </div>
  );
}

function Heatmap({ daily }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${daily.length}, 1fr)`, gap: 6, marginTop: 12 }}>
      {daily.map(d => {
        const hasData = d.taken + d.missed > 0;
        const color = !hasData ? '#f0f3ef' : d.missed > 0 ? (d.taken > d.missed ? '#fbefc6' : '#f8d7d3') : '#d8f2e5';
        return (
          <div key={d.date} title={`${d.date}: ${d.taken} taken, ${d.missed} missed`}
            style={{ background: color, borderRadius: 6, padding: '8px 4px', textAlign: 'center', fontSize: 10 }}>
            <div style={{ fontWeight: 600 }}>{d.date.slice(5)}</div>
            <div>{d.taken}✓ {d.missed}✕</div>
          </div>
        );
      })}
    </div>
  );
}

export { CalendarHeatmap } from './CalendarHeatmap.jsx';

export default function AdherencePanel() {
  const [range, setRange] = useState('weekly');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api(`/patient/adherence?range=${range}`).then(setData).catch(e => setErr(e.message));
  }, [range]);
  if (err) return <div className="form-error">{err}</div>;
  if (!data) return <div className="notice">Loading adherence...</div>;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8e1', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ProgressRing adherence={data.adherence} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={range==='weekly'?'primary-button compact':'outline-button compact'} onClick={()=>setRange('weekly')}>Weekly</button>
          <button className={range==='monthly'?'primary-button compact':'outline-button compact'} onClick={()=>setRange('monthly')}>Monthly</button>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#7a837d' }}>Streak: <strong style={{ color: '#2c7a59' }}>{data.streak} days</strong> · {data.taken} taken / {data.missed} missed</div>
      <Suspense fallback={<div className="notice">Loading chart...</div>}>
        <WeeklyBar data={data.daily} />
      </Suspense>
      <Heatmap daily={data.daily} />
    </div>
  );
}
