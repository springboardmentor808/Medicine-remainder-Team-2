import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PatientSidebar from '../components/PatientSidebar.jsx';
import { api } from '../lib/api.js';

export default function PatientLayout() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) try { setUser(JSON.parse(saved)); } catch {}
    api('/patient/dashboard').then(d=> setUser(d.user)).catch(()=>{});
  }, []);
  function logout() {
    api('/auth/logout', { method: 'POST' }).catch(()=>{});
    localStorage.clear();
    navigate('/');
  }
  return (
    <div className="flex min-h-screen bg-[#f5f7f2]">
      <PatientSidebar user={user} onLogout={logout} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
