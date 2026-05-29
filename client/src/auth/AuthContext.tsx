import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { isFirebaseConfigured } from "../firebase/config";
import { getFirebaseAuth, getGoogleProvider } from "../firebase/init";

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  firebaseConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const firebaseConfigured = isFirebaseConfigured();

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error(
        "Firebase is not configured. Add VITE_FIREBASE_* keys in client/.env",
      );
    }
    await signInWithPopup(auth, getGoogleProvider());
  }, []);

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      firebaseConfigured,
      signInWithGoogle,
      signOutUser,
    }),
    [user, loading, firebaseConfigured, signInWithGoogle, signOutUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
