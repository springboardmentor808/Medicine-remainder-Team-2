import { useEffect, useState, lazy, Suspense } from 'react';
import { api } from '../../lib/api';
import { CalendarHeatmap } from '../../components/ui/CalendarHeatmap.jsx';

const HistoryChart = lazy(() => import('../../components/ui/HistoryChart.jsx'));

function ProgressRing({ value }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 36;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden className="shrink-0">
      <circle cx="44" cy="44" r={r} stroke="#e2e8e1" strokeWidth="8" fill="none" />
      <circle cx="44" cy="44" r={r} stroke="#2c7a59" strokeWidth="8" fill="none" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 44 44)" />
      <text x="44" y="48" textAnchor="middle" fontSize="16" fontWeight="700" fill="#24302b">{pct}%</text>
    </svg>
  );
}

function todayISTStr() {
  const ist = new Date(Date.now() + 330 * 60 * 1000);
  const y = ist.getUTCFullYear(); const m = String(ist.getUTCMonth() + 1).padStart(2, '0'); const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function History() {
  const [range, setRange] = useState('weekly');
  const [adata, setAdata] = useState(null);
  const [err, setErr] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [logs, setLogs] = useState(null);
  const [logsErr, setLogsErr] = useState('');

  useEffect(() => {
    let alive = true;
    api(`/patient/adherence?range=${range}`)
      .then((d) => { if (alive) setAdata(d); })
      .catch((e) => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, [range]);

  useEffect(() => {
    let alive = true;
    setLogs(null); setLogsErr('');
    const q = selectedDate ? `?date=${selectedDate}` : '';
    api(`/patient/history${q}`)
      .then((d) => { if (alive) setLogs(d); })
      .catch((e) => { if (alive) { setLogsErr(e.message); setLogs([]); } });
    return () => { alive = false; };
  }, [selectedDate]);

  return (
    <div className="grid gap-4 max-w-[900px]">
      {/* Component 1: Adherence Chart Panel — white card, lazy Recharts */}
      <section className="bg-white border border-[#e2e8e1] rounded-xl p-4">
        <div className="flex justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <ProgressRing value={adata ? adata.adherence : 0} />
            <div>
              <div className="font-bold text-sm text-[#24302b]">{adata ? `${adata.adherence}% adherence` : '—'}</div>
              <div className="text-xs text-[#7a837d]">taken / (taken+missed)</div>
              <div className="mt-1.5 text-xs text-[#7a837d]">
                Streak: <strong className="text-[#2c7a59]">{adata ? `${adata.streak} days` : '—'}</strong>
                {adata && adata.taken != null && ` · ${adata.taken} taken / ${adata.missed} missed`}
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center self-start">
            <button
              type="button"
              onClick={() => setRange('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${range === 'weekly' ? 'bg-[#2c7a59] text-white border-[#2c7a59]' : 'bg-white text-[#2c7a59] border-[#a9cdb6] hover:bg-[#edf7f0]'}`}
            >Weekly</button>
            <button
              type="button"
              onClick={() => setRange('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${range === 'monthly' ? 'bg-[#2c7a59] text-white border-[#2c7a59]' : 'bg-white text-[#2c7a59] border-[#a9cdb6] hover:bg-[#edf7f0]'}`}
            >Monthly</button>
          </div>
        </div>

        {err ? <div className="mt-3 text-xs text-[#a35d4c] bg-[#fae9e4] rounded-md px-3 py-2">{err}</div> : null}
        {!adata ? (
          <div className="mt-3 bg-[#edf7f0] text-[#2c7a59] text-xs rounded-md px-3 py-2">Loading adherence...</div>
        ) : (
          <>
            <div className="mt-3.5">
              <Suspense fallback={<div className="bg-[#edf7f0] text-xs rounded-md px-3 py-2">Loading chart...</div>}>
                <HistoryChart data={adata.daily} />
              </Suspense>
            </div>
            <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-1">
              {(adata.daily || []).map((d) => {
                const isSelected = d.date === selectedDate;
                const isToday = d.date === todayISTStr();
                const active = isSelected || (!selectedDate && isToday);
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setSelectedDate(d.date)}
                    title={`${d.date}: ${d.taken} taken, ${d.missed} missed`}
                    className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-[11px] font-semibold border transition-all ${active ? 'bg-[#d8f2e5] border-[#a7f3d0] text-[#24302b]' : 'bg-[#f0f3ef] border-transparent text-[#24302b] hover:bg-white hover:border-[#e2e8e1]'}`}
                  >
                    <span className="text-[#6b7280] mr-1">{d.date.slice(5)}</span>
                    <span className="text-[#2c7a59]">{d.taken}✓</span>
                    <span className="text-[#9ca3af] mx-0.5">/</span>
                    <span className="text-[#a35d4c]">{d.missed}✕</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Component 2: Dark Calendar Heatmap — master filter, compact */}
      <section className="flex justify-center">
        <CalendarHeatmap daily={adata ? adata.daily : []} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </section>
      {selectedDate && (
        <div className="flex gap-2 -mt-2">
          <span className="text-xs text-[#7a837d]">Filtering by <strong className="text-[#24302b]">{selectedDate}</strong></span>
          <button type="button" onClick={() => setSelectedDate('')} className="text-xs text-[#2c7a59] bg-transparent border-0 cursor-pointer font-semibold hover:underline">Clear</button>
        </div>
      )}

      {/* Component 3: Detailed Log List */}
      <section className="bg-white border border-[#e2e8e1] rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="m-0 text-sm font-bold text-[#24302b]">History by date {selectedDate ? `— ${selectedDate}` : '(all recent)'}</h3>
          <span className="text-[11px] text-[#9ca3af]">{logs ? `${logs.length} entries` : ''}</span>
        </div>
        {logsErr && <div className="text-xs text-[#a35d4c] bg-[#fae9e4] rounded-md px-3 py-2 mb-2">{logsErr}</div>}
        {logs === null ? (
          <div className="bg-[#edf7f0] text-[#2c7a59] text-xs rounded-md px-3 py-2">Loading history...</div>
        ) : logs.length === 0 ? (
          <div className="bg-[#edf7f0] text-[#2c7a59] text-xs rounded-md px-3 py-2">No logs for this date. Mark a dose Taken/Missed from Overview or tap a calendar day.</div>
        ) : (
          <div className="grid">
            {logs.map((l) => {
              const medName = l.medicineId?.name || l.medicineId || 'Medicine';
              const slot = l.slot || l.medicineId?.slot || '—';
              const ts = new Date(l.createdAt);
              const istStr = ts.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
              const isTaken = l.status === 'taken';
              const isMissed = l.status === 'missed';
              return (
                <div key={l._id} className="flex justify-between items-center py-2.5 border-b border-[#f0f3ef] text-sm">
                  <span className="text-[#24302b]"><strong>{medName}</strong> · {slot} · {istStr}</span>
                  <span className={`font-bold text-xs rounded-full px-2 py-1 whitespace-nowrap ${isTaken ? 'text-[#2c7a59] bg-[#d8f2e5]' : isMissed ? 'text-[#a35d4c] bg-[#fae9e4]' : 'text-[#8a7a2b] bg-[#f0f3ef]'}`}>
                    {isTaken ? 'taken ✓' : isMissed ? 'missed ▲' : l.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
