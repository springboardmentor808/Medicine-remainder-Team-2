import { Sunrise, Sun, Moon } from "lucide-react";

export const C = {
  // ── Backgrounds ───────────────────────────────
  bg:         "#0B0F1A",       // deep navy page background
  bgAlt:     "#111827",       // slightly lighter panels
  card:       "rgba(255,255,255,0.04)",  // glass card fill
  cardSolid:  "#151C2C",      // solid card variant
  glass:      "rgba(255,255,255,0.06)",  // glass overlay
  glassBorder:"rgba(255,255,255,0.08)",  // subtle glass border

  // ── Text ──────────────────────────────────────
  ink:        "#F1F5F9",       // primary text (near-white)
  sub:        "#94A3B8",       // secondary / muted text
  faint:      "#475569",       // very muted text / dividers

  // ── Borders & Lines ───────────────────────────
  line:       "rgba(255,255,255,0.08)",
  lineHover:  "rgba(255,255,255,0.15)",

  // ── Accent: Teal ─────────────────────────────
  mint:       "#2DD4BF",
  mintSoft:   "rgba(45,212,191,0.12)",
  mintGlow:   "rgba(45,212,191,0.25)",

  // ── Accent: Violet ───────────────────────────
  dusk:       "#A78BFA",
  duskSoft:   "rgba(167,139,250,0.12)",
  duskGlow:   "rgba(167,139,250,0.25)",

  // ── Accent: Amber / Morning ──────────────────
  morning:    "#FBBF24",
  morningSoft:"rgba(251,191,36,0.12)",
  morningGlow:"rgba(251,191,36,0.25)",

  // ── Accent: Sky / Afternoon ──────────────────
  afternoon:  "#38BDF8",
  afternoonSoft:"rgba(56,189,248,0.12)",
  afternoonGlow:"rgba(56,189,248,0.25)",

  // ── Accent: Coral / Danger ───────────────────
  coral:      "#FB7185",
  coralSoft:  "rgba(251,113,133,0.12)",
  coralGlow:  "rgba(251,113,133,0.25)",

  // ── Gradients ────────────────────────────────
  gradientPrimary: "linear-gradient(135deg, #2DD4BF, #A78BFA)",
  gradientWarm:    "linear-gradient(135deg, #FBBF24, #FB7185)",
  gradientCool:    "linear-gradient(135deg, #38BDF8, #A78BFA)",
  gradientFull:    "linear-gradient(135deg, #2DD4BF, #38BDF8, #A78BFA)",
};

export const SLOTS = [
  { id: "morning", label: "Morning", time: "8:00 AM", color: C.morning, soft: C.morningSoft, glow: C.morningGlow, Icon: Sunrise },
  { id: "afternoon", label: "Afternoon", time: "2:00 PM", color: C.afternoon, soft: C.afternoonSoft, glow: C.afternoonGlow, Icon: Sun },
  { id: "night", label: "Night", time: "9:00 PM", color: C.dusk, soft: C.duskSoft, glow: C.duskGlow, Icon: Moon },
];

export const INITIAL_MEDS = [
  { id: 1, slot: "morning", name: "Amlodipine", dosage: "5mg · 1 tablet", tag: "Blood Pressure", taken: true },
  { id: 2, slot: "morning", name: "Metformin", dosage: "500mg · 1 tablet", tag: "Diabetes", taken: true },
  { id: 7, slot: "morning", name: "Omeprazole", dosage: "20mg · 1 capsule", tag: "Acid Reflux", taken: false },
  { id: 3, slot: "afternoon", name: "Vitamin D3", dosage: "60,000 IU · 1 capsule", tag: "Vitamins", taken: false },
  { id: 8, slot: "afternoon", name: "Aspirin", dosage: "75mg · 1 tablet", tag: "Blood Thinner", taken: true },
  { id: 4, slot: "night", name: "Levothyroxine", dosage: "50mcg · 1 tablet", tag: "Thyroid", taken: false },
  { id: 5, slot: "night", name: "Atorvastatin", dosage: "10mg · 1 tablet", tag: "Heart", taken: false },
  { id: 6, slot: "custom", name: "Calcium + D3", dosage: "500mg · 1 tablet", tag: "Bone Health", taken: false },
];

export const INITIAL_REMINDERS = [
  { id: 1, medName: "Amlodipine", dosage: "5mg · 1 tablet", slot: "morning", customTime: null, repeat: "daily", status: "taken", snoozeUntil: null, createdAt: "2026-08-01" },
  { id: 2, medName: "Metformin", dosage: "500mg · 1 tablet", slot: "morning", customTime: null, repeat: "daily", status: "taken", snoozeUntil: null, createdAt: "2026-08-01" },
  { id: 7, medName: "Omeprazole", dosage: "20mg · 1 capsule", slot: "morning", customTime: null, repeat: "daily", status: "pending", snoozeUntil: null, createdAt: "2026-08-02" },
  { id: 3, medName: "Vitamin D3", dosage: "60,000 IU · 1 capsule", slot: "afternoon", customTime: null, repeat: "weekly", status: "pending", snoozeUntil: null, createdAt: "2026-08-01" },
  { id: 8, medName: "Aspirin", dosage: "75mg · 1 tablet", slot: "afternoon", customTime: null, repeat: "daily", status: "taken", snoozeUntil: null, createdAt: "2026-08-02" },
  { id: 4, medName: "Levothyroxine", dosage: "50mcg · 1 tablet", slot: "night", customTime: null, repeat: "daily", status: "pending", snoozeUntil: null, createdAt: "2026-08-01" },
  { id: 5, medName: "Atorvastatin", dosage: "10mg · 1 tablet", slot: "night", customTime: null, repeat: "daily", status: "missed", snoozeUntil: null, createdAt: "2026-08-01" },
  { id: 6, medName: "Calcium + D3", dosage: "500mg · 1 tablet", slot: "custom", customTime: "11:30 AM", repeat: "daily", status: "snoozed", snoozeUntil: "11:45 AM", createdAt: "2026-08-03" },
];

export const INITIAL_NOTIFICATIONS = [
  { id: 1,  type: "taken",    medName: "Amlodipine",    dosage: "5mg",        time: "8:02 AM",  date: "Today",     slot: "morning" },
  { id: 2,  type: "taken",    medName: "Metformin",     dosage: "500mg",      time: "8:05 AM",  date: "Today",     slot: "morning" },
  { id: 3,  type: "snoozed",  medName: "Calcium + D3",  dosage: "500mg",      time: "11:30 AM", date: "Today",     slot: "custom", snoozeUntil: "11:45 AM" },
  { id: 4,  type: "reminder", medName: "Vitamin D3",    dosage: "60,000 IU",  time: "2:00 PM",  date: "Today",     slot: "afternoon" },
  { id: 11, type: "taken",    medName: "Aspirin",       dosage: "75mg",       time: "2:15 PM",  date: "Today",     slot: "afternoon" },
  { id: 12, type: "reminder", medName: "Omeprazole",    dosage: "20mg",       time: "7:30 AM",  date: "Today",     slot: "morning" },
  { id: 5,  type: "missed",   medName: "Atorvastatin",  dosage: "10mg",       time: "9:00 PM",  date: "Yesterday", slot: "night" },
  { id: 6,  type: "taken",    medName: "Levothyroxine", dosage: "50mcg",      time: "9:03 PM",  date: "Yesterday", slot: "night" },
  { id: 7,  type: "taken",    medName: "Amlodipine",    dosage: "5mg",        time: "8:00 AM",  date: "Yesterday", slot: "morning" },
  { id: 8,  type: "taken",    medName: "Metformin",     dosage: "500mg",      time: "8:01 AM",  date: "Yesterday", slot: "morning" },
  { id: 13, type: "taken",    medName: "Omeprazole",    dosage: "20mg",       time: "7:45 AM",  date: "Yesterday", slot: "morning" },
  { id: 9,  type: "missed",   medName: "Vitamin D3",    dosage: "60,000 IU",  time: "2:00 PM",  date: "Aug 5",     slot: "afternoon" },
  { id: 10, type: "taken",    medName: "Atorvastatin",  dosage: "10mg",       time: "9:10 PM",  date: "Aug 5",     slot: "night" },
  { id: 14, type: "taken",    medName: "Calcium + D3",  dosage: "500mg",      time: "11:35 AM", date: "Aug 4",     slot: "custom" },
  { id: 15, type: "missed",   medName: "Aspirin",       dosage: "75mg",       time: "2:00 PM",  date: "Aug 4",     slot: "afternoon" },
  { id: 16, type: "taken",    medName: "Amlodipine",    dosage: "5mg",        time: "8:10 AM",  date: "Aug 4",     slot: "morning" },
];
