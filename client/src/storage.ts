import type { SavedRun } from "./types";

const STORAGE_KEY = "legalSimplifier.v1.runs";

type Store = {
  version: 1;
  runs: SavedRun[];
};

function emptyStore(): Store {
  return { version: 1, runs: [] };
}

export function loadRuns(): SavedRun[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Store;
    if (parsed?.version !== 1 || !Array.isArray(parsed.runs)) return [];
    return parsed.runs;
  } catch {
    return [];
  }
}

export function saveRun(run: SavedRun): void {
  const prev = loadRuns();
  const runs = [run, ...prev.filter((r) => r.id !== run.id)];
  const data: Store = { version: 1, runs };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function deleteRun(id: string): void {
  const runs = loadRuns().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, runs }));
}

/** Clears local-only saved runs (e.g. after syncing to Firebase). */
export function clearAllRuns(): void {
  localStorage.removeItem(STORAGE_KEY);
}
