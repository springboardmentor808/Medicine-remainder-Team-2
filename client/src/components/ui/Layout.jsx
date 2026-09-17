import { useLanguage } from '../../AppInteractive';

export function Sidebar({ user, active, setActive, logout }) {
  const { t } = useLanguage();
  const items = user.role === 'patient'
    ? [['overview', t('nav_overview')], ['medicines', t('nav_medicines')], ['scan', t('nav_scan')], ['history', t('nav_history')]]
    : [['overview', t('nav_overview')], ['patients', t('nav_patients')], ['alerts', t('nav_alerts')]];
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">+</span> {t('brand')}<span>{t('sync')}</span></div>
      <div className="profile-mini">
        <div className="avatar">{user.name[0]}</div>
        <div><strong>{user.name}</strong><small>{user.role === 'patient' ? t('patient_login') : t('caregiver_login')}</small></div>
      </div>
      <nav>
        {items.map(([id, label]) => (
          <button key={id} className={active === id ? 'active' : ''} onClick={() => setActive(id)}>
            <span className="nav-icon">{id === 'overview' ? '⌂' : id === 'scan' ? '▣' : id === 'alerts' ? '!' : id === 'history' ? '▥' : '◉'}</span>
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button onClick={() => setActive('settings')}><span className="nav-icon">⚙</span>{t('nav_settings')}</button>
        <button className="logout" onClick={logout}>{t('nav_signout')}</button>
      </div>
    </aside>
  );
}

export function Header({ title, intro, action }) {
  const { t } = useLanguage();
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{t('header_title')}</p>
        <h1>{title}</h1>
        <p className="muted">{intro}</p>
      </div>
      <div className="header-action" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>{action}</div>
    </header>
  );
}

export function DashboardShell({ sidebar, children }) {
  return <div className="app-shell">{sidebar}<main className="dashboard">{children}</main></div>;
}
