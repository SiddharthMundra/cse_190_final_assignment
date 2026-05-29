# Transcript 3 — Saving runs with chunks for History


**Me:** After analyze, I want users to reopen old documents from History and keep chatting. Each save should include the file name, analysis JSON, paragraph chunks, and the full chat thread—not just the summary.

**Agent:** Extended `SavedRun` in `types.ts` with `analysis`, `chunks`, `messages`, `savedAt`, `model`. `firestoreRuns.ts` writes to `users/{uid}/runs/{runId}` with `setDoc` and lists runs ordered by `savedAt` desc via `onSnapshot`. Deployed `firestore.rules` so `read, write` only when `request.auth.uid == userId`.

**Me:** I had local saves from before Firebase was set up.

**Agent:** `useRuns.ts` still loads from `localStorage` when Firestore isn't configured. On first successful cloud connection it batch-migrates local runs with `migrateLocalRunsToCloud`, then clears local storage so you don't get duplicates.

**Me:** History page should let me delete a doc and download a report.

**Agent:** History in `App.tsx` lists runs with Open and Remove. Remove calls `deleteRunRemote` / local delete. Added PDF export in `downloadPdf.ts`—summary, sections, risks, questions, and chat transcript—with a button on each History row.

**Me:** Opening an old run without chunks breaks chat.

**Agent:** `DocumentChat` checks `chunks.length`; if zero it tells the user to re-upload/re-analyze. `openRunAndGoHome` loads analysis + chunks + messages back onto Homescreen so continuing the thread works when the run was saved after the chat feature shipped.

