import admin from "firebase-admin";

let initAttempted = false;
let adminReady = false;

function envStr(name) {
  const v = process.env[name];
  if (v == null || v === "") return undefined;
  return v.trim().replace(/^["']|["']$/g, "");
}

function initFirebaseAdmin() {
  if (initAttempted) return adminReady;
  initAttempted = true;

  const projectId = envStr("FIREBASE_PROJECT_ID");
  const saJson = envStr("FIREBASE_SERVICE_ACCOUNT_JSON");

  if (!projectId) {
    console.warn(
      "[auth] FIREBASE_PROJECT_ID not set — API trusts client-sent userId (dev only)",
    );
    return false;
  }

  try {
    if (admin.apps.length === 0) {
      if (saJson) {
        const serviceAccount = JSON.parse(saJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId,
        });
      } else {
        admin.initializeApp({ projectId });
      }
    }
    adminReady = true;
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[auth] Firebase Admin init failed: ${message}`);
    return false;
  }
}

export function isFirebaseAuthConfigured() {
  return initFirebaseAdmin();
}

export function getAdminFirestore() {
  if (!initFirebaseAdmin()) return null;
  return admin.firestore();
}

/**
 * Verify Firebase ID token from Authorization: Bearer header.
 * @returns {{ uid: string } | { error: string, status: number } | null}
 *   uid on success; error object on bad token; null when admin not configured (fallback mode).
 */
export async function verifyBearerToken(req) {
  if (!initFirebaseAdmin()) return null;

  const header =
    typeof req.headers.authorization === "string"
      ? req.headers.authorization
      : "";
  if (!header.startsWith("Bearer ")) {
    return { error: "Missing Authorization Bearer token", status: 401 };
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return { error: "Missing Authorization Bearer token", status: 401 };
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return { error: "Invalid or expired Firebase ID token", status: 401 };
  }
}
