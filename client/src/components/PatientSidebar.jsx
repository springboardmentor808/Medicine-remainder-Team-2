import { NavLink } from 'react-router-dom';

const links = [
  { to: '/patient/home', label: 'Overview', icon: '⌂', end: true },
  { to: '/patient/schedule', label: 'Schedule', icon: '▦' },
  { to: '/patient/history', label: 'Medication History', icon: '◷' },
  { to: '/patient/prescriptions', label: 'My Prescriptions', icon: '🖼' },
  { to: '/patient/profile', label: 'Profile & Care Team', icon: '◎' },
  // legacy keeps — not removed per "dont change existing navbar just add"
  { to: '/patient/medicines', label: 'My medicines', icon: '◉' },
  { to: '/patient/scan', label: 'Scan prescription', icon: '▣' },
  { to: '/patient/refill', label: 'Refill', icon: '◍' },
];

export default function PatientSidebar({ user, onLogout }) {
  return (
    <aside className="w-[240px] shrink-0 bg-white border-r border-[#e2e8e1] flex flex-col p-5 min-h-screen">
      <div className="flex items-center gap-2 text-xl font-semibold tracking-tight mb-8">
        <span className="grid place-items-center bg-[#2c7a59] text-white w-6 h-6 rounded-md text-sm">+</span>
        <span>pill<span className="text-[#2c7a59]">sync</span></span>
      </div>

      <div className="flex items-center gap-2.5 pb-6 mb-2 border-b border-[#e2e8e1]">
        <div className="w-8 h-8 rounded-full grid place-items-center bg-[#d7ebe0] text-[#2c7a59] font-bold text-xs">
          {user?.name?.[0] || 'P'}
        </div>
        <div className="leading-tight">
          <div className="text-xs font-bold text-[#24302b]">{user?.name || 'Patient'}</div>
          <div className="text-[11px] text-[#7a837d]">Patient</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 border-l-4 ${
                isActive
                  ? 'bg-green-50 text-green-800 border-r-4 border-green-600 border-l-green-600'
                  : 'text-[#8a958e] border-transparent hover:bg-[#f5f7f2] hover:text-[#24302b] border-l-transparent'
              }`
            }
          >
            <span className="w-4 text-center text-[13px]">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 pt-6 border-t border-[#e2e8e1]">
        <NavLink
          to="/patient/profile"
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold border-l-4 ${isActive ? 'bg-green-50 text-green-800 border-r-4 border-green-600 border-l-green-600' : 'text-[#8a958e] border-transparent'}`}
        >
          <span className="w-4 text-center">⚙</span> Settings
        </NavLink>
        <button onClick={onLogout} className="text-left px-3 py-2 text-xs font-semibold text-[#a27d6c] hover:text-[#8a5a44] transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  );
}
