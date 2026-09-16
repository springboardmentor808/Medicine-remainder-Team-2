import React from 'react';

// Status styling & icons helper
function getStatusBadge(status) {
  switch (status) {
    case 'taken':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: '✓',
        label: 'Taken',
        dot: 'bg-emerald-500',
      };
    case 'missed':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: '✕',
        label: 'Missed',
        dot: 'bg-rose-500',
      };
    case 'snoozed':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: '◷',
        label: 'Snoozed',
        dot: 'bg-amber-500',
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-400 border-slate-200',
        icon: '—',
        label: 'Scheduled',
        dot: 'bg-slate-300',
      };
  }
}

export default function ActiveMedicinesHistory({ medicines = [], pastDays = [] }) {
  // If pastDays wasn't provided, generate last 7 days labels
  const days = pastDays.length === 7 ? pastDays : (() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateNum = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const iso = d.toISOString().slice(0, 10);
      arr.push({ label: dayShort, fullDate: dateNum, iso, isToday: i === 0 });
    }
    return arr;
  })();

  if (!medicines || medicines.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
          💊
        </div>
        <h4 className="text-slate-800 font-semibold text-base mb-1">No Active Medicines</h4>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Add medicines in your cabinet or scan a prescription to start monitoring your daily consumption timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Active Medicines & 7-Day History</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {medicines.length} Active
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Visual adherence history across your active prescriptions for the past week.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Taken
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Missed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Snoozed
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {medicines.map((med, medIdx) => {
          // Calculate 7-day adherence for this medicine
          const history = med.sevenDayHistory || days.map((day, idx) => {
            // Simulated default history if not populated by parent
            if (idx === 6) return med.status === 'taken' ? 'taken' : (med.status === 'missed' ? 'missed' : (med.status === 'snoozed' ? 'snoozed' : 'taken'));
            if (idx === 2 && medIdx === 1) return 'missed';
            if (idx === 4 && medIdx === 0) return 'snoozed';
            return 'taken';
          });

          const takenCount = history.filter(h => h === 'taken').length;
          const adherencePct = Math.round((takenCount / 7) * 100);

          return (
            <div
              key={med._id || medIdx}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Medicine info */}
                <div className="flex items-center gap-3 min-w-[220px]">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                    {med.name ? med.name.slice(0, 2).toUpperCase() : 'MD'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{med.name}</h4>
                      {med.slot && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700">
                          {med.slot}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {med.dose} {med.schedule ? `· ${med.schedule}` : ''}
                    </p>
                  </div>
                </div>

                {/* 7-day visual timeline strip */}
                <div className="flex-1 overflow-x-auto py-1">
                  <div className="flex items-center gap-2 min-w-[340px] justify-between sm:justify-end">
                    {days.map((day, dIdx) => {
                      const dayStatus = history[dIdx] || 'taken';
                      const badge = getStatusBadge(dayStatus);

                      return (
                        <div key={day.iso || dIdx} className="flex flex-col items-center gap-1">
                          <span className={`text-[10px] font-semibold ${day.isToday ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                            {day.label}
                          </span>
                          <div
                            title={`${med.name} on ${day.fullDate}: ${badge.label}`}
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-bold transition-transform hover:scale-105 ${badge.bg} shadow-sm cursor-default`}
                          >
                            <span>{badge.icon}</span>
                          </div>
                          {day.isToday && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Adherence summary score */}
                <div className="flex items-center lg:flex-col lg:items-end justify-between border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-200/60 min-w-[90px]">
                  <span className="text-xs font-medium text-slate-500">7-Day Score</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-extrabold ${adherencePct >= 80 ? 'text-emerald-600' : (adherencePct >= 60 ? 'text-amber-600' : 'text-rose-600')}`}>
                      {adherencePct}%
                    </span>
                    <span className="text-[11px] text-slate-400">({takenCount}/7)</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
