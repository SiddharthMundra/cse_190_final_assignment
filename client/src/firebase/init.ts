import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseConfig, isFirebaseConfigured } from "./config";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  const c = getFirebaseConfig();
  if (!app) {
    app =
      getApps().length > 0
        ? getApps()[0]!
        : initializeApp({
            apiKey: c.apiKey!,
            authDomain: c.authDomain!,
            projectId: c.projectId!,
            storageBucket: c.storageBucket!,
            messagingSenderId: c.messagingSenderId!,
            appId: c.appId!,
          });
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!auth) auth = getAuth(a);
  return auth;
}

export function getFirebaseDb(): Firestore | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!db) db = getFirestore(a);
  return db;
}

export function getGoogleProvider(): GoogleAuthProvider {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  return p;
}
