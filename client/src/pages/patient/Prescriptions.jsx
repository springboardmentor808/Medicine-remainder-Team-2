import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Prescriptions() {
  const [meds, setMeds] = useState([]);
  useEffect(() => { api('/patient/medicines').then(setMeds).catch(()=> setMeds([])); }, []);
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">My Prescriptions</h1>
      <p className="text-sm text-slate-500 mt-1">Gallery of OCR-scanned prescription uploads.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {meds.length===0 ? <div className="col-span-2 bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-sm text-slate-500">No prescriptions yet. Use Scan prescription to upload.</div> : meds.map(m => (
          <div key={m._id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="font-bold text-sm text-slate-900">{m.name}</div>
            <div className="text-xs text-slate-500 mt-1">{m.dose} · {m.schedule} · {m.slot}</div>
            {m.imageUrl ? <img src={m.imageUrl} alt={m.name} className="mt-3 w-full h-32 object-cover rounded-lg border border-slate-200"/> : <div className="mt-3 h-32 bg-slate-50 border border-dashed border-slate-300 rounded-lg grid place-items-center text-xs text-slate-400">No image</div>}
            <div className="text-xs text-slate-400 mt-2">Scanned via OCR · {new Date(m.createdAt).toLocaleDateString('en-GB',{timeZone:'Asia/Kolkata'})}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
