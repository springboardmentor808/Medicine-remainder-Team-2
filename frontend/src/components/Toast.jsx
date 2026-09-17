import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle2, XCircle, Timer, Bell, X, AlertTriangle } from "lucide-react";
import { C } from "../constants";

const ToastContext = createContext(null);

const TOAST_CONFIG = {
  success: { icon: CheckCircle2, color: C.mint,   bg: C.mintSoft    },
  error:   { icon: XCircle,      color: C.coral,  bg: C.coralSoft   },
  warning: { icon: AlertTriangle, color: C.morning, bg: C.morningSoft },
  info:    { icon: Bell,         color: C.afternoon, bg: C.afternoonSoft },
  snoozed: { icon: Timer,        color: C.dusk,   bg: C.duskSoft    },
};

function ToastItem({ toast, onDismiss }) {
  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
  const Icon = config.icon;
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      style={{
        background: "rgba(21, 28, 44, 0.95)",
        border: `1px solid ${config.color}33`,
        borderRadius: 14,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 300,
        maxWidth: 420,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 12px ${config.color}22`,
        backdropFilter: "blur(16px)",
        animation: exiting
          ? "slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          : "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: config.bg,
          borderRadius: 10,
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={config.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <p style={{ color: C.ink, fontWeight: 700, fontSize: 13, marginBottom: 1 }}>{toast.title}</p>
        )}
        <p style={{ color: C.sub, fontSize: 12, lineHeight: 1.4 }}>{toast.message}</p>
      </div>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 4,
          color: C.faint,
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 2,
          background: config.color,
          borderRadius: "0 0 14px 14px",
          animation: `toastProgress ${toast.duration || 3000}ms linear forwards`,
        }}
      />
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback((toast) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Toast container */}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: "auto" }}>
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
