// IST helper — mirrors server/src/utils/time.js (native only, no date-fns/moment)
function toISTDateString(d) {
  const ist = new Date(d.getTime() + 330 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const day = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Compact Dark Calendar Heatmap — IST-aware, Tailwind-only
 * - bg-slate-900, white/light text, rounded-xl
 * - grid grid-cols-7 gap-1 p-3
 * - Empty padding via native JS based on IST first weekday
 * - Perfect (taken>0 && missed===0): large dark green circle bg-emerald-900 + border-emerald-300 + ✓
 * - Missed: small red dot absolute under number
 * - Click → onSelectDate(YYYY-MM-DD) master filter for History
 */
export function CalendarHeatmap({ daily = [], onSelectDate, selectedDate }) {
  const todayISTStr = toISTDateString(new Date());
  const [yStr, mStr] = todayISTStr.split('-');
  const year = Number(yStr);
  const month = Number(mStr) - 1;
  const firstMidnightUTC = Date.UTC(year, month, 1, 0, 0, 0) - 330 * 60 * 1000;
  const firstDayISTWeekday = new Date(firstMidnightUTC + 330 * 60 * 1000).getUTCDay();
  const dim = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const map = Object.fromEntries((daily || []).map((d) => [d.date, d]));
  const cells = [];
  for (let i = 0; i < firstDayISTWeekday; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, iso, info: map[iso] || { taken: 0, missed: 0, snoozed: 0 } });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bg-slate-900 rounded-xl p-3 text-slate-200 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-sm">Today</span>
        <span className="text-xs text-slate-400">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 p-1 mb-1">
        {weekdays.map((w, i) => (
          <div key={`${w}-${i}`} className="text-[10px] text-slate-500 font-semibold text-center">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} className="w-8 h-8" />;
          const hasPerfect = cell.info.taken > 0 && cell.info.missed === 0;
          const hasMissed = cell.info.missed > 0;
          const isToday = cell.iso === todayISTStr;
          const isSelected = cell.iso === selectedDate;
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelectDate?.(cell.iso)}
              aria-pressed={isSelected}
              title={`${cell.iso}: ${cell.info.taken} taken, ${cell.info.missed} missed`}
              className={`relative w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold border transition-all duration-150 hover:-translate-y-px active:scale-[0.98] ${
                hasPerfect
                  ? 'bg-emerald-900 border-emerald-300 text-emerald-300'
                  : isSelected
                  ? 'bg-[#2c7a59] border-emerald-300 text-white'
                  : isToday
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-transparent border-transparent text-slate-300 hover:bg-slate-800'
              }`}
            >
              {hasPerfect ? <span className="text-[11px] font-bold">✓</span> : cell.day}
              {hasMissed && !hasPerfect && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />
              )}
              {hasMissed && hasPerfect && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 mt-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-900 border border-emerald-300" /> Taken ✓</span>
        <span className="flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" /> Missed</span>
      </div>
    </div>
  );
}
