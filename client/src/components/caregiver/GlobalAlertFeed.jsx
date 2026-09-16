import React, { useState } from 'react';

export default function GlobalAlertFeed({ alerts = [], onNudgePatient }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'emergency' | 'missed' | 'low_stock'

  // Classify and sort alerts by severity (Emergency alerts in red, standard in gray)
  const processedAlerts = alerts.map(a => {
    const type = (a.type || '').toLowerCase();
    const title = (a.title || '').toLowerCase();
    const message = (a.message || '').toLowerCase();

    // Emergency condition: multiple missed doses, severe low stock (<= 2 days), or urgent escalation
    const isEmergency =
      type === 'missed_dose' ||
      title.includes('emergency') ||
      message.includes('urgent') ||
      (type === 'low_stock' && (message.includes('1 days') || message.includes('2 days') || message.includes('tomorrow')));

    return {
      ...a,
      severity: isEmergency ? 'emergency' : 'standard',
    };
  }).sort((a, b) => {
    // Sort Emergency first, then chronological
    if (a.severity === 'emergency' && b.severity !== 'emergency') return -1;
    if (b.severity === 'emergency' && a.severity !== 'emergency') return 1;
    return new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now());
  });

  const filteredAlerts = processedAlerts.filter(a => {
    if (filter === 'emergency') return a.severity === 'emergency';
    if (filter === 'missed') return (a.type || '').includes('missed');
    if (filter === 'low_stock') return (a.type || '').includes('low_stock') || (a.type || '').includes('stock');
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col h-full">
      {/* Feed Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Global Alert Feed
          </h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {filteredAlerts.length} Alerts
        </span>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 text-xs">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter('emergency')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
            filter === 'emergency'
              ? 'bg-rose-600 text-white'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50'
          }`}
        >
          <span>🚨</span> Emergency
        </button>
        <button
          type="button"
          onClick={() => setFilter('missed')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
            filter === 'missed'
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Missed Doses
        </button>
        <button
          type="button"
          onClick={() => setFilter('low_stock')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
            filter === 'low_stock'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/50'
          }`}
        >
          Low Stock
        </button>
      </div>

      {/* Alerts Stream */}
      <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <span className="text-xl block mb-1">🌿</span>
            No alerts under this filter. Everything is running smoothly.
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => {
            const isEmergency = alert.severity === 'emergency';
            const timeAgo = alert.createdAt
              ? (() => {
                  const mins = Math.max(1, Math.round((Date.now() - new Date(alert.createdAt)) / 60000));
                  if (mins < 60) return `${mins}m ago`;
                  const hrs = Math.round(mins / 60);
                  if (hrs < 24) return `${hrs}h ago`;
                  return `${Math.round(hrs / 24)}d ago`;
                })()
              : 'Just now';

            return (
              <div
                key={alert._id || idx}
                className={`p-3.5 rounded-xl border transition-all text-xs ${
                  isEmergency
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950 border-l-4 border-l-rose-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200/80 text-slate-700 border-l-4 border-l-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {isEmergency ? (
                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-extrabold text-[10px] tracking-wider uppercase">
                        Emergency
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px] tracking-wider uppercase">
                        Reminder
                      </span>
                    )}
                    <span className="font-bold">{alert.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo}</span>
                </div>

                <p className="mt-1 leading-relaxed text-[12px] opacity-90">
                  {alert.message}
                </p>

                {/* Quick actions for emergency alerts */}
                {isEmergency && onNudgePatient && (
                  <div className="mt-2 pt-2 border-t border-rose-200/60 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onNudgePatient(alert)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                    >
                      <span>🔔</span> Send Nudge
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
