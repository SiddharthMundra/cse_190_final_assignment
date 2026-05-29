/**
 * In-memory per-user usage limits (resets on server restart).
 * Production would use Redis + verified Firebase ID tokens.
 */

const buckets = new Map();

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getBucket(uid, action) {
  const key = `${uid}:${action}:${dayKey()}`;
  let entry = buckets.get(key);
  if (!entry) {
    entry = { count: 0 };
    buckets.set(key, entry);
  }
  return entry;
}

/**
 * @param {string | undefined} uid
 * @param {"analyze" | "chat"} action
 * @param {number} limit
 */
export function checkRateLimit(uid, action, limit) {
  if (!uid || typeof uid !== "string") {
    return { ok: false, error: "Missing user id for rate limiting" };
  }
  if (!Number.isFinite(limit) || limit <= 0) {
    return { ok: true, remaining: null };
  }

  const bucket = getBucket(uid, action);
  if (bucket.count >= limit) {
    return {
      ok: false,
      error: `Daily ${action} limit reached (${limit}). Try again tomorrow.`,
      limit,
      used: bucket.count,
    };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, limit, used: bucket.count };
}

export function parseLimit(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
