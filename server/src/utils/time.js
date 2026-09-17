const IST_OFFSET_MIN = 330; // UTC+5:30, no DST
const IST_MS = IST_OFFSET_MIN * 60 * 1000;

export function toISTDateString(date) {
  const d = new Date(date);
  const ist = new Date(d.getTime() + IST_MS);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const day = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function istDayRange(istDateStr) {
  const [y, m, d] = istDateStr.split('-').map(Number);
  const startUTC = Date.UTC(y, m - 1, d, 0, 0, 0, 0) - IST_MS;
  const endUTC = Date.UTC(y, m - 1, d, 23, 59, 59, 999) - IST_MS;
  return { start: new Date(startUTC), end: new Date(endUTC) };
}

export function todayIST() {
  return toISTDateString(new Date());
}

export function istDateNDaysAgo(n) {
  const now = new Date(Date.now() + IST_MS);
  now.setUTCDate(now.getUTCDate() - n);
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function slotForNowIST() {
  const ist = new Date(Date.now() + IST_MS);
  const h = ist.getUTCHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'night';
}

export function istRangeForLastNDays(n) {
  const end = new Date();
  const startIST = istDateNDaysAgo(n - 1);
  const { start } = istDayRange(startIST);
  return { start, end };
}
