/** Vite env — copy from Firebase project settings (Web app). Spark (free) tier is enough. */
export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export function getFirebaseConfig(): Partial<FirebaseWebConfig> {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
    messagingSenderId: import.meta.env
      .VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  };
}

export function isFirebaseConfigured(): boolean {
  const c = getFirebaseConfig();
  return Boolean(
    c.apiKey &&
      c.authDomain &&
      c.projectId &&
      c.storageBucket &&
      c.messagingSenderId &&
      c.appId,
  );
}
