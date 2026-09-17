import React, { useState, useEffect, useCallback } from "react";
import {
  Sunrise, Sun, Moon, AlertTriangle, CheckCircle2, RotateCcw,
  Send, Clock, Pill, TrendingUp, Activity, Calendar, Target,
  Heart, Zap, ArrowUpRight, ArrowDownRight, Filter, Download,
  BarChart3, FileText, Shield, Mail,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, PieChart, Pie, LineChart, Line, CartesianGrid,
  RadialBarChart, RadialBar,
} from "recharts";
import { C, SLOTS } from "../constants";
import DashboardLayout from "../components/DashboardLayout";
import ProgressRing from "../components/ProgressRing";
import AnimatedCard from "../components/AnimatedCard";
import { SkeletonList, SkeletonStatRow, SkeletonRing } from "../components/SkeletonLoader";
import { useToast } from "../components/Toast";
import * as api from "../api";

/* ─────────────────────────────────────────────────────────────
   Helper: get time-based greeting
   ───────────────────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ─────────────────────────────────────────────────────────────
   Mock Data for Charts
   ───────────────────────────────────────────────────────────── */
const WEEKLY_DATA = [
  { day: "Mon", taken: 6, missed: 2, total: 8 },
  { day: "Tue", taken: 7, missed: 1, total: 8 },
  { day: "Wed", taken: 5, missed: 3, total: 8 },
  { day: "Thu", taken: 8, missed: 0, total: 8 },
  { day: "Fri", taken: 7, missed: 1, total: 8 },
  { day: "Sat", taken: 6, missed: 2, total: 8 },
  { day: "Sun", taken: 4, missed: 4, total: 8 },
];

const MONTHLY_TREND = [
  { week: "Week 1", adherence: 72 },
  { week: "Week 2", adherence: 78 },
  { week: "Week 3", adherence: 85 },
  { week: "Week 4", adherence: 82 },
  { week: "Week 5", adherence: 90 },
  { week: "Week 6", adherence: 88 },
];

const SLOT_DISTRIBUTION = [
  { name: "Morning", value: 3, color: C.morning },
  { name: "Afternoon", value: 2, color: C.afternoon },
  { name: "Night", value: 2, color: C.dusk },
  { name: "Custom", value: 1, color: C.sub },
];

const HOURLY_ACTIVITY = [
  { hour: "6am", activity: 0 },
  { hour: "7am", activity: 1 },
  { hour: "8am", activity: 3 },
  { hour: "9am", activity: 1 },
  { hour: "10am", activity: 0 },
  { hour: "11am", activity: 1 },
  { hour: "12pm", activity: 0 },
  { hour: "1pm", activity: 0 },
  { hour: "2pm", activity: 2 },
  { hour: "3pm", activity: 1 },
  { hour: "4pm", activity: 0 },
  { hour: "5pm", activity: 0 },
  { hour: "6pm", activity: 0 },
  { hour: "7pm", activity: 0 },
  { hour: "8pm", activity: 1 },
  { hour: "9pm", activity: 2 },
  { hour: "10pm", activity: 1 },
];

const SPARKLINE_DATA = {
  meds: [{ v: 5 }, { v: 6 }, { v: 6 }, { v: 7 }, { v: 7 }, { v: 8 }, { v: 8 }],
  taken: [{ v: 2 }, { v: 3 }, { v: 4 }, { v: 5 }, { v: 5 }, { v: 6 }, { v: 3 }],
  pending: [{ v: 5 }, { v: 4 }, { v: 3 }, { v: 2 }, { v: 2 }, { v: 1 }, { v: 4 }],
  missed: [{ v: 1 }, { v: 1 }, { v: 0 }, { v: 1 }, { v: 0 }, { v: 1 }, { v: 1 }],
};

const MED_PERFORMANCE = [
  { name: "Amlodipine", adherence: 95, color: C.mint },
  { name: "Metformin", adherence: 88, color: C.afternoon },
  { name: "Omeprazole", adherence: 91, color: C.mint },
  { name: "Aspirin", adherence: 84, color: C.afternoon },
  { name: "Levothyroxine", adherence: 80, color: C.dusk },
  { name: "Vitamin D3", adherence: 72, color: C.morning },
  { name: "Calcium + D3", adherence: 78, color: C.dusk },
  { name: "Atorvastatin", adherence: 65, color: C.coral },
];

const COMPLIANCE_RADIAL = [{ name: "Adherence", value: 82, fill: C.mint }];

/* ─────────────────────────────────────────────────────────────
   Mini Sparkline
   ───────────────────────────────────────────────────────────── */
function MiniSparkline({ data, color }) {
  return (
    <div className="sparkline-wrap">
      <ResponsiveContainer width="100%" height={32}>
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Reports Header
   ───────────────────────────────────────────────────────────── */
function ReportsHeader({ userName, isCaregiver }) {
  const [range, setRange] = useState("7d");
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="report-header animate-in">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <BarChart3 size={16} color={C.mint} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.mint, textTransform: "uppercase", letterSpacing: "0.8px" }}>
            Health Analytics Dashboard
          </span>
        </div>
        <h1 style={{ color: C.ink, fontWeight: 800, fontSize: 26, margin: "0 0 4px" }}>
          {isCaregiver ? `Care Report — ${userName}` : "Medication Compliance Report"}
        </h1>
        <p style={{ color: C.sub, fontSize: 13, margin: 0 }}>{today}</p>
      </div>
      <div className="report-header-actions">
        {["7d", "30d", "90d"].map((r) => (
          <button
            key={r}
            className={`report-pill ${range === r ? "active" : ""}`}
            onClick={() => setRange(r)}
          >
            {r === "7d" ? "Last 7 Days" : r === "30d" ? "Last 30 Days" : "Last 90 Days"}
          </button>
        ))}
        <button className="report-pill" style={{ gap: 4 }}>
          <Download size={12} /> Export PDF
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   KPI Summary Banner
   ───────────────────────────────────────────────────────────── */
function KpiBanner({ percent, taken, total, streak, activeMeds }) {
  return (
    <div className="kpi-banner animate-in">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: C.mintSoft, borderRadius: 12, padding: 10 }}>
          <Shield size={20} color={C.mint} />
        </div>
        <div>
          <p style={{ color: C.ink, fontWeight: 700, fontSize: 14, margin: 0 }}>Overall Compliance Score</p>
          <p style={{ color: C.sub, fontSize: 12, margin: "2px 0 0" }}>Based on last 30 days of medication data</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div className="kpi-banner-metric">
          <div className="num" style={{ color: C.mint }}>{percent}%</div>
          <div className="lbl">Adherence</div>
        </div>
        <div className="kpi-divider" />
        <div className="kpi-banner-metric">
          <div className="num">{taken}/{total}</div>
          <div className="lbl">Doses Today</div>
        </div>
        <div className="kpi-divider" />
        <div className="kpi-banner-metric">
          <div className="num">{streak}</div>
          <div className="lbl">Day Streak</div>
        </div>
        <div className="kpi-divider" />
        <div className="kpi-banner-metric">
          <div className="num" style={{ color: C.dusk }}>{activeMeds}</div>
          <div className="lbl">Active Meds</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Compliance Report Panel
   ───────────────────────────────────────────────────────────── */
function ComplianceReport({ percent }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">
          <FileText size={16} color={C.dusk} /> Compliance Summary
        </h3>
        <button className="chart-export-btn"><Download size={11} /> CSV</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <ResponsiveContainer width={100} height={100}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{ ...COMPLIANCE_RADIAL[0], value: percent }]}>
            <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "rgba(255,255,255,0.04)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="compliance-grid" style={{ flex: 1 }}>
          <div className="compliance-item">
            <div className="value" style={{ color: C.mint }}>{percent}%</div>
            <div className="label">Weekly Rate</div>
          </div>
          <div className="compliance-item">
            <div className="value" style={{ color: C.afternoon }}>12</div>
            <div className="label">Day Streak</div>
          </div>
          <div className="compliance-item">
            <div className="value" style={{ color: C.morning }}>3</div>
            <div className="label">Missed (Week)</div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, padding: "12px 14px", background: C.mintSoft, borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <Mail size={14} color={C.mint} />
        <span style={{ fontSize: 12, color: C.sub }}>
          Weekly report emails sent via <strong style={{ color: C.mint }}>Twilio SendGrid</strong>
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Medication Performance Chart
   ───────────────────────────────────────────────────────────── */
function MedPerformanceChart() {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">
          <Pill size={16} color={C.afternoon} /> Per-Medication Adherence
        </h3>
        <button className="chart-export-btn"><Download size={11} /> Report</button>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={MED_PERFORMANCE} layout="vertical" barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: C.faint, fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: C.sub, fontSize: 11 }} width={90} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="adherence" radius={[0, 6, 6, 0]} name="Adherence %">
            {MED_PERFORMANCE.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Custom Tooltip
   ───────────────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(21,28,44,0.95)",
        border: `1px solid ${C.glassBorder}`,
        borderRadius: 12,
        padding: "10px 14px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <p style={{ color: C.ink, fontWeight: 700, fontSize: 12, margin: 0, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 12, margin: 0 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Health Score Card
   ───────────────────────────────────────────────────────────── */
function HealthScoreCard({ percent }) {
  const score = Math.round(percent * 0.95 + 5);
  const scoreLabel = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Fair" : "Needs Attention";
  const scoreColor = score >= 85 ? C.mint : score >= 70 ? C.afternoon : score >= 50 ? C.morning : C.coral;

  return (
    <div
      className="glass-card"
      style={{
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow effect */}
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: scoreColor,
          filter: "blur(40px)",
          opacity: 0.15,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Heart size={16} color={C.coral} />
          <h3 style={{ color: C.ink, fontWeight: 700, fontSize: 14, margin: 0 }}>Health Score</h3>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: scoreColor,
            background: `${scoreColor}18`,
            padding: "3px 10px",
            borderRadius: 999,
          }}
        >
          {scoreLabel}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <ProgressRing percent={score} size={100} strokeWidth={8} />
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: C.ink }}>{score}</span>
            <span style={{ fontSize: 14, color: C.faint, fontWeight: 600 }}>/100</span>
          </div>
          <p style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>
            {score >= 85
              ? "Outstanding consistency! Keep it up."
              : score >= 70
                ? "Good progress. Stay on track."
                : "Let's improve your adherence."}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Stat Card (Enhanced)
   ───────────────────────────────────────────────────────────── */
function DashStatCard({ icon: Icon, count, label, color, softBg, trend, trendUp, index, sparkData }) {
  return (
    <div
      className="dash-stat-card"
      style={{
        animation: `fadeInUp 0.5s var(--ease-out-expo) both`,
        animationDelay: `${(index || 0) * 80}ms`,
      }}
    >
      <div className="stat-glow" style={{ background: color }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: softBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={color} />
        </div>
        {trend && (
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {trendUp ? (
              <ArrowUpRight size={14} color={C.mint} />
            ) : (
              <ArrowDownRight size={14} color={C.coral} />
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: trendUp ? C.mint : C.coral,
              }}
            >
              {trend}
            </span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: C.ink, lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: C.sub, marginTop: 4 }}>{label}</div>
      {sparkData && <MiniSparkline data={sparkData} color={color} />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Timeline Rail
   ───────────────────────────────────────────────────────────── */
function TimelineRail({ reminders }) {
  const currentHour = new Date().getHours();
  const currentSlotId =
    currentHour < 12 ? "morning" : currentHour < 17 ? "afternoon" : "night";

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={16} color={C.afternoon} />
          <h3 style={{ color: C.ink, fontWeight: 700, fontSize: 14, margin: 0 }}>Today's Timeline</h3>
        </div>
        <span style={{ color: C.faint, fontSize: 12 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>
      <div style={{ position: "relative", display: "flex", alignItems: "start", justifyContent: "space-between", padding: "0 10px" }}>
        {/* Connector line */}
        <div
          style={{
            position: "absolute",
            top: 22,
            left: "14%",
            right: "14%",
            height: 2,
            background: `linear-gradient(90deg, ${C.morning}44, ${C.afternoon}44, ${C.dusk}44)`,
            borderRadius: 999,
          }}
        />
        {SLOTS.map((slot) => {
          const slotMeds = reminders.filter((m) => m.slot === slot.id);
          const allTaken = slotMeds.length > 0 && slotMeds.every((m) => m.status === "taken");
          const isCurrent = slot.id === currentSlotId;

          return (
            <div
              key={slot.id}
              style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: "30%" }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: allTaken ? slot.color : "transparent",
                  border: `2px solid ${slot.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: allTaken
                    ? `0 0 16px ${slot.color}44`
                    : isCurrent
                      ? `0 0 12px ${slot.color}33`
                      : "none",
                  transition: "all 0.5s ease",
                  animation: isCurrent && !allTaken ? "pulseGlow 3s ease-in-out infinite" : "none",
                }}
              >
                <slot.Icon size={18} color={allTaken ? "#fff" : slot.color} />
              </div>
              <span style={{ color: C.ink, fontWeight: 700, fontSize: 12 }}>{slot.label}</span>
              <span style={{ color: C.faint, fontSize: 11 }}>{slot.time}</span>
              <span style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}>
                {slotMeds.filter(m => m.status === "taken").length}/{slotMeds.length} taken
              </span>
              {allTaken && (
                <CheckCircle2
                  size={14}
                  color={C.mint}
                  style={{
                    position: "absolute",
                    top: -4,
                    right: "28%",
                    animation: "fadeInUp 0.4s ease both",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Weekly Bar Chart
   ───────────────────────────────────────────────────────────── */
function WeeklyChart() {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">
          <TrendingUp size={16} color={C.mint} /> Weekly Adherence
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.mint }} />
            <span style={{ fontSize: 11, color: C.sub }}>Taken</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.coral }} />
            <span style={{ fontSize: 11, color: C.sub }}>Missed</span>
          </div>
          <button className="chart-export-btn"><Download size={11} /></button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={WEEKLY_DATA} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: C.faint, fontSize: 11 }}
          />
          <YAxis
            hide
            domain={[0, 6]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="taken" stackId="a" radius={[0, 0, 0, 0]} fill={C.mint} fillOpacity={0.8} name="Taken" />
          <Bar dataKey="missed" stackId="a" radius={[4, 4, 0, 0]} fill={C.coral} fillOpacity={0.6} name="Missed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Monthly Trend Line Chart
   ───────────────────────────────────────────────────────────── */
function MonthlyTrendChart() {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">
          <Activity size={16} color={C.dusk} /> Adherence Trend
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.mint,
              background: C.mintSoft,
              padding: "3px 10px",
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <ArrowUpRight size={12} /> +8% this month
          </span>
          <button className="chart-export-btn"><Download size={11} /></button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={MONTHLY_TREND}>
          <defs>
            <linearGradient id="adherenceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.mint} stopOpacity={0.3} />
              <stop offset="100%" stopColor={C.mint} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="week"
            axisLine={false}
            tickLine={false}
            tick={{ fill: C.faint, fontSize: 11 }}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: C.faint, fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="adherence"
            stroke={C.mint}
            strokeWidth={2.5}
            fill="url(#adherenceGrad)"
            name="Adherence %"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Slot Distribution Donut
   ───────────────────────────────────────────────────────────── */
function SlotDistribution() {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">
          <Target size={16} color={C.morning} /> Dose Distribution
        </h3>
        <button className="chart-export-btn"><Download size={11} /></button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={SLOT_DISTRIBUTION}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {SLOT_DISTRIBUTION.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SLOT_DISTRIBUTION.map((s) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: 12, color: C.sub }}>{s.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Activity Heatmap (Hourly)
   ───────────────────────────────────────────────────────────── */
function ActivityHeatmap() {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">
          <Zap size={16} color={C.afternoon} /> Hourly Activity
        </h3>
        <button className="chart-export-btn"><Download size={11} /></button>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={HOURLY_ACTIVITY} barCategoryGap="15%">
          <XAxis
            dataKey="hour"
            axisLine={false}
            tickLine={false}
            tick={{ fill: C.faint, fontSize: 9 }}
            interval={2}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="activity" radius={[3, 3, 0, 0]} name="Doses">
            {HOURLY_ACTIVITY.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.activity >= 3 ? C.mint : entry.activity >= 1 ? C.afternoon : "rgba(255,255,255,0.06)"}
                fillOpacity={entry.activity >= 1 ? 0.8 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Refill Alert Banner
   ───────────────────────────────────────────────────────────── */
function RefillBanner() {
  return (
    <div
      className="glass-card"
      style={{
        padding: 18,
        background: C.coralSoft,
        border: `1px solid rgba(251,113,133,0.2)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${C.coral}, #F43F5E)`,
            borderRadius: 12,
            width: 42,
            height: 42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 0 16px ${C.coral}33`,
          }}
        >
          <AlertTriangle size={18} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: C.ink, fontWeight: 700, fontSize: 13, margin: 0 }}>
            Amlodipine finishes in 5 days
          </p>
          <p style={{ color: C.sub, fontSize: 12, margin: "2px 0 0" }}>
            Refill recommended by Mon, Aug 11
          </p>
        </div>
        <button
          className="btn-gradient"
          style={{
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            padding: "8px 16px",
            flexShrink: 0,
          }}
        >
          Order Refill
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Recent Activity Table
   ───────────────────────────────────────────────────────────── */
function RecentActivityTable({ reminders }) {
  const statusConfig = {
    taken: { label: "Taken", color: C.mint, bg: C.mintSoft },
    pending: { label: "Pending", color: C.morning, bg: C.morningSoft },
    missed: { label: "Missed", color: C.coral, bg: C.coralSoft },
    snoozed: { label: "Snoozed", color: C.afternoon, bg: C.afternoonSoft },
  };

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={16} color={C.dusk} />
          <h3 style={{ color: C.ink, fontWeight: 700, fontSize: 14, margin: 0 }}>Recent Activity</h3>
        </div>
        <button
          className="btn-glass"
          style={{
            padding: "5px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Filter size={12} /> Filter
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Medication</th>
              <th>Dosage</th>
              <th>Slot</th>
              <th>Status</th>
              <th>Schedule</th>
            </tr>
          </thead>
          <tbody>
            {reminders.slice(0, 6).map((med, i) => {
              const slot = SLOTS.find((s) => s.id === med.slot);
              const status = statusConfig[med.status] || statusConfig.pending;
              return (
                <tr
                  key={med.id}
                  style={{
                    animation: `fadeInUp 0.4s var(--ease-out-expo) both`,
                    animationDelay: `${i * 50}ms`,
                  }}
                >
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: slot ? slot.soft : C.mintSoft,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Pill size={14} color={slot ? slot.color : C.mint} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{med.med_name}</span>
                    </div>
                  </td>
                  <td style={{ color: C.sub }}>{med.dosage}</td>
                  <td>
                    <span
                      style={{
                        background: slot ? slot.soft : C.mintSoft,
                        color: slot ? slot.color : C.mint,
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 999,
                        padding: "3px 10px",
                      }}
                    >
                      {slot ? slot.label : med.slot}
                    </span>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        background: status.bg,
                        color: status.color,
                      }}
                    >
                      <CheckCircle2 size={10} />
                      {status.label}
                    </span>
                  </td>
                  <td style={{ color: C.sub }}>{med.repeat}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Med Card (for bottom section)
   ───────────────────────────────────────────────────────────── */
function MedCard({ med, slot, isCaregiver, onToggle, index }) {
  const isTaken = med.status === "taken";
  return (
    <div
      className="glass-card"
      style={{
        borderLeft: `3px solid ${slot.color}`,
        borderRadius: 14,
        padding: 16,
        opacity: isTaken ? 0.55 : 1,
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p
            style={{
              color: C.ink,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: isTaken ? "line-through" : "none",
              textDecorationColor: C.faint,
              margin: 0,
            }}
          >
            {med.med_name}
          </p>
          <p style={{ color: C.sub, fontSize: 12, marginTop: 2, margin: "2px 0 0" }}>{med.dosage}</p>
          <span
            style={{
              background: slot.soft,
              color: slot.color,
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 999,
              padding: "2px 10px",
              marginTop: 6,
              display: "inline-block",
            }}
          >
            {slot.label}
          </span>
        </div>
        {isCaregiver ? (
          <button
            className="btn-glass"
            style={{
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Send size={13} /> Nudge
          </button>
        ) : (
          <button
            onClick={onToggle}
            style={{
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              padding: "8px 14px",
              background: isTaken ? "transparent" : C.mint,
              color: isTaken ? C.sub : "#fff",
              border: isTaken ? `1px solid ${C.line}` : "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
              transition: "all 0.3s ease",
              boxShadow: isTaken ? "none" : `0 4px 14px ${C.mint}33`,
            }}
          >
            {isTaken ? (
              <>
                <RotateCcw size={13} /> Undo
              </>
            ) : (
              <>
                <CheckCircle2 size={13} /> Taken
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Dashboard Page
   ═══════════════════════════════════════════════════════════════ */
export default function DashboardPage({ role, user, onSwitchRole, onLogout }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const isCaregiver = role === "caregiver";
  const toast = useToast();
  const userName = user?.name || "Meera Sharma";

  const fetchReminders = useCallback(async () => {
    try {
      const data = await api.getReminders();
      setReminders(data);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const toggle = async (id) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;

    try {
      let updated;
      if (reminder.status === "taken") {
        updated = await api.updateReminder(id, { status: "pending" });
        updated = { ...reminder, status: "pending" };
        toast({ type: "info", title: "Undone", message: `${reminder.med_name} marked as pending` });
      } else {
        updated = await api.markTaken(id);
        toast({ type: "success", title: "Taken! ✓", message: `${reminder.med_name} — ${reminder.dosage}` });
      }
      setReminders((r) => r.map((x) => (x.id === id ? updated : x)));
    } catch (err) {
      console.error(err);
      toast({ type: "error", message: "Failed to update. Please try again." });
    }
  };

  const taken = reminders.filter((m) => m.status === "taken").length;
  const pending = reminders.filter((m) => m.status === "pending" || m.status === "snoozed").length;
  const missed = reminders.filter((m) => m.status === "missed").length;
  const percent = reminders.length > 0 ? Math.round((taken / reminders.length) * 100) : 0;

  return (
    <DashboardLayout
      role={role}
      userName={user?.name || "Meera Sharma"}
      userEmail={user?.email || "meera.sharma@mail.com"}
      onSwitchRole={onSwitchRole}
      onLogout={onLogout}
    >
      {/* Reports Header */}
      <ReportsHeader userName={userName} isCaregiver={isCaregiver} />

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SkeletonStatRow count={4} />
          <SkeletonRing />
          <SkeletonList count={3} />
        </div>
      ) : (
        <>
          {/* KPI Summary Banner */}
          <KpiBanner percent={percent} taken={taken} total={reminders.length} streak={12} activeMeds={reminders.length} />

          {/* Stats Row with Sparklines */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 28,
            }}
          >
            <DashStatCard icon={Pill} count={reminders.length} label="Total Medications" color={C.afternoon} softBg={C.afternoonSoft} trend="+2" trendUp sparkData={SPARKLINE_DATA.meds} index={0} />
            <DashStatCard icon={CheckCircle2} count={taken} label="Taken Today" color={C.mint} softBg={C.mintSoft} trend={`${percent}%`} trendUp={percent > 60} sparkData={SPARKLINE_DATA.taken} index={1} />
            <DashStatCard icon={Clock} count={pending} label="Pending" color={C.morning} softBg={C.morningSoft} sparkData={SPARKLINE_DATA.pending} index={2} />
            <DashStatCard icon={AlertTriangle} count={missed} label="Missed" color={C.coral} softBg={C.coralSoft} trend={missed > 0 ? `-${missed}` : "0"} trendUp={missed === 0} sparkData={SPARKLINE_DATA.missed} index={3} />
          </div>

          {/* Refill Banner */}
          <div style={{ marginBottom: 28 }}>
            <RefillBanner />
          </div>

          {/* Timeline + Health Score */}
          <div className="section-header">
            <h2><Clock size={16} color={C.afternoon} /> Today's Overview</h2>
            <span className="section-badge">Live</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 16,
              marginBottom: 28,
            }}
          >
            <TimelineRail reminders={reminders} />
            <HealthScoreCard percent={percent} />
          </div>

          {/* Analytics & Reports Section */}
          <div className="section-header">
            <h2><BarChart3 size={16} color={C.mint} /> Analytics & Reports</h2>
            <span className="section-badge">Updated Now</span>
          </div>

          {/* Charts Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <WeeklyChart />
            <MonthlyTrendChart />
          </div>

          {/* Compliance + Med Performance */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <ComplianceReport percent={percent} />
            <MedPerformanceChart />
          </div>

          {/* Small Charts Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 28,
            }}
          >
            <SlotDistribution />
            <ActivityHeatmap />
          </div>

          {/* Activity Table */}
          <div style={{ marginBottom: 32 }}>
            <RecentActivityTable reminders={reminders} />
          </div>

          {/* Medicines by Slot */}
          <h3
            style={{ color: C.ink, fontWeight: 700, fontSize: 16, marginBottom: 12 }}
            className="animate-in"
          >
            Medicines by Slot
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 }}>
            {SLOTS.map((slot) => {
              const slotMeds = reminders.filter((m) => m.slot === slot.id);
              if (!slotMeds.length) return null;
              return (
                <div key={slot.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <slot.Icon size={14} color={slot.color} />
                    <span style={{ color: slot.color, fontWeight: 700, fontSize: 12 }}>
                      {slot.label} · {slot.time}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {slotMeds.map((med, i) => (
                      <MedCard
                        key={med.id}
                        med={med}
                        slot={slot}
                        isCaregiver={isCaregiver}
                        onToggle={() => toggle(med.id)}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
