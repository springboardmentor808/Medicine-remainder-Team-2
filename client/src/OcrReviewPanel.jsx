import { useEffect, useState } from 'react';

const API = 'http://localhost:4000/api';

export default function OcrReviewPanel({ onClose, onSaved }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [match, setMatch] = useState(null);
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [schedule, setSchedule] = useState('08:00 AM');
  const [slot, setSlot] = useState('morning');
  const [proposed, setProposed] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function scan(event) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setError('');
    const body = new FormData();
    body.append('image', file);
    try {
      const response = await fetch(`${API}/patient/ocr`, { method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body });
      const payload = await response.json().catch(()=> ({}));
      if (!response.ok) throw new Error(payload.error || 'We could not read that image clearly. Please try again or enter manually.');
      if (response.status === 502 && !payload.error?.toLowerCase().includes('clearly')) {
        // ensure calm fallback triggers even if server phrasing varies
        throw new Error('We could not read that image clearly. Please try again or enter manually.');
      }
      setResult(payload.result);
      setMatch(payload.match || null);
      setMedicineName(payload.result.medicine_name || '');
      setDosage(payload.result.dosage || '');
      setFrequency(payload.result.frequency || '');
      if (payload.match) {
        // show match but do NOT auto-correct
      }
    } catch (caught) { setError(caught.message); } finally { setBusy(false); }
  }
  useEffect(() => {
    if (!frequency) { setProposed([]); return; }
    fetch(`${API}/patient/schedule/preview`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ frequency }) })
      .then(r=>r.json()).then(d=> { setProposed(d.proposed||[]); if (d.proposed && d.proposed.length) setSlot(d.proposed[0]); }).catch(()=> setProposed([]));
  }, [frequency]);
  async function confirm() {
    setBusy(true);
    setError('');
    try {
      const body = { 
        name: medicineName, dose: dosage, schedule, slot, frequency,
          composition: match?.composition || '', uses: match?.uses || result?.uses || '', sideEffects: match?.sideEffects || result?.side_effects || '',
          manufacturer: match?.manufacturer || '', imageUrl: match?.imageUrl || '',
          quantityPerDose: dosage, formType: 'oral'
        };
      const response = await fetch(`${API}/patient/medicines`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Please check the medicine details.');
      onSaved();
    } catch (caught) { setError(caught.message); } finally { setBusy(false); }
  }
  return <div className="modal-backdrop"><div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}><button type="button" className="close" onClick={onClose}>×</button><p className="eyebrow">Local Ollama OCR · moondream + qwen2:1.5b · 127.0.0.1:11434</p><h3>Review prescription</h3>{!result ? <form onSubmit={scan}><p className="muted">Your image stays on this computer and is reviewed before saving.</p><label>Prescription image<input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files[0])} /></label>{busy && <div className="notice">Reading with local Ollama (moondream vision → qwen2:1.5b JSON). This can take a moment...</div>}{error && <div className="form-error">{error}</div>}{error && (error.toLowerCase().includes('clearly') || error.toLowerCase().includes('again')) && <div className="notice" style={{marginTop:8}}>Calm fallback: you can close this and use “Add medicine” manually.</div>}<button className="primary-button" disabled={busy} type="submit">{busy ? 'Reading...' : 'Read image'} <span>→</span></button></form> : <><div className="notice" style={{ marginBottom: '14px' }}><strong>OCR Results Loaded</strong><br />Please review and edit the fields below if any information is missing or incorrect.</div>{match && <div style={{ background:'#edf7f0', border:'1px solid #c8e6d3', borderRadius:8, padding:'10px 12px', marginBottom:12, textAlign:'left' }}><p style={{margin:'0 0 6px', fontSize:12, fontWeight:700, color:'#2c7a59'}}>Reference cross-check (read-only, no auto-correct):</p><p style={{margin:0, fontSize:13}}><strong>{match.name}</strong> — {match.composition}</p>{match.manufacturer && <p style={{margin:'2px 0 0', fontSize:11, color:'#53655c'}}>{match.manufacturer}</p>}{match.imageUrl && <img src={match.imageUrl} alt={match.name} style={{maxWidth:80, marginTop:6, borderRadius:6}} />}{match.uses && <p style={{margin:'6px 0 0', fontSize:11}}>Uses: {match.uses.slice(0,120)}</p>}<p style={{margin:'6px 0 0', fontSize:10, color:'#7a837d'}}>Shown for visual confirmation only — we never overwrite OCR output.</p></div>}<label>Medicine name<input required value={medicineName} onChange={(event) => setMedicineName(event.target.value)} placeholder="e.g. Paracetamol" /></label><label>Dosage / Strength<input required value={dosage} onChange={(event) => setDosage(event.target.value)} placeholder="e.g. 500mg" /></label><label>Frequency (from OCR)<input value={frequency} onChange={(event) => setFrequency(event.target.value)} placeholder="e.g. Once daily, Twice daily, TDS" /></label>{proposed.length>0 ? <div className="notice" style={{background:'#f0f7ff', borderColor:'#c2d6f0', color:'#2c5a8a'}}>Proposed schedule from frequency: <strong>{proposed.join(', ')}</strong> — you can keep it or change below before saving.</div> : frequency ? <div className="notice">No confident mapping for “{frequency}” — please pick slots manually.</div> : null}<label>Confirmed reminder time<input value={schedule} onChange={(event) => setSchedule(event.target.value)} /></label><label>Part of day<select value={slot} onChange={(event) => setSlot(event.target.value)}><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="night">Night</option></select></label><p className="muted" style={{ fontSize: '11px', marginTop: '10px' }}>Confirming saves the medicine and triggers caregiver updates. {proposed.length>0 && `We've set ${proposed.join(', ')} from “${frequency}” — adjust if needed.`}</p>{error && <div className="form-error">{error}</div>}<button className="primary-button" disabled={busy} onClick={confirm}>{busy ? 'Saving...' : 'Confirm and add'} <span>→</span></button></>}</div></div>;
}
