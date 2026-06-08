/**
 * Per-user daily usage limits.
 * Uses Firestore when Firebase Admin is configured (survives deploys);
 * falls back to in-memory buckets for local dev without credentials.
 */

import { getAdminFirestore, isFirebaseAuthConfigured } from "./verifyAuth.js";

const memoryBuckets = new Map();

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function memoryBucket(uid, action) {
  const key = `${uid}:${action}:${dayKey()}`;
  let entry = memoryBuckets.get(key);
  if (!entry) {
    entry = { count: 0 };
    memoryBuckets.set(key, entry);
  }
  return entry;
}

function checkMemoryRateLimit(uid, action, limit) {
  const bucket = memoryBucket(uid, action);
  if (bucket.count >= limit) {
    return {
      ok: false,
      error: `Daily ${action} limit reached (${limit}). Try again tomorrow.`,
      limit,
      used: bucket.count,
    };
  }
  bucket.count += 1;
  return {
    ok: true,
    remaining: limit - bucket.count,
    limit,
    used: bucket.count,
    storage: "memory",
  };
}

async function checkFirestoreRateLimit(uid, action, limit) {
  const db = getAdminFirestore();
  if (!db) return checkMemoryRateLimit(uid, action, limit);

  const docId = `${dayKey()}_${action}`;
  const ref = db.collection("users").doc(uid).collection("usage").doc(docId);

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const used = snap.exists ? Number(snap.data()?.count ?? 0) : 0;

      if (used >= limit) {
        return {
          ok: false,
          error: `Daily ${action} limit reached (${limit}). Try again tomorrow.`,
          limit,
          used,
        };
      }

      const next = used + 1;
      tx.set(
        ref,
        {
          count: next,
          action,
          day: dayKey(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      return {
        ok: true,
        remaining: limit - next,
        limit,
        used: next,
        storage: "firestore",
      };
    });

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[rateLimit] Firestore failed, using memory: ${message}`);
    return checkMemoryRateLimit(uid, action, limit);
  }
}

/**
 * @param {string | undefined} uid
 * @param {"analyze" | "chat" | "compare"} action
 * @param {number} limit
 */
export async function checkRateLimit(uid, action, limit) {
  if (!uid || typeof uid !== "string") {
    return { ok: false, error: "Missing user id for rate limiting" };
  }
  if (!Number.isFinite(limit) || limit <= 0) {
    return { ok: true, remaining: null };
  }

  if (isFirebaseAuthConfigured()) {
    return checkFirestoreRateLimit(uid, action, limit);
  }
  return checkMemoryRateLimit(uid, action, limit);
}

export function parseLimit(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
