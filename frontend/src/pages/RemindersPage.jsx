import React, { useState, useEffect, useCallback } from "react";
import {
  Sunrise, Sun, Moon, Clock, Plus, CheckCircle2, XCircle,
  AlarmClockPlus, Repeat, Trash2, X, Timer, Loader2,
} from "lucide-react";
import { C, SLOTS } from "../constants";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import StatCard from "../components/StatCard";
import AnimatedCard from "../components/AnimatedCard";
import { SkeletonList, SkeletonStatRow } from "../components/SkeletonLoader";
import { useToast } from "../components/Toast";
import * as api from "../api";

const STATUS_COLORS = {
  pending:  { bg: C.afternoonSoft, color: C.afternoon, label: "Pending" },
  taken:    { bg: C.mintSoft,      color: C.mint,      label: "Taken" },
  missed:   { bg: C.coralSoft,     color: C.coral,     label: "Missed" },
  snoozed:  { bg: C.duskSoft,      color: C.dusk,      label: "Snoozed" },
};

const REPEAT_OPTIONS = [
  { value: "none",    label: "No Repeat" },
  { value: "daily",   label: "Every Day" },
  { value: "weekly",  label: "Every Week" },
  { value: "monthly", label: "Every Month" },
  { value: "custom",  label: "Custom Days" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ═══════════════════════════════════════════════════════════════
   Create Reminder Modal
   ═══════════════════════════════════════════════════════════════ */
function CreateReminderModal({ onClose, onSave, saving }) {
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [slot, setSlot] = useState("morning");
  const [customTime, setCustomTime] = useState("10:00");
  const [repeat, setRepeat] = useState("daily");
  const [customDays, setCustomDays] = useState([]);
  const [notes, setNotes] = useState("");

  const toggleDay = (d) =>
    setCustomDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  const handleSave = () => {
    if (!medName.trim()) return;
    onSave({
      med_name: medName.trim(),
      dosage: dosage.trim() || "As prescribed",
      slot,
      custom_time: slot === "custom" ? customTime : null,
      repeat,
      custom_days: repeat === "custom" ? customDays : [],
      notes,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 50,
      }}
      className="flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.cardSolid,
          border: `1px solid ${C.glassBorder}`,
          borderRadius: "24px 24px 0 0",
          maxHeight: "92vh",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 -12px 60px rgba(0,0,0,0.4)",
          animation: "slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="md:rounded-3xl overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-2">
          <h2 style={{ color: C.ink, fontWeight: 800, fontSize: 20 }}>New Reminder</h2>
          <button
            onClick={onClose}
            style={{
              background: C.glass,
              borderRadius: 10,
              border: `1px solid ${C.glassBorder}`,
              width: 36,
              height: 36,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color={C.sub} />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* Medicine Name */}
          <div>
            <label style={{ fontSize: 12, color: C.sub, fontWeight: 600 }} className="block mb-1.5">
              Medicine Name *
            </label>
            <input
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder="e.g. Amlodipine"
              className="input-glass"
            />
          </div>

          {/* Dosage */}
          <div>
            <label style={{ fontSize: 12, color: C.sub, fontWeight: 600 }} className="block mb-1.5">
              Dosage
            </label>
            <input
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 5mg · 1 tablet"
              className="input-glass"
            />
          </div>

          {/* Time Slot */}
          <div>
            <label style={{ fontSize: 12, color: C.sub, fontWeight: 600 }} className="block mb-2">
              Time Slot
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[...SLOTS, { id: "custom", label: "Custom", color: C.sub, soft: C.glass, Icon: Clock }].map(
                (s) => (
                  <button
                    key={s.id}
                    onClick={() => setSlot(s.id)}
                    style={{
                      background: slot === s.id ? s.color : s.soft || C.glass,
                      color: slot === s.id ? "#fff" : s.color,
                      borderRadius: 12,
                      border: slot === s.id ? "none" : `1px solid ${C.glassBorder}`,
                      padding: "10px 0",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: slot === s.id ? `0 4px 14px ${s.color}33` : "none",
                    }}
                    className="flex flex-col items-center gap-1"
                  >
                    <s.Icon size={16} />
                    {s.label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Custom Time Picker */}
          {slot === "custom" && (
            <div>
              <label style={{ fontSize: 12, color: C.sub, fontWeight: 600 }} className="block mb-1.5">
                Custom Time
              </label>
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="input-glass"
              />
            </div>
          )}

          {/* Repeat Options */}
          <div>
            <label style={{ fontSize: 12, color: C.sub, fontWeight: 600 }} className="block mb-2">
              Repeat
            </label>
            <div className="flex flex-wrap gap-2">
              {REPEAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRepeat(opt.value)}
                  style={{
                    background: repeat === opt.value ? C.gradientPrimary : C.glass,
                    color: repeat === opt.value ? "#fff" : C.sub,
                    borderRadius: 999,
                    border: repeat === opt.value ? "none" : `1px solid ${C.glassBorder}`,
                    padding: "7px 14px",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Days */}
          {repeat === "custom" && (
            <div>
              <label style={{ fontSize: 12, color: C.sub, fontWeight: 600 }} className="block mb-2">
                Select Days
              </label>
              <div className="flex gap-1.5">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      border: `2px solid ${customDays.includes(d) ? C.mint : C.glassBorder}`,
                      background: customDays.includes(d) ? C.mintSoft : "transparent",
                      color: customDays.includes(d) ? C.mint : C.sub,
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ fontSize: 12, color: C.sub, fontWeight: 600 }} className="block mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Take after meals..."
              rows={2}
              className="input-glass"
              style={{ resize: "none" }}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gradient"
            style={{
              width: "100%",
              padding: "14px 0",
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <AlarmClockPlus size={18} />}
            {saving ? "Creating..." : "Create Reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Snooze Modal
   ═══════════════════════════════════════════════════════════════ */
function SnoozeModal({ reminder, onClose, onSnooze }) {
  const snoozeTimes = [5, 10, 15, 30, 60];
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 50,
      }}
      className="flex items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.cardSolid,
          border: `1px solid ${C.glassBorder}`,
          borderRadius: 24,
          width: "90%",
          maxWidth: 340,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="p-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Timer size={20} color={C.dusk} />
          <h3 style={{ color: C.ink, fontWeight: 800, fontSize: 18 }}>Snooze Reminder</h3>
        </div>
        <p style={{ color: C.sub, fontSize: 13, marginBottom: 16 }}>
          {reminder.med_name} — {reminder.dosage}
        </p>
        <div className="space-y-2">
          {snoozeTimes.map((mins) => (
            <button
              key={mins}
              onClick={() => onSnooze(reminder.id, mins)}
              className="btn-glass"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{mins < 60 ? `${mins} minutes` : "1 hour"}</span>
              <Timer size={14} color={C.faint} />
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{
            color: C.faint,
            fontSize: 13,
            fontWeight: 600,
            background: "none",
            border: "none",
            cursor: "pointer",
            marginTop: 14,
            width: "100%",
            textAlign: "center",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Reminder Card
   ═══════════════════════════════════════════════════════════════ */
function ReminderCard({ reminder, slot, onTaken, onMissed, onSnooze, onDelete, index }) {
  const st = STATUS_COLORS[reminder.status];
  const repeatLabel = REPEAT_OPTIONS.find((r) => r.value === reminder.repeat)?.label || "—";

  return (
    <div
      className="glass-card"
      style={{
        borderLeft: `3px solid ${slot?.color || C.sub}`,
        borderRadius: 16,
        padding: 16,
        opacity: reminder.status === "taken" ? 0.6 : 1,
        transition: "all 0.4s ease",
        animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p
            style={{
              color: C.ink,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: reminder.status === "taken" ? "line-through" : "none",
              textDecorationColor: C.faint,
            }}
          >
            {reminder.med_name}
          </p>
          <p style={{ color: C.sub, fontSize: 12 }}>{reminder.dosage}</p>
        </div>
        <span
          style={{
            background: st.bg,
            color: st.color,
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 999,
            padding: "3px 10px",
          }}
        >
          {st.label}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3" style={{ color: C.faint, fontSize: 12 }}>
        <span className="flex items-center gap-1">
          {slot?.Icon && <slot.Icon size={12} />}
          {reminder.custom_time || slot?.time || "Custom"}
        </span>
        <span className="flex items-center gap-1">
          <Repeat size={12} /> {repeatLabel}
        </span>
        {reminder.snooze_until && (
          <span className="flex items-center gap-1" style={{ color: C.dusk }}>
            <Timer size={12} /> Until {reminder.snooze_until}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      {reminder.status === "pending" || reminder.status === "snoozed" ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTaken(reminder.id)}
            style={{
              background: C.mint,
              color: "#fff",
              borderRadius: 10,
              border: "none",
              padding: "8px 14px",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: `0 4px 14px ${C.mint}33`,
              transition: "all 0.3s ease",
            }}
          >
            <CheckCircle2 size={14} /> Taken
          </button>
          <button
            onClick={() => onMissed(reminder.id)}
            style={{
              background: C.coralSoft,
              color: C.coral,
              borderRadius: 10,
              border: "none",
              padding: "8px 14px",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.3s ease",
            }}
          >
            <XCircle size={14} /> Missed
          </button>
          <button
            onClick={() => onSnooze(reminder)}
            style={{
              background: C.duskSoft,
              color: C.dusk,
              borderRadius: 10,
              border: "none",
              padding: "8px 12px",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
            }}
          >
            <Timer size={14} />
          </button>
          <button
            onClick={() => onDelete(reminder.id)}
            className="btn-glass"
            style={{ borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Trash2 size={14} color={C.faint} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12, color: C.faint, fontStyle: "italic" }}>
            {reminder.status === "taken" ? "✓ Completed" : reminder.status === "missed" ? "✗ Missed" : ""}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => onDelete(reminder.id)}
            className="btn-glass"
            style={{ borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Trash2 size={14} color={C.faint} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Reminders Page
   ═══════════════════════════════════════════════════════════════ */
export default function RemindersPage({ role, onSwitchRole }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [snoozeTarget, setSnoozeTarget] = useState(null);
  const [filter, setFilter] = useState("all");
  const toast = useToast();

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

  const handleMarkTaken = async (id) => {
    try {
      const r = reminders.find((x) => x.id === id);
      const updated = await api.markTaken(id);
      setReminders((prev) => prev.map((x) => (x.id === id ? updated : x)));
      toast({ type: "success", title: "Taken! ✓", message: `${r?.med_name} marked as taken` });
    } catch (err) {
      console.error(err);
      toast({ type: "error", message: "Failed to mark taken" });
    }
  };

  const handleMarkMissed = async (id) => {
    try {
      const r = reminders.find((x) => x.id === id);
      const updated = await api.markMissed(id);
      setReminders((prev) => prev.map((x) => (x.id === id ? updated : x)));
      toast({ type: "warning", title: "Missed", message: `${r?.med_name} marked as missed` });
    } catch (err) {
      console.error(err);
      toast({ type: "error", message: "Failed to mark missed" });
    }
  };

  const handleDelete = async (id) => {
    try {
      const r = reminders.find((x) => x.id === id);
      await api.deleteReminder(id);
      setReminders((prev) => prev.filter((x) => x.id !== id));
      toast({ type: "info", message: `${r?.med_name} deleted` });
    } catch (err) {
      console.error(err);
      toast({ type: "error", message: "Failed to delete" });
    }
  };

  const handleSnooze = async (id, mins) => {
    try {
      const r = reminders.find((x) => x.id === id);
      const updated = await api.snoozeReminder(id, mins);
      setReminders((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setSnoozeTarget(null);
      toast({ type: "snoozed", title: "Snoozed", message: `${r?.med_name} snoozed for ${mins} min` });
    } catch (err) {
      console.error(err);
      toast({ type: "error", message: "Failed to snooze" });
    }
  };

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      const created = await api.createReminder(data);
      setReminders((prev) => [created, ...prev]);
      setShowCreate(false);
      toast({ type: "success", title: "Created!", message: `${data.med_name} reminder created` });
    } catch (err) {
      console.error(err);
      toast({ type: "error", message: "Failed to create reminder" });
    } finally {
      setSaving(false);
    }
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "morning", label: "Morning" },
    { id: "afternoon", label: "Afternoon" },
    { id: "night", label: "Night" },
    { id: "custom", label: "Custom" },
  ];

  const filtered = reminders.filter((r) => {
    if (filter === "all") return true;
    if (filter === "pending") return r.status === "pending" || r.status === "snoozed";
    return r.slot === filter;
  });

  const pendingCount = reminders.filter((r) => r.status === "pending" || r.status === "snoozed").length;
  const takenCount = reminders.filter((r) => r.status === "taken").length;
  const missedCount = reminders.filter((r) => r.status === "missed").length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }} className="pb-24">
      <Header role={role} onSwitchRole={onSwitchRole} />

      <div className="max-w-3xl mx-auto px-6 pt-6">
        <div className="flex items-center justify-between mb-2 animate-in">
          <h1 style={{ color: C.ink, fontWeight: 800, fontSize: 24 }}>Reminders</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-gradient"
            style={{
              borderRadius: 12,
              padding: "10px 18px",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Plus size={16} /> New Reminder
          </button>
        </div>
        <p style={{ color: C.sub, fontSize: 14, marginBottom: 20 }} className="animate-in">
          Manage your medication schedule
        </p>

        {/* Stats Row */}
        {loading ? (
          <div className="mb-5">
            <SkeletonStatRow count={3} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <StatCard icon={Clock} count={pendingCount} label="Pending" color={C.afternoon} softBg={C.afternoonSoft} index={0} />
            <StatCard icon={CheckCircle2} count={takenCount} label="Taken" color={C.mint} softBg={C.mintSoft} index={1} />
            <StatCard icon={XCircle} count={missedCount} label="Missed" color={C.coral} softBg={C.coralSoft} index={2} />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                background: filter === f.id ? C.gradientPrimary : C.glass,
                color: filter === f.id ? "#fff" : C.sub,
                border: filter === f.id ? "none" : `1px solid ${C.glassBorder}`,
                borderRadius: 999,
                padding: "7px 16px",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.3s ease",
                boxShadow: filter === f.id ? "0 4px 12px rgba(45,212,191,0.2)" : "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Reminder Cards */}
        {loading ? (
          <SkeletonList count={4} />
        ) : (
          <div className="space-y-3">
            {filtered.length > 0 ? (
              filtered.map((reminder, i) => {
                const slot = SLOTS.find((s) => s.id === reminder.slot) || {
                  color: C.sub,
                  Icon: Clock,
                  time: reminder.custom_time,
                };
                return (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    slot={slot}
                    onTaken={handleMarkTaken}
                    onMissed={handleMarkMissed}
                    onSnooze={setSnoozeTarget}
                    onDelete={handleDelete}
                    index={i}
                  />
                );
              })
            ) : (
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
                  <AlarmClockPlus size={28} color={C.faint} />
                </div>
                <p style={{ color: C.sub, fontSize: 14 }}>No reminders found</p>
                <p style={{ color: C.faint, fontSize: 12, marginTop: 4 }}>
                  Create one to get started
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
      {showCreate && (
        <CreateReminderModal onClose={() => setShowCreate(false)} onSave={handleCreate} saving={saving} />
      )}
      {snoozeTarget && (
        <SnoozeModal
          reminder={snoozeTarget}
          onClose={() => setSnoozeTarget(null)}
          onSnooze={handleSnooze}
        />
      )}
    </div>
  );
}
