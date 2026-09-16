import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api.js';

export default function PatientDetail() {
  const { patientId } = useParams();
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState('');
  const [nudging, setNudging] = useState(false);
  const [nudgeMsg, setNudgeMsg] = useState('');

  useEffect(() => {
    api(`/caregiver/patients/${patientId}/detail`).then(setDetail).catch(e => setErr(e.message));
  }, [patientId]);

  async function sendNudge() {
    setNudging(true);
    try {
      await api(`/caregiver/patients/${patientId}/nudge`, { method: 'POST' });
      setNudgeMsg('Reminder sent to patient \u2713');
      setTimeout(()=> setNudgeMsg(''), 2500);
    } catch (e) { setNudgeMsg(e.message); }
    finally { setNudging(false); }
  }

  if (err) return <div className="dashboard" style={{ padding: 24 }}><div className="form-error">{err}</div><Link to="/caregiver/home" className="outline-button" style={{ display: 'inline-block', marginTop: 12 }}>Back</Link></div>;
  if (!detail) return <div className="dashboard" style={{ padding: 24 }}><div className="notice">Loading patient detail...</div></div>;

  const { patient, timeline, refillRows, adherence, accessLevel, hasOverdue } = detail;

  return (
    <div className="dashboard" style={{ padding: 24, maxWidth: 900 }}>
      <Link to="/caregiver/home" className="back-button" style={{ display: 'inline-block', marginBottom: 16 }}>&larr; Back to care circle</Link>
      <div style={{ background: '#fff', border: '1px solid #e2e8e1', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="avatar large">{patient.name[0]}</div>
          <div>
            <h2 style={{ margin: 0 }}>{patient.name}</h2>
            <p className="muted" style={{ margin: 0 }}>{patient.email} · {patient.phone} · <span style={{ background: accessLevel==='manage'?'#2c7a59':'#e2e8e1', color: accessLevel==='manage'?'#fff':'#24302b', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>{accessLevel}</span> · {adherence}% adherence</p>
          </div>
        </div>
        <button className="primary-button compact" onClick={sendNudge} disabled={!hasOverdue || nudging} style={{ minHeight: 48 }}>
          {nudging ? <span className="spinner" /> : 'Send Reminder'} {hasOverdue ? '' : '(no overdue)'}
        </button>
      </div>
      {nudgeMsg && <div className="notice" style={{ marginTop: 8 }}>{nudgeMsg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 16, marginTop: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8e1', borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: '0 0 8px' }}>Today's timeline</h3>
          <p className="muted" style={{ margin: '0 0 12px' }}>Chronological doses — tap Send Reminder if overdue.</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {timeline.map(t => (
              <div key={String(t.medicineId ?? t.name)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${t.status==='taken'?'#a9cdb6': t.status==='missed'?'#e8a09a':'#e2e8e1'}`, background: t.status==='taken'?'#edf7f0': t.status==='missed'?'#fae9e4':'#fff', borderRadius: 10, padding: '10px 12px' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{String(t.schedule)} · {String(t.slot)} — {String(t.name)}</div>
                  <div style={{ fontSize: 12, color: '#7a837d' }}>{String(t.dose)}{t.quantityPerDose? ` · ${String(t.quantityPerDose)}`:''}{t.specialInstructions? ` · ${String(t.specialInstructions)}`:''} {t.logAt ? `· ${new Date(t.logAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`:''}</div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 12, color: t.status==='taken'?'#2c7a59': t.status==='missed'?'#a35d4c':'#8a7a2b' }}>
                  {t.status==='taken'?'Taken \u2713': t.status==='missed'?'Missed \u25B2': t.status==='snoozed'?'Snoozed \u25F7':'Upcoming \u25CB'}
                </span>
              </div>
            ))}
            {timeline.length===0 && <div className="notice">No medicines yet for this patient.</div>}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8e1', borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: '0 0 8px' }}>Inventory runway</h3>
            {refillRows.map(r => {
              const dep = r.depletionDate ? new Date(r.depletionDate).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : null;
              const key = String(r._id || r.name);
              return (
              <div key={key} style={{ padding: '8px 0', borderBottom: '1px solid #f0f3ef' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{String(r.name)}</strong><span style={{ fontSize: 12, color: r.lowStock?'#a35d4c':'#2c7a59', fontWeight: 700 }}>{String(r.runwayText)}</span></div>
                <div style={{ fontSize: 11, color: '#7a837d' }}>{r.remaining ?? '—'} remaining{ r.initialQuantity? ` / ${r.initialQuantity}`:''} · {dep? `depletes ${dep}`:'no estimate'}</div>
                {r.initialQuantity!=null && <div style={{ height: 6, background: '#f0f3ef', borderRadius: 4, marginTop: 6 }}><div style={{ width: `${Math.max(0, Math.min(100, Math.round((r.remaining/r.initialQuantity)*100)))}%`, height: '100%', background: r.lowStock?'#e8a09a':'#2c7a59', borderRadius: 4 }} /></div>}
              </div>
            );})}
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8e1', borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: '0 0 8px' }}>Emergency contacts</h3>
            {(patient.emergencyContacts && patient.emergencyContacts.length) ? patient.emergencyContacts.map((c,i)=> (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f3ef' }}>
                <span><strong>{c.name}</strong> <span style={{ color: '#7a837d' }}>({c.relation})</span></span><a href={`tel:${c.phone}`} style={{ color: '#2c7a59', fontWeight: 700 }}>{c.phone}</a>
              </div>
            )) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span><strong>{patient.name}</strong> <span style={{ color:'#7a837d' }}>(self)</span></span><a href={`tel:${patient.phone}`} style={{ color:'#2c7a59', fontWeight:700 }}>{patient.phone}</a></div>
                <p className="muted" style={{ fontSize: 11 }}>Add emergency contacts on patient profile. Showing primary phone.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
