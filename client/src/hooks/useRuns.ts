import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getFirebaseDb } from "../firebase/init";
import {
  deleteRunRemote,
  migrateLocalRunsToCloud,
  saveRunRemote,
  subscribeRuns,
} from "../services/firestoreRuns";
import {
  clearAllRuns,
  deleteRun as deleteRunLocal,
  loadRuns,
  saveRun as saveRunLocal,
} from "../storage";
import type { SavedRun } from "../types";

function migrationKeyFor(uid: string): string {
  return `legalSimplifier.cloudMigrated.${uid}`;
}

export function useRuns() {
  const { user, loading: authLoading, firebaseConfigured } = useAuth();
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [remoteReady, setRemoteReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !firebaseConfigured || !getFirebaseDb()) {
      setRuns(loadRuns());
      setRemoteReady(true);
      return;
    }

    setRemoteReady(false);
    const unsub = subscribeRuns(
      user.uid,
      (next) => {
        setRuns(next);
        setRemoteReady(true);
      },
      () => setRemoteReady(true),
    );
    return unsub;
  }, [user, authLoading, firebaseConfigured]);

  useEffect(() => {
    if (!user || !getFirebaseDb()) return;
    const key = migrationKeyFor(user.uid);
    if (localStorage.getItem(key)) return;

    const local = loadRuns();
    if (local.length === 0) {
      localStorage.setItem(key, "1");
      return;
    }

    let cancelled = false;
    void migrateLocalRunsToCloud(user.uid, local)
      .then(() => {
        if (cancelled) return;
        clearAllRuns();
        localStorage.setItem(key, "1");
      })
      .catch((e) => {
        console.error("Cloud migration failed:", e);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const saveRun = useCallback(
    async (run: SavedRun) => {
      if (user && getFirebaseDb()) {
        await saveRunRemote(user.uid, run);
        return;
      }
      saveRunLocal(run);
      setRuns(loadRuns());
    },
    [user],
  );

  const deleteRun = useCallback(
    async (id: string) => {
      if (user && getFirebaseDb()) {
        await deleteRunRemote(user.uid, id);
        return;
      }
      deleteRunLocal(id);
      setRuns(loadRuns());
    },
    [user],
  );

  const runsLoading =
    authLoading || (Boolean(user) && firebaseConfigured && !remoteReady);

  return { runs, runsLoading, saveRun, deleteRun };
}
