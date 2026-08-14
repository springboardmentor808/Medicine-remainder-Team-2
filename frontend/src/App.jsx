import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Settings, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Pill,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { useTheme } from './context/ThemeContext';

// Pages
import Dashboard from './pages/Dashboard';
import PatientsDashboard from './pages/PatientsDashboard';
import PatientProfile from './pages/PatientProfile';
import MedicationForm from './pages/MedicationForm';
import MedicationDetail from './pages/MedicationDetail';
import SettingsPage from './pages/Settings';
import NotFound from './pages/NotFound';

const App = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Clinical Dashboard', path: '/', icon: Activity },
    { name: 'Patients Directory', path: '/patients', icon: Users },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ];

  const getPageTitle = () => {
    const current = menuItems.find(item => item.path === location.pathname);
    if (current) return current.name;
    if (location.pathname.startsWith('/patients/')) return 'Patient Medical Profile';
    if (location.pathname.startsWith('/medications/')) {
      return location.pathname.endsWith('/edit') ? 'Edit Medication' : 'Medication Details';
    }
    return 'PillSync';
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/70 dark:bg-darkbg-900/70 backdrop-blur-md border-r border-slate-200/50 dark:border-slate-800/50">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="bg-primary-500 p-2.5 rounded-xl text-white shadow-glow-primary">
          <ShieldCheck className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="text-sm font-black tracking-tight bg-gradient-to-r from-primary-500 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 bg-clip-text text-transparent uppercase">
            PillSync
          </h1>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={closeMobileMenu}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary-500 text-white shadow-glow-primary' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                }
              `}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-primary-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer details */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 text-center">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-505 tracking-widest uppercase">
          Fortis Clinic ERP v1
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-darkbg-950 transition-colors duration-300 overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-full flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar Slide-in */}
      <aside className={`
        lg:hidden fixed top-0 bottom-0 left-0 z-50 w-64 max-w-[80vw] h-full transition-transform duration-300 transform
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white/40 dark:bg-darkbg-900/40 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 flex-shrink-0 z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none uppercase tracking-wider">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Switch */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-darkbg-900/50 text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 animate-spin-slow" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200/50 dark:border-slate-800/50">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-glow-primary">
                DR
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  Dr. Rajesh
                </p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">
                  Chief Physician
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main content view container */}
        <main className="flex-grow overflow-y-auto custom-scrollbar p-6 bg-slate-50/50 dark:bg-darkbg-950/50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<PatientsDashboard />} />
            <Route path="/patients/:patientId" element={<PatientProfile />} />
            <Route path="/medications/new" element={<MedicationForm />} />
            <Route path="/medications/:id/edit" element={<MedicationForm />} />
            <Route path="/medications/:id" element={<MedicationDetail />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
