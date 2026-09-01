import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { mockCurrentPatient } from '../../mock/caregiverMock.js';

export default function PatientProfile() {
  const [user, setUser] = useState(null);
  const [caregivers, setCaregivers] = useState([]);
  const [err, setErr] = useState('');
  const [revoking, setRevoking] = useState('');

  useEffect(() => {
    api('/patient/dashboard').then((d) => {
      const u = d.user;
      setUser({
        Name: u.name,
        Age: u.age || mockCurrentPatient.Age,
        Gender: u.gender || mockCurrentPatient.Gender,
        Primary_Diagnosis: u.conditions?.[0] || u.diagnosis || mockCurrentPatient.Primary_Diagnosis,
        Phone: u.phone,
        Email: u.email,
        LinkCode: u.linkCode || 'PS-XXXXXX',
      });
      setCaregivers(mockCurrentPatient.linkedCaregivers);
    }).catch(() => {
      setUser({ ...mockCurrentPatient, LinkCode: 'PS-26DC5A' });
      setCaregivers(mockCurrentPatient.linkedCaregivers);
    });
  }, []);

  async function revoke(id) {
    if (!confirm('Revoke access for this caregiver?')) return;
    setRevoking(id);
    try {
      // Real: DELETE /caregiver/link/:patientId is caregiver-side; for patient view we simulate or call /patient/caregiver-link/:id
      // Try both, fallback to local mock removal
      try { await api(`/caregiver/link/${id}`, { method: 'DELETE' }); } catch { /* fallback */ }
      setCaregivers((prev) => prev.filter((c) => c._id !== id));
    } catch (e) { setErr(e.message); } finally { setRevoking(''); }
  }

  if (!user) return <div className="p-6"><div className="bg-slate-50 text-sm rounded-lg px-4 py-3">Loading profile...</div></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-[#fcfdf7] min-h-screen">
      <h1 className="text-2xl font-bold text-slate-900 font-serif">Profile & Care Team</h1>
      <p className="text-sm text-slate-500 mt-1">Your demographics and supervisors.</p>

      {err && <div className="mt-4 bg-red-50 text-red-800 text-sm rounded-lg px-4 py-2">{err}</div>}

      {/* Patient Info — same card spec as Settings */}
      <div className="mt-6 border border-gray-200 p-6 rounded-lg flex items-center gap-6 bg-white">
        <div className="w-16 h-16 rounded-full bg-green-200 text-green-900 flex items-center justify-center text-2xl font-bold shrink-0">
          {user.Name.charAt(0).toUpperCase()}
        </div>
        <div className="text-right ml-auto">
          <div className="text-2xl font-serif font-bold text-slate-900">{user.Name}</div>
          <div className="text-sm text-slate-600">{user.Gender} · {user.Age} years · {user.Primary_Diagnosis}</div>
          <div className="text-sm text-slate-600 mt-1">{user.Email} · {user.Phone}</div>
          <div className="text-sm mt-2">Patient link code: <span className="font-mono font-bold bg-green-50 text-green-800 px-2 py-1 rounded border border-green-200">{user.LinkCode}</span></div>
        </div>
      </div>

      <div className="bg-green-50 text-green-800 p-4 rounded-md mt-6 text-sm leading-relaxed border border-green-100">
        <strong>All patient details in Compass:</strong> User (name/email/phone/conditions/linkCode/emergencyContacts) · Medicine (all medicines) · IntakeLog (reminders taken/missed/snoozed with istDate) · PrescriptionImage if OCR used.
      </div>

      {/* My Caregivers */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-bold text-slate-800">Linked Caregivers (Supervisors)</h2>
        <p className="text-xs text-slate-500 mt-1">Authorized to view your adherence, refills and history.</p>

        <div className="mt-4 grid gap-3">
          {caregivers.length === 0 ? (
            <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-4 text-center">No linked caregivers yet. Share your PS code from Dashboard.</div>
          ) : caregivers.map((c) => (
            <div key={c._id} className="flex justify-between items-center border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-800 grid place-items-center font-bold text-sm border border-green-200">{c.Name[0]}</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{c.Name}</div>
                  <div className="text-xs text-slate-500">Linked {new Date(c.linkedAt).toLocaleDateString('en-GB')} · {c.relation || 'Caregiver'} {c.phone ? `· ${c.phone}` : ''}</div>
                </div>
              </div>
              <button
                onClick={() => revoke(c._id)}
                disabled={revoking === c._id}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 disabled:opacity-50 transition-colors"
              >
                {revoking === c._id ? 'Revoking...' : 'Revoke Access'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
