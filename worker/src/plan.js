/**
 * Free and Plus: what each may do, and how often.
 *
 * Reading a photo and writing ideas and recipes costs a fraction of a penny,
 * so photos are generous. Shop prices (a paid search per item) and generated
 * dish pictures (pence each) are what cost real money, so those are what the
 * free tier limits and what Plus pays for.
 *
 * The numbers are proposals, not yet confirmed (see docs/product-plan.md,
 * step 8b). Change them here and nowhere else.
 */

export const PLANS = {
  free: {
    photos: { allowed: 3, per: "day" },
    compares: { allowed: 2, per: "week" },
    pictures: { allowed: 0, per: "month" },
    // a recipe with a picture for each step: about 4 US cents each, all its steps together
    illustrated: { allowed: 1, per: "week" },
  },
  plus: {
    photos: { allowed: 30, per: "day" },
    compares: { allowed: 10, per: "day" },
    pictures: { allowed: 10, per: "month" },
    illustrated: { allowed: 10, per: "month" },
  },
};

export const FEATURES = ["photos", "compares", "pictures", "illustrated"];

const pad = (n) => String(n).padStart(2, "0");
const DAY = 24 * 60 * 60 * 1000;

/** The start (UTC) of the day, ISO week (Monday) or month a moment falls in. */
export function periodStart(per, date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  if (per === "week") return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY);
  if (per === "month") return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  return d;
}

/** When the count goes back to nothing. */
export function resetsAt(per, date) {
  const start = periodStart(per, date);
  if (per === "week") return new Date(start.getTime() + 7 * DAY);
  if (per === "month") return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return new Date(start.getTime() + DAY);
}

/** A name for the period, to count under: "2026-11-21", "2026-11-16w", "2026-11m". */
export function periodKey(per, date) {
  const s = periodStart(per, date);
  const day = `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`;
  return per === "week" ? `${day}w` : per === "month" ? `${day.slice(0, 7)}m` : day;
}

/**
 * Who is being counted: the account when there is one; else the device, which
 * the app names itself with a random id; else the address. A device id can be
 * thrown away to start again, so a separate per-address cap (index.js, DAILY)
 * still stands behind it.
 */
export function callerKey(user, device, ip) {
  if (user?.id) return `u:${user.id}`;
  if (typeof device === "string" && /^[a-f0-9-]{16,64}$/i.test(device)) return `d:${device.toLowerCase()}`;
  return `ip:${ip ?? "unknown"}`;
}

export const usageKey = (feature, caller, per, date) => `${feature}:${caller}:${periodKey(per, date)}`;

/** Plus, if this account or device was granted it by hand (PLUS_USERS, for testing) or holds a purchase that has not run out. */
export function tierOf(env, user, entitlement, nowSeconds, caller) {
  const granted = String(env?.PLUS_USERS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (user?.id && granted.includes(String(user.id))) return "plus";
  // a caller key ("d:<device id>") may be granted too, for testing on a phone with no account
  if (caller && granted.includes(caller)) return "plus";
  if (entitlement && Number(entitlement.expires_at) > nowSeconds) return "plus";
  return "free";
}

/** May they, and what to tell them either way. */
export function decide(tier, feature, used, date) {
  const { allowed, per } = PLANS[tier][feature];
  return { ok: used < allowed, feature, tier, used, allowed, per, resets: resetsAt(per, date).toISOString() };
}

const WHEN = { day: ["today's", "tomorrow"], week: ["this week's", "on Monday"], month: ["this month's", "next month"] };
const WHAT = { photos: ["photo", "photos"], compares: ["price check", "price checks"], pictures: ["generated picture", "generated pictures"], illustrated: ["recipe with step pictures", "recipes with step pictures"] };

/** A sentence a person can act on, for clients that show the server's words. */
export function sentence(d) {
  if (d.allowed === 0) return `${d.feature === "pictures" ? "Generated pictures" : "That"} come with Plus.`;
  const [which, back] = WHEN[d.per];
  const noun = WHAT[d.feature][d.allowed === 1 ? 0 : 1];
  return `You've used ${which} ${d.allowed} ${d.tier === "free" ? "free " : ""}${noun}. ${d.allowed === 1 ? "It comes" : "They come"} back ${back}.`;
}
