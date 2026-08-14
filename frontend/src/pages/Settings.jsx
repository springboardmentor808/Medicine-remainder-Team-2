import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Database, 
  Moon, 
  Sun, 
  RefreshCw, 
  Trash2,
  Lock,
  Eye
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import Card from '../components/UI/Card';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [simulatedUserId, setSimulatedUserId] = useState(() => {
    return localStorage.getItem('medi-track-user-id') || 'default-user';
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleSaveUserId = () => {
    localStorage.setItem('medi-track-user-id', simulatedUserId.trim());
    showToast(`Active patient profile switched to: "${simulatedUserId.trim()}"`, 'success');
    // Refresh page to load correct data
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  // Re-seed DB trigger
  const handleReSeed = async () => {
    setSeeding(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'https://pillsync-3.onrender.com/api';
      // Send API post to trigger backend seed function
      const response = await fetch(`${apiBase}/dashboard/reset-seed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': simulatedUserId
        }
      });
      const data = await response.json();
      if (data && data.success) {
        showToast('Database reset and re-seeded with 30-day compliance logs!', 'success');
        // Refresh page to load correct data
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        throw new Error(data.message || 'Seeding call failed');
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSeeding(false);
    }
  };

  // Clear all data trigger
  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to clear all medications and history logs? This cannot be undone.')) {
      return;
    }

    setClearing(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'https://pillsync-3.onrender.com/api';
      const response = await fetch(`${apiBase}/dashboard/clear-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': simulatedUserId
        }
      });
      const data = await response.json();
      if (data && data.success) {
        showToast('All medications and history logs cleared.', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(data.message || 'Clear call failed');
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          Control Panel & Simulator Settings
        </h3>
        <p className="text-xs text-slate-400">
          Configure patient details, toggle application styling themes, and seed simulated tracking history logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Navigation / Cards column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Theme card */}
          <Card className="text-left">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
              <Sun className="w-5 h-5 text-amber-500" /> Theme Styling Preferences
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-normal">
              Toggle the user interface styling appearance between Light Mode and Dark Mode.
            </p>

            <button
              onClick={toggleTheme}
              className="px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
                  <span>Switch to Light Theme</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>Switch to Dark Theme</span>
                </>
              )}
            </button>
          </Card>

          {/* Simulated User Profile */}
          <Card className="text-left">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-primary-500" /> Patient Profile Simulator
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-normal">
              Change the active Patient User ID to test authentication readiness and separate log boundaries.
            </p>

            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                className="flex-grow px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-darkbg-850 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
                value={simulatedUserId}
                onChange={(e) => setSimulatedUserId(e.target.value)}
              />
              <button
                onClick={handleSaveUserId}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                Apply Profile
              </button>
            </div>
          </Card>

          {/* Reminders simulated toggle */}
          <Card className="text-left">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-indigo-500" /> Notifications & Alerts
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-normal">
              Toggle simulated reminders. (Note: These simulate SMS/Push medication reminders in a full production system).
            </p>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-darkbg-900 rounded-xl border border-slate-200/50 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-650 dark:text-slate-350">Reminders Alert Notifications</span>
              <button
                type="button"
                onClick={() => {
                  setNotificationsEnabled(!notificationsEnabled);
                  showToast(`Notifications ${!notificationsEnabled ? 'enabled' : 'disabled'}!`, 'info');
                }}
                className={`
                  w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none
                  ${notificationsEnabled ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'}
                `}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </Card>
        </div>

        {/* Database administration card */}
        <div>
          <Card className="text-left flex flex-col justify-between h-full">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-emerald-500" /> DB Administration
              </h4>
              <p className="text-xs text-slate-400 mb-6 leading-normal">
                Administrative tools to initialize the database with seed records or wipe logs.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleReSeed}
                disabled={seeding}
                className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-650/40 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
                <span>{seeding ? 'Seeding Data...' : 'Re-Seed Database'}</span>
              </button>

              <button
                onClick={handleClearData}
                disabled={clearing}
                className="w-full px-4 py-2.5 border border-red-200 dark:border-red-950/20 hover:bg-red-500/10 text-red-500 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{clearing ? 'Clearing Data...' : 'Clear All Data'}</span>
              </button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
