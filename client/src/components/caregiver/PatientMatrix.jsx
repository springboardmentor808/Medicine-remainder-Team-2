import React, { useState } from 'react';

// Status badge helper based on adherence percentage & missed count
function getPatientStatus(adherence = 0, missedCount = 0) {
  const adh = Number(adherence);
  if (adh < 65 || missedCount >= 2) {
    return {
      label: 'Critical',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      dotClass: 'bg-rose-500 animate-pulse',
      borderAccent: 'border-l-rose-600',
    };
  }
  if (adh < 80 || missedCount === 1) {
    return {
      label: 'Action Needed',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      dotClass: 'bg-amber-500',
      borderAccent: 'border-l-amber-500',
    };
  }
  return {
    label: 'On Track',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
    borderAccent: 'border-l-emerald-600',
  };
}

export default function PatientMatrix({ patients = [], onSelectPatient, onNudge }) {
  const [nudgeLoadingMap, setNudgeLoadingMap] = useState({});
  const [nudgeSuccessMap, setNudgeSuccessMap] = useState({});

  async function handleNudgeClick(e, patient) {
    e.stopPropagation();
    const pid = patient._id || patient.id;
    if (nudgeLoadingMap[pid]) return;

    setNudgeLoadingMap(prev => ({ ...prev, [pid]: true }));
    try {
      if (onNudge) {
        await onNudge(patient);
      }
      setNudgeSuccessMap(prev => ({ ...prev, [pid]: 'SMS Nudge Sent ✓' }));
      setTimeout(() => {
        setNudgeSuccessMap(prev => {
          const next = { ...prev };
          delete next[pid];
          return next;
        });
      }, 3500);
    } catch (err) {
      console.error('Nudge error:', err);
      setNudgeSuccessMap(prev => ({ ...prev, [pid]: 'Failed to send' }));
    } finally {
      setNudgeLoadingMap(prev => ({ ...prev, [pid]: false }));
    }
  }

  if (!patients || patients.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3 text-xl">
          👥
        </div>
        <h4 className="text-slate-800 font-semibold text-base mb-1">No Connected Patients</h4>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Connect your family members or care recipients using their unique PillSync link code.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {patients.map((patient, idx) => {
        const pid = patient._id || patient.id || idx;
        const adherence = Number(patient.adherence ?? 85);
        const missedCount = Number(patient.missedCount ?? 0);
        const status = getPatientStatus(adherence, missedCount);
        const isNudging = !!nudgeLoadingMap[pid];
        const nudgeToast = nudgeSuccessMap[pid];

        // Initials avatar
        const initials = patient.name
          ? patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
          : 'PT';

        return (
          <div
            key={pid}
            onClick={() => onSelectPatient && onSelectPatient(patient)}
            className={`bg-white rounded-2xl border border-slate-200 border-l-[6px] ${status.borderAccent} p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer relative group flex flex-col justify-between`}
          >
            {/* Top row: Patient Info & Status Badge */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-900 text-white flex items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
                    {initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base group-hover:text-teal-900 transition-colors flex items-center gap-1.5">
                      <span>{patient.name}</span>
                      <span className="text-xs text-slate-400 group-hover:translate-x-0.5 transition-transform">
                        →
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {patient.age ? `${patient.age} yrs · ` : ''}{patient.relation || 'Patient'}
                      {patient.phone ? ` · ${patient.phone}` : ''}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${status.badgeClass} whitespace-nowrap`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                  {status.label}
                </span>
              </div>

              {/* 7-day adherence progress bar */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 my-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">7-Day Adherence:</span>
                  <span
                    className={`font-black text-sm ${
                      adherence >= 80
                        ? 'text-emerald-600'
                        : adherence >= 65
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {adherence}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      adherence >= 80
                        ? 'bg-emerald-500'
                        : adherence >= 65
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(4, Math.min(100, adherence))}%` }}
                  />
                </div>
              </div>

              {/* Schedule & Runway Snippet */}
              <div className="text-xs text-slate-500 space-y-1 mb-4">
                <div className="flex items-center justify-between">
                  <span>Next Dose:</span>
                  <strong className="text-slate-800 font-semibold">
                    {patient.nextDose || '08:00 AM · Morning'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Stock Runway:</span>
                  <span
                    className={`font-semibold ${
                      patient.lowStock ? 'text-amber-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    {patient.stock || 'Healthy (24+ days)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Nudge & Deep Dive */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                disabled={isNudging}
                onClick={e => handleNudgeClick(e, patient)}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  nudgeToast
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200'
                }`}
              >
                <span>🔔</span>
                <span>
                  {isNudging ? 'Sending SMS...' : nudgeToast || 'Send Nudge'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectPatient && onSelectPatient(patient)}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <span>Analytics</span>
                <span className="text-[10px]">📊</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
