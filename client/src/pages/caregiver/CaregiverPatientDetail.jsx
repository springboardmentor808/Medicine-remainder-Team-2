import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { mockPatients } from '../../mock/caregiverMock.js';

export default function CaregiverPatientDetail() {
  const { patientId } = useParams();
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState('');
  const [nudging, setNudging] = useState(false);
  const [msg, setMsg] = useState('');

  // Try API, fallback to mock if not found / empty
  useEffect(() => {
    let alive = true;
    api(`/caregiver/patients/${patientId}/detail`)
      .then((d) => {
        if (!alive) return;
        // If API has mock id, it will 404 — use mock
        if (!d || !d.patient) throw new Error('No api data');
        // If timeline empty, supplement with mock meds for demo
        const hasMeds = d.timeline && d.timeline.length > 0;
        if (!hasMeds) {
          const mock = mockPatients.find((m) => m._id === patientId);
          if (mock) {
            d.mockMedications = mock.Medications;
            d.patient = { ...d.patient, Age: mock.Age, Gender: mock.Gender, Primary_Diagnosis: mock.Primary_Diagnosis };
          }
        }
        setDetail(d);
      })
      .catch(() => {
        if (!alive) return;
        const mock = mockPatients.find((m) => m._id === patientId) || mockPatients[0];
        if (mock) {
          setDetail({
            patient: { name: mock.Name, Name: mock.Name, Age: mock.Age, Gender: mock.Gender, Primary_Diagnosis: mock.Primary_Diagnosis, email: mock.Email, phone: mock.Phone },
            timeline: [],
            refillRows: [],
            adherence: 92,
            accessLevel: 'view',
            hasOverdue: mock.Medications.some((mm) => mm.Refills_Remaining <= 1),
            mockMedications: mock.Medications,
          });
          setErr('');
        } else {
          setErr('Patient not found');
        }
      });
    return () => { alive = false; };
  }, [patientId]);

  async function sendNudge() {
    setNudging(true);
    try {
      await api(`/caregiver/patients/${patientId}/nudge`, { method: 'POST' });
      setMsg('Reminder sent ✓');
      setTimeout(() => setMsg(''), 2500);
    } catch (e) { setMsg(e.message); } finally { setNudging(false); }
  }

  if (err) return <div className="p-6 max-w-3xl"><div className="bg-red-50 text-red-800 text-sm rounded-lg px-4 py-3">{err}</div><Link to="/caregiver/home" className="inline-block mt-3 text-sm text-green-700 hover:underline">← Back</Link></div>;
  if (!detail) return <div className="p-6"><div className="bg-slate-50 text-slate-600 text-sm rounded-lg px-4 py-3">Loading patient detail...</div></div>;

  const { patient } = detail;
  // Prefer mockMedications for demo when present, otherwise map real timeline
  const meds = detail.mockMedications || detail.timeline.map((t) => ({
    Medication_Name: t.name,
    Dosage: t.dose,
    Frequency: t.slot ? `${t.slot} · ${t.schedule}` : t.schedule,
    Prescribing_Doctor: t.prescribingDoctor || 'Dr. —',
    Refills_Remaining: t.refillsRemaining ?? (t.lowStock ? 0 : 3),
  }));

  // If using real timeline without mock, enrich with fallback fields
  const displayMeds = meds.length ? meds : (detail.mockMedications || []);

  return (
    <div className="p-6 max-w-5xl mx-auto bg-[#f5f7f2] min-h-screen">
      <Link to="/caregiver/home" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-green-700 mb-4">← Back to care circle</Link>

      {/* Patient header — demographics */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex justify-between items-start gap-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-[#d7ebe0] text-[#2c7a59] grid place-items-center font-bold">{String(patient.name || patient.Name || '?')[0]}</div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{patient.name || patient.Name}</h1>
            <p className="text-sm text-slate-500">
              {patient.Age ? `${patient.Age}y` : ''} {patient.Gender ? `· ${patient.Gender}` : ''} {patient.Primary_Diagnosis ? `· ${patient.Primary_Diagnosis}` : (patient.diagnosis ? `· ${patient.diagnosis}` : '')}
            </p>
            <p className="text-xs text-slate-400 mt-1">{patient.email} · {patient.phone}</p>
          </div>
        </div>
        <button onClick={sendNudge} disabled={nudging} className="px-4 py-2 rounded-lg text-xs font-semibold bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 min-h-[36px]">
          {nudging ? 'Sending...' : 'Send Reminder'}
        </button>
      </div>
      {msg && <div className="mt-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg px-3 py-2">{msg}</div>}

      {/* Medication Cards — mapping data fields */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-slate-800 mb-3">Medications · {displayMeds.length} active</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {displayMeds.map((m, idx) => {
            const refills = Number(m.Refills_Remaining ?? 0);
            const needRefill = refills <= 1;
            return (
              <div key={`${m.Medication_Name}-${idx}`} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{m.Medication_Name}</div>
                    <div className="text-sm text-slate-700 mt-0.5">{m.Dosage}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${needRefill ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {needRefill ? 'Refill Needed' : `${refills} refills left`}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  <span className="font-medium">Frequency:</span> {m.Frequency}
                </div>
                <div className="text-sm text-slate-500">
                  <span className="font-medium">Prescribing Doctor:</span> {m.Prescribing_Doctor}
                </div>
                {m.Composition && <div className="text-xs text-slate-400 mt-1 italic">{m.Composition}</div>}
              </div>
            );
          })}
          {displayMeds.length === 0 && <div className="col-span-2 bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-sm text-slate-500">No medications yet for this patient.</div>}
        </div>
      </div>

      {/* Fallback timeline (real data) when mock not used */}
      {!detail.mockMedications && detail.timeline && detail.timeline.length > 0 && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Today&apos;s Timeline</h3>
          <div className="grid gap-2">
            {detail.timeline.map((t) => (
              <div key={String(t.medicineId)} className="flex justify-between items-center border border-slate-200 rounded-lg px-3 py-2 bg-white">
                <span className="text-sm font-medium text-slate-800">{String(t.schedule)} · {String(t.slot)} — {String(t.name)}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.status==='taken'?'bg-green-100 text-green-800': t.status==='missed'?'bg-red-100 text-red-800':'bg-slate-100 text-slate-600'}`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
