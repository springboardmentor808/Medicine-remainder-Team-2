import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function RefillPanel() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(()=>{ api('/patient/refill').then(setData).catch(e=> setErr(e.message)); },[]);
  if (err) return <div className="form-error">{err}</div>;
  if (!data) return <div className="notice">Loading refill...</div>;
  if (data.length===0) return <div className="notice">No refill data yet. Add a medicine with quantity.</div>;
  return (
    <div style={{ display:'grid', gap:10 }}>
      {data.map(m=> {
        const pct = m.initialQuantity ? Math.round((m.remaining / m.initialQuantity)*100) : null;
        return (
        <div key={m._id} style={{ background:'#fff', border:'1px solid #e2e8e1', borderRadius:10, padding:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}><strong>{m.name}</strong><span style={{ fontSize:12, color: m.lowStock ? '#a35d4c':'#2c7a59'}}>{m.lowStock ? 'Low stock' : 'Healthy'}</span></div>
          <div style={{ fontSize:12, color:'#7a837d' }}>{m.takenLogs} taken · {m.remaining ?? '—'} remaining{ m.initialQuantity ? ` / ${m.initialQuantity}`:''} · ~{m.avgDaily}/day</div>
          {pct!=null && <div style={{ height:8, background:'#f0f3ef', borderRadius:4, marginTop:8 }}><div style={{ width: `${Math.max(0,Math.min(100,pct))}%`, height:'100%', background: m.lowStock?'#e8a09a':'#2c7a59', borderRadius:4 }} /></div>}
          <div style={{ fontSize:12, marginTop:6 }}>{m.daysLeft!=null ? `Runs out in ~${m.daysLeft} days${m.depletionDate ? ' ('+new Date(m.depletionDate).toLocaleDateString()+')':''}` : 'No depletion estimate (set quantity).'}</div>
        </div>
        );
      })}
    </div>
  );
}
