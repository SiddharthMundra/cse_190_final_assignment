import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import type { SavedRun } from "../types";
import { getFirebaseDb } from "../firebase/init";
import { stripUndefinedDeep } from "../sanitize";

const RUNS = "runs";

function runPayload(run: SavedRun) {
  return stripUndefinedDeep({
    savedAt: run.savedAt,
    fileName: run.fileName,
    model: run.model ?? null,
    analysis: run.analysis,
    chunks: run.chunks,
    messages: run.messages,
  });
}

export function subscribeRuns(
  uid: string,
  onRuns: (runs: SavedRun[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const db = getFirebaseDb();
  if (!db) {
    onRuns([]);
    return () => {};
  }
  const q = query(
    collection(db, "users", uid, RUNS),
    orderBy("savedAt", "desc"),
  );
  return onSnapshot(
    q,
    (snap) => {
      const runs: SavedRun[] = [];
      snap.forEach((d) => {
        const data = d.data() as Omit<SavedRun, "id">;
        runs.push({ ...data, id: d.id });
      });
      onRuns(runs);
    },
    (err) => onError?.(err),
  );
}

export async function saveRunRemote(uid: string, run: SavedRun): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore not available");
  const ref = doc(db, "users", uid, RUNS, run.id);
  await setDoc(ref, runPayload(run));
}

export async function deleteRunRemote(uid: string, id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore not available");
  await deleteDoc(doc(db, "users", uid, RUNS, id));
}

export async function migrateLocalRunsToCloud(
  uid: string,
  runs: SavedRun[],
): Promise<void> {
  const db = getFirebaseDb();
  if (!db || runs.length === 0) return;
  const batch = writeBatch(db);
  for (const run of runs) {
    const ref = doc(db, "users", uid, RUNS, run.id);
    batch.set(ref, runPayload(run));
  }
  await batch.commit();
}
