import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3.5s
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      
      {/* Toast Overlay Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg glass-card animate-slide-in relative overflow-hidden`}
            style={{
              borderColor: 
                toast.type === 'success' ? '#10b981' :
                toast.type === 'error' ? '#ef4444' :
                toast.type === 'warning' ? '#f59e0b' : '#3b82f6'
            }}
          >
            {/* Action color indicator strip */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{
                backgroundColor: 
                  toast.type === 'success' ? '#10b981' :
                  toast.type === 'error' ? '#ef4444' :
                  toast.type === 'warning' ? '#f59e0b' : '#3b82f6'
              }}
            />

            {/* Icon */}
            <div className="flex-shrink-0">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            </div>

            {/* Message Content */}
            <div className="flex-grow pr-4">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{toast.message}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
