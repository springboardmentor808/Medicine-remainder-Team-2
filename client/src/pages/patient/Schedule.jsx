import { CalendarHeatmap } from '../../components/ui/CalendarHeatmap.jsx';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Schedule() {
  const [daily, setDaily] = useState([]);
  const [selected, setSelected] = useState('');
  useEffect(() => { api('/patient/adherence?range=monthly').then(d=> setDaily(d.daily||[])).catch(()=>{}); }, []);
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
      <p className="text-sm text-slate-500 mt-1">Full monthly view of upcoming doses (IST).</p>
      <div className="mt-6 flex justify-center">
        <CalendarHeatmap daily={daily} selectedDate={selected} onSelectDate={setSelected} />
      </div>
      {selected && <div className="mt-3 text-xs text-slate-600 text-center">Selected {selected} — upcoming doses shown in caregiver timeline.</div>}
    </div>
  );
}
