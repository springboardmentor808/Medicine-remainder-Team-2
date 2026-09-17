import React, { useState, useEffect, useRef } from "react";
import {
  User, Settings, Shield, Bell, HelpCircle, LogOut,
  ChevronRight, Pill, Flame, TrendingUp, Award,
  Heart, Calendar, Moon, Sun,
} from "lucide-react";
import { C } from "../constants";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import ProgressRing from "../components/ProgressRing";

/* ─────────────────────────────────────────────────────────────
   Quick Stat (inline count-up)
   ───────────────────────────────────────────────────────────── */
function QuickStat({ icon: Icon, value, label, color, index = 0 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const dur = 800;
    const start = performance.now();
    function animate(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) ref.current = requestAnimationFrame(animate);
    }
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);

  return (
    <div
      className="glass-card"
      style={{
        padding: "16px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div
        style={{
          background: `${color}18`,
          borderRadius: 12,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 14px ${color}16`,
        }}
      >
        <Icon size={18} color={color} />
      </div>
      <p style={{ color: C.ink, fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{display}</p>
      <p style={{ color: C.faint, fontSize: 10, fontWeight: 600 }}>{label}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Menu Items
   ───────────────────────────────────────────────────────────── */
const MENU_ITEMS = [
  { icon: User,       label: "Personal Information", desc: "Name, email, phone number" },
  { icon: Bell,       label: "Notification Preferences", desc: "Reminders, alerts, sounds" },
  { icon: Shield,     label: "Privacy & Security", desc: "Password, data sharing" },
  { icon: Settings,   label: "App Settings", desc: "Language, timezone" },
  { icon: HelpCircle, label: "Help & Support", desc: "FAQ, contact, feedback" },
];

/* ═══════════════════════════════════════════════════════════════
   Profile Page
   ═══════════════════════════════════════════════════════════════ */
export default function ProfilePage({ role, onSwitchRole, onLogout, user }) {
  const displayName = user?.name || "Meera Sharma";
  const displayEmail = user?.email || "meera.sharma@mail.com";
  const initials = displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const displayRole = (user?.role || role || "patient");
  const roleLabel = displayRole.charAt(0).toUpperCase() + displayRole.slice(1);

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }} className="pb-24">
      <Header role={role} onSwitchRole={onSwitchRole} />

      <div className="max-w-3xl mx-auto px-6 pt-6">
        {/* Profile Hero Card */}
        <div
          className="glass-card animate-in"
          style={{
            padding: 24,
            marginBottom: 20,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(45,212,191,0.1) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -30,
              left: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />

          <div className="flex items-center gap-4 relative">
            {/* Avatar with animated gradient ring */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: C.gradientPrimary,
                  padding: 3,
                  animation: "breathe 4s ease-in-out infinite",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: C.cardSolid,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ color: C.ink, fontWeight: 800, fontSize: 26 }}>{initials}</span>
                </div>
              </div>
              {/* Verified badge */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: -2,
                  background: C.mint,
                  borderRadius: "50%",
                  width: 22,
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `2px solid ${C.cardSolid}`,
                  boxShadow: `0 0 8px ${C.mint}44`,
                }}
              >
                <Award size={12} color="#fff" />
              </div>
            </div>

            <div>
              <h2 style={{ color: C.ink, fontWeight: 800, fontSize: 22 }}>{displayName}</h2>
              <p style={{ color: C.sub, fontSize: 13, marginTop: 2 }}>{displayEmail}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  style={{
                    background: C.mintSoft,
                    color: C.mint,
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: "2px 10px",
                  }}
                >
                  {roleLabel}
                </span>
                <span
                  style={{
                    background: C.duskSoft,
                    color: C.dusk,
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: "2px 10px",
                  }}
                >
                  Premium
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <QuickStat icon={Pill} value={8} label="Active Meds" color={C.afternoon} index={0} />
          <QuickStat icon={Flame} value={14} label="Day Streak" color={C.morning} index={1} />
          <QuickStat icon={TrendingUp} value={82} label="Adherence %" color={C.mint} index={2} />
        </div>

        {/* Mini Adherence Ring */}
        <div
          className="glass-card"
          style={{
            padding: 20,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 20,
            animation: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "300ms",
          }}
        >
          <ProgressRing percent={82} size={80} strokeWidth={7} label="" />
          <div>
            <h3 style={{ color: C.ink, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              Weekly Overview
            </h3>
            <p style={{ color: C.sub, fontSize: 12, lineHeight: 1.5 }}>
              You've maintained an <span style={{ color: C.mint, fontWeight: 700 }}>82%</span> adherence
              rate this week. Keep going!
            </p>
            <div className="flex items-center gap-1 mt-2">
              <Heart size={12} color={C.coral} />
              <span style={{ color: C.faint, fontSize: 11 }}>14-day streak — personal best!</span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div
          className="glass-card"
          style={{
            overflow: "hidden",
            marginBottom: 20,
            animation: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "400ms",
          }}
        >
          {MENU_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    i < MENU_ITEMS.length - 1 ? `1px solid ${C.line}` : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div
                  style={{
                    background: C.glass,
                    border: `1px solid ${C.glassBorder}`,
                    borderRadius: 10,
                    width: 40,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={C.sub} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: C.ink, fontWeight: 600, fontSize: 14 }}>{item.label}</p>
                  <p style={{ color: C.faint, fontSize: 12 }}>{item.desc}</p>
                </div>
                <ChevronRight size={16} color={C.faint} />
              </button>
            );
          })}
        </div>

        {/* App Info */}
        <div
          className="glass-card"
          style={{
            padding: "14px 20px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "500ms",
          }}
        >
          <div className="flex items-center gap-3">
            <Calendar size={16} color={C.faint} />
            <div>
              <p style={{ color: C.sub, fontSize: 13, fontWeight: 600 }}>Member since</p>
              <p style={{ color: C.faint, fontSize: 12 }}>August 2026</p>
            </div>
          </div>
          <span style={{ color: C.faint, fontSize: 11 }}>v1.0.0</span>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            background: C.coralSoft,
            border: `1px solid rgba(251,113,133,0.2)`,
            borderRadius: 14,
            width: "100%",
            padding: "14px",
            color: C.coral,
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.3s ease",
            animation: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "600ms",
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
