import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, Timer, Bell, BellOff,
  Sunrise, Sun, Moon, Clock, Calendar, Trash2,
} from "lucide-react";
import { C, SLOTS } from "../constants";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import StatCard from "../components/StatCard";
import { SkeletonList, SkeletonStatRow } from "../components/SkeletonLoader";
import { useToast } from "../components/Toast";
import * as api from "../api";

const TYPE_CONFIG = {
  taken:    { icon: CheckCircle2, color: C.mint,      bg: C.mintSoft,      label: "Taken" },
  missed:   { icon: XCircle,      color: C.coral,     bg: C.coralSoft,     label: "Missed" },
  snoozed:  { icon: Timer,        color: C.dusk,      bg: C.duskSoft,      label: "Snoozed" },
  reminder: { icon: Bell,         color: C.afternoon,  bg: C.afternoonSoft, label: "Reminder" },
};

const SLOT_ICONS = { morning: Sunrise, afternoon: Sun, night: Moon, custom: Clock };

/* Normalize notification field names */
function normalize(n) {
  return {
    id: n.id,
    type: n.type,
    med_name: n.med_name || n.medName,
    dosage: n.dosage,
    time: n.time,
    date: n.date,
    slot: n.slot,
    snooze_until: n.snooze_until || n.snoozeUntil || null,
  };
}

/* Build summary counts */
function buildSummary(notifs) {
  const s = { taken: 0, missed: 0, snoozed: 0, total: notifs.length };
  notifs.forEach((n) => {
    if (n.type === "taken") s.taken++;
    else if (n.type === "missed") s.missed++;
    else if (n.type === "snoozed") s.snoozed++;
  });
  return s;
}

/* ═══════════════════════════════════════════════════════════════
   Notification Card
   ═══════════════════════════════════════════════════════════════ */
function NotificationCard({ notification, onDelete, index }) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.reminder;
  const Icon = config.icon;
  const SlotIcon = SLOT_ICONS[notification.slot] || Clock;

  return (
    <div
      className="glass-card"
      style={{
        padding: 16,
        transition: "all 0.3s ease",
        animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          style={{
            background: config.bg,
            borderRadius: 12,
            width: 42,
            height: 42,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 12px ${config.color}18`,
          }}
        >
          <Icon size={20} color={config.color} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p style={{ color: C.ink, fontWeight: 700, fontSize: 14 }}>
              {notification.med_name}
            </p>
            <span
              style={{
                color: config.color,
                fontSize: 10,
                fontWeight: 700,
                background: config.bg,
                borderRadius: 999,
                padding: "2px 8px",
              }}
            >
              {config.label}
            </span>
          </div>
          <p style={{ color: C.sub, fontSize: 12 }}>{notification.dosage}</p>
          <div className="flex items-center gap-3 mt-1.5" style={{ color: C.faint, fontSize: 11 }}>
            <span className="flex items-center gap-1">
              <SlotIcon size={11} /> {notification.time}
            </span>
            {notification.snooze_until && (
              <span className="flex items-center gap-1" style={{ color: C.dusk }}>
                <Timer size={11} /> Snoozed to {notification.snooze_until}
              </span>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(notification.id)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 4,
            flexShrink: 0,
            transition: "opacity 0.2s ease",
            opacity: 0.4,
          }}
          onMouseEnter={(e) => (e.target.style.opacity = 1)}
          onMouseLeave={(e) => (e.target.style.opacity = 0.4)}
        >
          <Trash2 size={14} color={C.faint} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Notifications Page
   ═══════════════════════════════════════════════════════════════ */
export default function NotificationsPage({ role, onSwitchRole }) {
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({ taken: 0, missed: 0, snoozed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [notifs, summ] = await Promise.all([
        api.getNotifications(filter === "all" ? undefined : filter),
        api.getNotificationSummary(),
      ]);
      setNotifications(notifs.map(normalize));
      setSummary({ ...summ, total: notifs.length });
    } catch (err) {
      console.warn("API unavailable:", err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    const n = notifications.find((x) => x.id === id);
    try {
      await api.deleteNotification(id);
    } catch (err) {
      console.error(err);
    }
    setNotifications((prev) => prev.filter((x) => x.id !== id));
    setSummary((s) => ({ ...s, total: Math.max(0, s.total - 1) }));
    toast({ type: "info", message: `${n?.med_name} notification removed` });
  };

  const handleClearAll = async () => {
    try {
      await api.clearAllNotifications();
    } catch (err) {
      console.error(err);
    }
    setNotifications([]);
    setSummary({ taken: 0, missed: 0, snoozed: 0, total: 0 });
    toast({ type: "info", message: "All notifications cleared" });
  };

  const filters = [
    { id: "all",     label: "All",     icon: Bell },
    { id: "taken",   label: "Taken",   icon: CheckCircle2 },
    { id: "missed",  label: "Missed",  icon: XCircle },
    { id: "snoozed", label: "Snoozed", icon: Timer },
  ];

  // Group by date
  const grouped = notifications.reduce((acc, n) => {
    const dateKey = n.date || "Other";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(n);
    return acc;
  }, {});

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }} className="pb-24">
      <Header role={role} onSwitchRole={onSwitchRole} />

      <div className="max-w-3xl mx-auto px-6 pt-6">
        <div className="flex items-center justify-between mb-1 animate-in">
          <h1 style={{ color: C.ink, fontWeight: 800, fontSize: 24 }}>Notifications</h1>
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                background: C.coralSoft,
                color: C.coral,
                border: `1px solid rgba(251,113,133,0.2)`,
                borderRadius: 10,
                padding: "6px 14px",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.3s ease",
              }}
            >
              <Trash2 size={13} /> Clear All
            </button>
          )}
        </div>
        <p style={{ color: C.sub, fontSize: 14, marginBottom: 20 }} className="animate-in">
          Track all your medication activity
        </p>

        {/* Summary Stats */}
        {loading ? (
          <div className="mb-5">
            <SkeletonStatRow count={4} />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 mb-5">
            <StatCard icon={CheckCircle2} count={summary.taken} label="Taken" color={C.mint} softBg={C.mintSoft} index={0} />
            <StatCard icon={XCircle} count={summary.missed} label="Missed" color={C.coral} softBg={C.coralSoft} index={1} />
            <StatCard icon={Timer} count={summary.snoozed} label="Snoozed" color={C.dusk} softBg={C.duskSoft} index={2} />
            <StatCard icon={Bell} count={summary.total} label="Total" color={C.afternoon} softBg={C.afternoonSoft} index={3} />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5 no-scrollbar">
          {filters.map((f) => {
            const FilterIcon = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  background: filter === f.id ? C.gradientPrimary : C.glass,
                  color: filter === f.id ? "#fff" : C.sub,
                  border: filter === f.id ? "none" : `1px solid ${C.glassBorder}`,
                  borderRadius: 999,
                  padding: "7px 14px",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: filter === f.id ? "0 4px 12px rgba(45,212,191,0.2)" : "none",
                }}
              >
                <FilterIcon size={13} /> {f.label}
              </button>
            );
          })}
        </div>

        {/* Grouped Notifications */}
        {loading ? (
          <SkeletonList count={4} />
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2.5">
                  <Calendar size={13} color={C.faint} />
                  <span
                    style={{
                      color: C.faint,
                      fontWeight: 700,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {date}
                  </span>
                  <div style={{ flex: 1, height: 1, background: C.line }} />
                </div>
                <div className="space-y-2">
                  {items.map((n, i) => (
                    <NotificationCard key={n.id} notification={n} onDelete={handleDelete} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div
            className="glass-card animate-in"
            style={{
              padding: 40,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                background: C.glass,
                borderRadius: 20,
                width: 64,
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <BellOff size={28} color={C.faint} />
            </div>
            <p style={{ color: C.sub, fontSize: 14 }}>No notifications</p>
            <p style={{ color: C.faint, fontSize: 12, marginTop: 4 }}>
              Your activity will appear here
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
