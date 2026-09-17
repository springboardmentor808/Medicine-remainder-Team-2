/**
 * PillSync Mock API Client
 * All data is stored in localStorage — no backend required.
 * Every endpoint returns realistic sample data.
 */

// ── Mock Credentials ────────────────────────────────────────
const MOCK_USERS = [
  {
    id: 1,
    name: "Meera Sharma",
    email: "meera.sharma@mail.com",
    password: "password123",
    role: "patient",
  },
  {
    id: 2,
    name: "Arjun K",
    email: "arjun.k@mail.com",
    password: "password123",
    role: "caregiver",
  },
];

// ── Default Reminders (seeded on first load) ────────────────
const DEFAULT_REMINDERS = [
  { id: 1,  med_name: "Amlodipine",    dosage: "5mg · 1 tablet",        slot: "morning",    custom_time: null,      repeat: "daily",   status: "taken",   snooze_until: null, notes: "Take on empty stomach",      created_at: "2026-08-01" },
  { id: 2,  med_name: "Metformin",      dosage: "500mg · 1 tablet",      slot: "morning",    custom_time: null,      repeat: "daily",   status: "taken",   snooze_until: null, notes: "Take after breakfast",       created_at: "2026-08-01" },
  { id: 3,  med_name: "Vitamin D3",     dosage: "60,000 IU · 1 capsule", slot: "afternoon",  custom_time: null,      repeat: "weekly",  status: "pending", snooze_until: null, notes: "Take with fatty meal",       created_at: "2026-08-01" },
  { id: 4,  med_name: "Levothyroxine",  dosage: "50mcg · 1 tablet",      slot: "night",      custom_time: null,      repeat: "daily",   status: "pending", snooze_until: null, notes: "Take 30 min before dinner",  created_at: "2026-08-01" },
  { id: 5,  med_name: "Atorvastatin",   dosage: "10mg · 1 tablet",       slot: "night",      custom_time: null,      repeat: "daily",   status: "missed",  snooze_until: null, notes: "Take at bedtime",            created_at: "2026-08-01" },
  { id: 6,  med_name: "Calcium + D3",   dosage: "500mg · 1 tablet",      slot: "custom",     custom_time: "11:30 AM", repeat: "daily",  status: "snoozed", snooze_until: "11:45 AM", notes: "Take with water",    created_at: "2026-08-03" },
  { id: 7,  med_name: "Omeprazole",     dosage: "20mg · 1 capsule",      slot: "morning",    custom_time: null,      repeat: "daily",   status: "pending", snooze_until: null, notes: "Take 30 min before food",    created_at: "2026-08-02" },
  { id: 8,  med_name: "Aspirin",        dosage: "75mg · 1 tablet",       slot: "afternoon",  custom_time: null,      repeat: "daily",   status: "taken",   snooze_until: null, notes: "Take after lunch",           created_at: "2026-08-02" },
];

// ── Default Notifications (seeded on first load) ────────────
const DEFAULT_NOTIFICATIONS = [
  { id: 1,  type: "taken",    med_name: "Amlodipine",    dosage: "5mg",        time: "8:02 AM",   date: "Today",     slot: "morning",   snooze_until: null },
  { id: 2,  type: "taken",    med_name: "Metformin",     dosage: "500mg",      time: "8:05 AM",   date: "Today",     slot: "morning",   snooze_until: null },
  { id: 3,  type: "snoozed",  med_name: "Calcium + D3",  dosage: "500mg",      time: "11:30 AM",  date: "Today",     slot: "custom",    snooze_until: "11:45 AM" },
  { id: 4,  type: "reminder", med_name: "Vitamin D3",    dosage: "60,000 IU",  time: "2:00 PM",   date: "Today",     slot: "afternoon", snooze_until: null },
  { id: 5,  type: "taken",    med_name: "Aspirin",       dosage: "75mg",       time: "2:15 PM",   date: "Today",     slot: "afternoon", snooze_until: null },
  { id: 6,  type: "reminder", med_name: "Omeprazole",    dosage: "20mg",       time: "7:30 AM",   date: "Today",     slot: "morning",   snooze_until: null },
  { id: 7,  type: "missed",   med_name: "Atorvastatin",  dosage: "10mg",       time: "9:00 PM",   date: "Yesterday", slot: "night",     snooze_until: null },
  { id: 8,  type: "taken",    med_name: "Levothyroxine", dosage: "50mcg",      time: "9:03 PM",   date: "Yesterday", slot: "night",     snooze_until: null },
  { id: 9,  type: "taken",    med_name: "Amlodipine",    dosage: "5mg",        time: "8:00 AM",   date: "Yesterday", slot: "morning",   snooze_until: null },
  { id: 10, type: "taken",    med_name: "Metformin",     dosage: "500mg",      time: "8:01 AM",   date: "Yesterday", slot: "morning",   snooze_until: null },
  { id: 11, type: "missed",   med_name: "Vitamin D3",    dosage: "60,000 IU",  time: "2:00 PM",   date: "Aug 5",     slot: "afternoon", snooze_until: null },
  { id: 12, type: "taken",    med_name: "Atorvastatin",  dosage: "10mg",       time: "9:10 PM",   date: "Aug 5",     slot: "night",     snooze_until: null },
  { id: 13, type: "taken",    med_name: "Omeprazole",    dosage: "20mg",       time: "7:45 AM",   date: "Aug 5",     slot: "morning",   snooze_until: null },
  { id: 14, type: "taken",    med_name: "Calcium + D3",  dosage: "500mg",      time: "11:35 AM",  date: "Aug 4",     slot: "custom",    snooze_until: null },
  { id: 15, type: "missed",   med_name: "Aspirin",       dosage: "75mg",       time: "2:00 PM",   date: "Aug 4",     slot: "afternoon", snooze_until: null },
  { id: 16, type: "taken",    med_name: "Amlodipine",    dosage: "5mg",        time: "8:10 AM",   date: "Aug 4",     slot: "morning",   snooze_until: null },
];

// ── Helpers ─────────────────────────────────────────────────

function getStoredUsers() {
  const stored = localStorage.getItem("pillsync_users");
  return stored ? JSON.parse(stored) : [...MOCK_USERS];
}

function saveUsers(users) {
  localStorage.setItem("pillsync_users", JSON.stringify(users));
}

function getStoredReminders() {
  const stored = localStorage.getItem("pillsync_reminders");
  if (stored) return JSON.parse(stored);
  // Seed defaults on first load
  localStorage.setItem("pillsync_reminders", JSON.stringify(DEFAULT_REMINDERS));
  return [...DEFAULT_REMINDERS];
}

function saveReminders(reminders) {
  localStorage.setItem("pillsync_reminders", JSON.stringify(reminders));
}

function getStoredNotifications() {
  const stored = localStorage.getItem("pillsync_notifications");
  if (stored) return JSON.parse(stored);
  // Seed defaults on first load
  localStorage.setItem("pillsync_notifications", JSON.stringify(DEFAULT_NOTIFICATIONS));
  return [...DEFAULT_NOTIFICATIONS];
}

function saveNotifications(notifications) {
  localStorage.setItem("pillsync_notifications", JSON.stringify(notifications));
}

// Small delay to simulate network latency
function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Authentication ──────────────────────────────────────────

export async function loginUser(data) {
  await delay();
  const users = getStoredUsers();
  const user = users.find(
    (u) => u.email === data.email && u.password === data.password
  );
  if (!user) {
    throw new Error("Invalid email or password");
  }
  // Return user data without the password
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function registerUser(data) {
  await delay();
  const users = getStoredUsers();
  if (users.find((u) => u.email === data.email)) {
    throw new Error("An account with this email already exists");
  }
  const newUser = {
    id: Date.now(),
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role || "patient",
  };
  users.push(newUser);
  saveUsers(users);
  const { password, ...safeUser } = newUser;
  return safeUser;
}

export async function forgotPassword(email) {
  await delay(600);
  const users = getStoredUsers();
  if (!users.find((u) => u.email === email)) {
    throw new Error("No account found with this email");
  }
  // In mock mode, just pretend we sent the email
  return { message: "Password reset link sent (mock)" };
}

export async function resetPassword(token, newPassword) {
  await delay();
  // Mock — always succeed
  return { message: "Password reset successful (mock)" };
}

// ── Reminders ───────────────────────────────────────────────

export async function getReminders(filters = {}) {
  await delay(200);
  let reminders = getStoredReminders();
  // Apply optional filters
  if (filters.slot) {
    reminders = reminders.filter((r) => r.slot === filters.slot);
  }
  if (filters.status) {
    reminders = reminders.filter((r) => r.status === filters.status);
  }
  return reminders;
}

export async function createReminder(data) {
  await delay(200);
  const reminders = getStoredReminders();
  const newReminder = {
    id: Date.now(),
    med_name: data.med_name,
    dosage: data.dosage || "As prescribed",
    slot: data.slot || "morning",
    custom_time: data.custom_time || null,
    repeat: data.repeat || "daily",
    status: "pending",
    snooze_until: null,
    notes: data.notes || "",
    created_at: new Date().toISOString().split("T")[0],
  };
  reminders.unshift(newReminder);
  saveReminders(reminders);
  return newReminder;
}

export async function updateReminder(id, data) {
  await delay(200);
  const reminders = getStoredReminders();
  const idx = reminders.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error("Reminder not found");
  reminders[idx] = { ...reminders[idx], ...data };
  saveReminders(reminders);
  return reminders[idx];
}

export async function deleteReminder(id) {
  await delay(200);
  const reminders = getStoredReminders().filter((r) => r.id !== id);
  saveReminders(reminders);
  return null;
}

export async function markTaken(id) {
  await delay(200);
  const reminders = getStoredReminders();
  const idx = reminders.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error("Reminder not found");
  reminders[idx].status = "taken";
  reminders[idx].snooze_until = null;
  saveReminders(reminders);

  // Also add a notification
  const notifications = getStoredNotifications();
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  notifications.unshift({
    id: Date.now(),
    type: "taken",
    med_name: reminders[idx].med_name,
    dosage: reminders[idx].dosage,
    time: timeStr,
    date: "Today",
    slot: reminders[idx].slot,
    snooze_until: null,
  });
  saveNotifications(notifications);

  return reminders[idx];
}

export async function markMissed(id) {
  await delay(200);
  const reminders = getStoredReminders();
  const idx = reminders.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error("Reminder not found");
  reminders[idx].status = "missed";
  reminders[idx].snooze_until = null;
  saveReminders(reminders);

  // Also add a notification
  const notifications = getStoredNotifications();
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  notifications.unshift({
    id: Date.now(),
    type: "missed",
    med_name: reminders[idx].med_name,
    dosage: reminders[idx].dosage,
    time: timeStr,
    date: "Today",
    slot: reminders[idx].slot,
    snooze_until: null,
  });
  saveNotifications(notifications);

  return reminders[idx];
}

export async function snoozeReminder(id, minutes) {
  await delay(200);
  const reminders = getStoredReminders();
  const idx = reminders.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error("Reminder not found");

  const snoozeTime = new Date(Date.now() + minutes * 60000);
  const snoozeStr = snoozeTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  reminders[idx].status = "snoozed";
  reminders[idx].snooze_until = snoozeStr;
  saveReminders(reminders);

  // Also add a notification
  const notifications = getStoredNotifications();
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  notifications.unshift({
    id: Date.now(),
    type: "snoozed",
    med_name: reminders[idx].med_name,
    dosage: reminders[idx].dosage,
    time: timeStr,
    date: "Today",
    slot: reminders[idx].slot,
    snooze_until: snoozeStr,
  });
  saveNotifications(notifications);

  return reminders[idx];
}

// ── Notifications ───────────────────────────────────────────

export async function getNotifications(type) {
  await delay(200);
  let notifications = getStoredNotifications();
  if (type) {
    notifications = notifications.filter((n) => n.type === type);
  }
  return notifications;
}

export async function getNotificationSummary() {
  await delay(200);
  const notifications = getStoredNotifications();
  const summary = { taken: 0, missed: 0, snoozed: 0, reminder: 0 };
  notifications.forEach((n) => {
    if (summary[n.type] !== undefined) summary[n.type]++;
  });
  return summary;
}

export async function deleteNotification(id) {
  await delay(200);
  const notifications = getStoredNotifications().filter((n) => n.id !== id);
  saveNotifications(notifications);
  return null;
}

export async function clearAllNotifications() {
  await delay(200);
  saveNotifications([]);
  return null;
}
