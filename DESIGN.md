# Design decisions

This document records **three** places where a product or engineering choice shaped **Unfold**. For each case: what we chose, why it matters, and a **reflection on authorship**—how much the decision feels like my judgment versus help from an agentic coding tool (Cursor).

---

## 1. Extract PDF and text in the browser (client-side)

### Decision

Document text is extracted **entirely in the browser**: plain text files via the File API, and PDFs via **PDF.js** (`pdfjs-dist`) with a bundled worker. Only the resulting string is sent to the backend for LLM analysis—not the original file upload as a separate storage pipeline.

### Rationale

- **Privacy and trust**: Users can see that parsing happens locally before any network call for analysis; the mental model is "text leaves the browser for the model," not "my file is uploaded to your server."
- **Simpler server**: The API stays a thin JSON-in / JSON-out service (no file parsers, no virus surface from arbitrary binaries on the server for this prototype).
- **Cost and hosting**: No object storage or PDF worker on the server for homework-scale deployment.

### Alternatives considered

- Server-side PDF parsing (more consistent for complex PDFs; heavier ops and trust model).
- Sending raw PDF bytes to a third-party extractor API (another vendor and data path).

### Authorship reflection

Client-side extraction was my call from Assignment 2 — I did not want raw PDFs on the server for a privacy story. Cursor suggested PDF.js specifically; I kept that because it already worked in A2. I wrote the progress callback and error messages in `extractText.ts` myself after testing a few bad PDFs. Rough split: **~75% my intent / ~25% tool implementation** (worker setup, imports).

---

## 2. Structured JSON from the model + a normalization layer in the UI

### Decision

The backend asks the LLM for **JSON only** (system prompt + `response_format: json_object` where supported), defining a schema: `plain_summary`, `sections[]`, `risks[]`, `open_questions[]`, etc. The React app then runs **`normalizeAnalysis`** so older or slightly malformed model output still maps into typed `Analysis` objects before rendering.

### Rationale

- **Predictable UI**: `ResultsView` can rely on lists and fields instead of parsing free-form markdown or prose from the model.
- **Easier iteration**: Prompt and schema can evolve; normalization absorbs minor inconsistencies without crashing the page.
- **Separation of concerns**: The server validates "is this JSON?"; the client makes the UI resilient to schema drift.

### Alternatives considered

- Markdown or prose-only answers (faster to prompt, harder to build a consistent layout and history export).
- Strict server-side schema validation only (rejects more often; pushes complexity to error handling for users).

### Authorship reflection

I defined the analysis shape (summary, per-clause sections, risks, open questions) before asking the agent to scaffold types and `ResultsView`. I edited the system prompt in `server/index.js` by hand — especially the "not legal advice" and section-splitting rules. Normalization came after the model returned missing fields on real leases; the agent wrote `analysisNormalize.ts`, but I decided which fields were required vs optional. **~60% my product/prompt choices / ~40% tool code**.

---

## 3. Google sign-in + per-user Firestore, with localStorage fallback and migration

### Decision

Access is gated by **Firebase Authentication (Google)**. Saved analyses live under **`users/{uid}/runs/{runId}`** in **Cloud Firestore**, with **security rules** so each user can only read/write their own subtree. If Firestore is not available but the user is signed in, the app can fall back to **`localStorage`**; on first cloud availability, **local runs migrate** in a batch and local copies are cleared.

### Rationale

- **Accounts without custom backend auth**: Firebase handles identity; Firestore gives a managed document store with real-time updates for History.
- **Safety**: Rules encode "only my data" in one place; no ad hoc checks in every client call for a prototype.
- **Continuity**: Fallback + migration avoid losing work when moving from offline or misconfigured Firestore to a working project.

### Alternatives considered

- Session-only, no save (simpler; worse for returning users).
- Custom JWT + your own database (more control; more homework scope).

### Authorship reflection

Firebase was in my original proposal ("Ship with auth + live URL"), not a course default. I chose Google sign-in only to ship faster. History UX (list, reopen, Remove, PDF download) I sketched; Cursor generated most of the React structure in `App.tsx` and `useRuns.ts`. I insisted on Firestore rules and user-initiated delete after staff privacy feedback. **~55% my requirements and review / ~45% tool scaffolding**.

---