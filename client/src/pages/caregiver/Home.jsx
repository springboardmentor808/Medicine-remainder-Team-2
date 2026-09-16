import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { mockPatients } from '../../mock/caregiverMock.js';

export const CAREGIVER_HOME_ROUTE = '/caregiver/home';

function PatientCard({ patient, onSchedule, onNudge, onEmergency, nudgeBusy }) {
  const adherence = Number(patient.adherence || 0);
  const isHealthy = adherence >= 80 && !patient.missedCount;
  const isWarning = (adherence >= 65 && adherence < 80) || (patient.missedCount === 1 && adherence >= 65);
  const isCritical = adherence < 65 || patient.missedCount >= 2 || patient.atRisk;

  const accentColor = isCritical ? '#dc2626' : isWarning ? '#c27803' : '#2c7a59';
  const progressBg = isCritical ? '#dc2626' : isWarning ? '#c27803' : '#2c7a59';
  const ringRadius = 18;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - Math.min(100, Math.max(0, adherence)) / 100);

  const initials = patient.name
    ? patient.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
    : 'PT';

  const subtitle = `${patient.age ? `${patient.age} YRS · ` : ''}${patient.relation || 'PATIENT'}`.toUpperCase();
  const hasAlert = patient.missedCount > 0 || patient.atRisk || isCritical;

  return (
    <article
      className="patient-card-v2"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderLeft: `5px solid ${accentColor}`,
        borderRadius: 16,
        padding: '20px 22px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: '#134e4a',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 15,
                display: 'grid',
                placeItems: 'center',
                letterSpacing: 0.5,
              }}
            >
              {initials}
            </div>
            {hasAlert && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '2px solid #ffffff',
                }}
              />
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <h4
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 700,
                color: '#1e293b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {patient.name}
            </h4>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#475569',
                background: '#eef2f6',
                padding: '2px 8px',
                borderRadius: 10,
                display: 'inline-block',
                marginTop: 4,
                letterSpacing: 0.6,
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', width: 46, height: 46, flexShrink: 0 }}>
          <svg width="46" height="46" viewBox="0 0 46 46">
            <circle cx="23" cy="23" r={ringRadius} fill="none" stroke="#f1f5f9" strokeWidth="4" />
            <circle
              cx="23"
              cy="23"
              r={ringRadius}
              fill="none"
              stroke={progressBg}
              strokeWidth="4"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              transform="rotate(-90 23 23)"
            />
            <text x="23" y="27" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">
              {adherence}
            </text>
          </svg>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', color: '#64748b' }}>
            ADHERENCE
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: progressBg }}>
            {adherence}%
          </span>
        </div>
        <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, adherence))}%`,
              background: progressBg,
              borderRadius: 9999,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {patient.missedCount === 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#dcfce7',
              color: '#15803d',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 9999,
            }}
          >
            <span style={{ fontSize: 12 }}>✓</span> ALL DOSES TAKEN
          </span>
        )}
        {patient.missedCount > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#fee2e2',
              color: '#b91c1c',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 9999,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b91c1c' }} />
            {patient.missedCount} MISSED DOSE{patient.missedCount > 1 ? 'S' : ''}
          </span>
        )}
        {patient.atRisk && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#fee2e2',
              color: '#b91c1c',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 9999,
            }}
          >
            <span>⚠️</span> AT RISK
          </span>
        )}
        {patient.lowStock && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#fef3c7',
              color: '#b45309',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 9999,
            }}
          >
            <span>📦</span> CRITICAL STOCK
          </span>
        )}
      </div>

      <div
        onClick={onSchedule}
        role="button"
        tabIndex={0}
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '11px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#e6f4ea',
            color: '#2c7a59',
            display: 'grid',
            placeItems: 'center',
            fontSize: 17,
            flexShrink: 0,
          }}
        >
          💊
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#1e293b',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {patient.nextDose?.name || 'Scheduled Medicine'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            🕒 {patient.nextDose?.time || 'Scheduled'} · {patient.nextDose?.instruction || '1 dose'}
          </div>
        </div>
        <span style={{ color: '#94a3b8', fontSize: 18, fontWeight: 700 }}>›</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <button
          onClick={onSchedule}
          style={{
            flex: 1,
            background: '#1b6b47',
            color: '#ffffff',
            border: 0,
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>📅</span> View Schedule
        </button>

        <button
          onClick={onNudge}
          disabled={nudgeBusy}
          style={{
            flex: 1,
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            color: '#0369a1',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: nudgeBusy ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>🔔</span> {nudgeBusy ? 'Sending…' : 'Send Reminder'}
        </button>
      </div>

      <button
        onClick={onEmergency}
        style={{
          background: '#dc2626',
          color: '#ffffff',
          border: 0,
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          width: '100%',
        }}
      >
        <span>📞</span> Emergency
      </button>
    </article>
  );
}

export default function CaregiverHome() {
  const [tabFilter, setTabFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [showAll, setShowAll] = useState(false);
  const [scheduleModalPatient, setScheduleModalPatient] = useState(null);
  const [emergencyModalPatient, setEmergencyModalPatient] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [nudgeBusyId, setNudgeBusyId] = useState(null);

  const attentionCount = useMemo(() => {
    return mockPatients.filter(p => p.missedCount > 0 || p.atRisk || p.adherence < 75).length;
  }, []);

  const stockCount = useMemo(() => {
    return mockPatients.filter(p => p.lowStock || p.stockDays <= 3).length;
  }, []);

  const filteredPatients = useMemo(() => {
    let list = mockPatients;
    if (tabFilter === 'attention') {
      list = list.filter(p => p.missedCount > 0 || p.atRisk || p.adherence < 75);
    } else if (tabFilter === 'stock') {
      list = list.filter(p => p.lowStock || p.stockDays <= 3);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.relation && p.relation.toLowerCase().includes(q)) ||
        (p.diagnosis && p.diagnosis.toLowerCase().includes(q)) ||
        (p.nextDose && p.nextDose.name && p.nextDose.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [tabFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const paginatedPatients = showAll ? filteredPatients : filteredPatients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleNudge = (patient) => {
    setNudgeBusyId(patient.id);
    setTimeout(() => {
      setToastMessage(`🔔 Reminder sent to ${patient.name} ✓`);
      setNudgeBusyId(null);
      setTimeout(() => setToastMessage(''), 3500);
    }, 400);
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, margin: 0, color: '#1e293b' }}>
            Care Circle
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Supervising {mockPatients.length} connected family members and patients.
          </p>
        </div>
        <Link
          to="/"
          style={{
            background: '#1b6b47',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: 9999,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ← Go to Dashboard
        </Link>
      </div>

      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            background: '#064e3b',
            color: '#ecfdf5',
            padding: '12px 24px',
            borderRadius: 9999,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            pointerEvents: 'none',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Top Bar Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setTabFilter('all'); setCurrentPage(1); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: tabFilter === 'all' ? '#1b6b47' : '#ffffff',
              color: tabFilter === 'all' ? '#ffffff' : '#1e293b',
              border: tabFilter === 'all' ? 'none' : '1px solid #cbd5e1',
              borderRadius: 9999,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            👥 All Patients ({mockPatients.length})
          </button>

          <button
            onClick={() => { setTabFilter('attention'); setCurrentPage(1); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: tabFilter === 'attention' ? '#1b6b47' : '#ffffff',
              color: tabFilter === 'attention' ? '#ffffff' : '#1e293b',
              border: tabFilter === 'attention' ? 'none' : '1px solid #cbd5e1',
              borderRadius: 9999,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ⚠️ Needs Attention ({attentionCount})
          </button>

          <button
            onClick={() => { setTabFilter('stock'); setCurrentPage(1); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: tabFilter === 'stock' ? '#1b6b47' : '#ffffff',
              color: tabFilter === 'stock' ? '#ffffff' : '#1e293b',
              border: tabFilter === 'stock' ? 'none' : '1px solid #cbd5e1',
              borderRadius: 9999,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📉 Critical Stock ({stockCount})
          </button>
        </div>

        <div style={{ position: 'relative', width: 260 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '9px 14px 9px 36px',
              borderRadius: 9999,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="caregiver-patient-grid">
        {paginatedPatients.map(patient => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onSchedule={() => setScheduleModalPatient(patient)}
            onNudge={() => handleNudge(patient)}
            onEmergency={() => setEmergencyModalPatient(patient)}
            nudgeBusy={nudgeBusyId === patient.id}
          />
        ))}
      </div>

      {/* Pagination */}
      {filteredPatients.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, padding: '12px 18px', background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            Showing {showAll ? 1 : (currentPage - 1) * pageSize + 1} - {showAll ? filteredPatients.length : Math.min(filteredPatients.length, currentPage * pageSize)} of {filteredPatients.length}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || showAll} className="outline-button compact">‹ Previous</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || showAll} className="outline-button compact">Next ›</button>
            <button onClick={() => setShowAll(s => !s)} className="outline-button compact" style={{ background: '#edf7f0', color: '#1b6b47' }}>
              {showAll ? 'Paginate (12 per page)' : `Show All (${filteredPatients.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {scheduleModalPatient && (
        <div className="modal-backdrop" onClick={() => setScheduleModalPatient(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 'min(100%, 540px)', maxHeight: '88vh', overflowY: 'auto' }}>
            <button className="close" onClick={() => setScheduleModalPatient(null)}>×</button>
            <h3 style={{ margin: 0, fontFamily: 'Fraunces, serif' }}>{scheduleModalPatient.name}</h3>
            <p style={{ margin: '4px 0 14px', color: '#64748b', fontSize: 13 }}>
              {scheduleModalPatient.age} yrs · {scheduleModalPatient.relation} · {scheduleModalPatient.diagnosis}
            </p>

            <div style={{ display: 'grid', gap: 8 }}>
              {scheduleModalPatient.medicines?.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: m.status === 'taken' ? '#f0fdf4' : '#ffffff' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>💊 {m.name} {m.dose}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>🕒 {m.schedule} ({m.slot}) · {m.quantityPerDose}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: m.status === 'taken' ? '#15803d' : '#b91c1c' }}>
                    {m.status === 'taken' ? 'Taken ✓' : 'Missed ▲'}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="primary-button compact"
                style={{ flex: 1, background: '#1b6b47' }}
                onClick={() => { handleNudge(scheduleModalPatient); }}
              >
                🔔 Send Reminder
              </button>
              <button className="outline-button compact" onClick={() => setScheduleModalPatient(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Modal */}
      {emergencyModalPatient && (
        <div className="modal-backdrop" onClick={() => setEmergencyModalPatient(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 'min(100%, 460px)', borderTop: '6px solid #dc2626' }}>
            <button className="close" onClick={() => setEmergencyModalPatient(null)}>×</button>
            <h3 style={{ margin: 0, color: '#b91c1c' }}>🚨 Emergency Contacts</h3>
            <p style={{ margin: '4px 0 14px', color: '#475569', fontSize: 13 }}>
              Immediate medical contact for <strong>{emergencyModalPatient.name}</strong>.
            </p>
            <div style={{ background: '#fef2f2', padding: 14, borderRadius: 8, border: '1px solid #fecaca' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{emergencyModalPatient.emergencyContact?.name} ({emergencyModalPatient.emergencyContact?.relation})</div>
              <a href={`tel:${emergencyModalPatient.emergencyContact?.phone}`} className="primary-button" style={{ background: '#dc2626', marginTop: 12, textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                📞 Call {emergencyModalPatient.emergencyContact?.phone}
              </a>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="outline-button compact" onClick={() => setEmergencyModalPatient(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
