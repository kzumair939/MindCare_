export function fmt(val, fallback="N/A") {
  if (val == null || val === "") return fallback;
  if (String(val).toUpperCase() === "PENDING_PAYMENT") return "Payment Pending";
  return String(val).replaceAll("_", " ");
}

export function fmtDate(val) {
  if (!val) return "Not set";
  try { return new Date(val + "T00:00:00").toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" }); }
  catch { return val; }
}

export function fmtTime(val) {
  if (!val) return "";
  const p = String(val).split(":");
  return p.length >= 2 ? `${p[0]}:${p[1]}` : val;
}

export function statusClass(s) {
  const v = String(s||"").toLowerCase();
  if (v === "booked") return "mc-status mc-status-booked";
  if (v === "confirmed") return "mc-status mc-status-confirmed";
  if (v === "completed") return "mc-status mc-status-completed";
  if (v === "cancelled") return "mc-status mc-status-cancelled";
  if (v === "missed") return "mc-status mc-status-missed";
  if (v === "pending" || v === "pending_payment") return "mc-status mc-status-pending";
  return "mc-status";
}

export function getRole() {
  try { return JSON.parse(localStorage.getItem("mc_user"))?.role || ""; }
  catch { return ""; }
}
