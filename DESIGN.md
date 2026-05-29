# Design decisions

This document records **three** places where a product or engineering choice shaped **Unfold**. For each case: what we chose, why it matters, and a **reflection on authorship**—how much the decision feels like *your* judgment versus help from an agentic coding tool (for example, Cursor, Copilot, or chat-based assistants). **Replace the italicized reflection paragraphs with your own honest assessment** for coursework.

---

## 1. Extract PDF and text in the browser (client-side)

### Decision

Document text is extracted **entirely in the browser**: plain text files via the File API, and PDFs via **PDF.js** (`pdfjs-dist`) with a bundled worker. Only the resulting string is sent to the backend for LLM analysis—not the original file upload as a separate storage pipeline.

### Rationale

- **Privacy and trust**: Users can see that parsing happens locally before any network call for analysis; the mental model is “text leaves the browser for the model,” not “my file is uploaded to your server.”
- **Simpler server**: The API stays a thin JSON-in / JSON-out service (no file parsers, no virus surface from arbitrary binaries on the server for this prototype).
- **Cost and hosting**: No object storage or PDF worker on the server for homework-scale deployment.

### Alternatives considered

- Server-side PDF parsing (more consistent for complex PDFs; heavier ops and trust model).
- Sending raw PDF bytes to a third-party extractor API (another vendor and data path).

### Authorship reflection *(edit for your submission)*

*Describe here how you weigh **your** role versus a tool’s: for example, did you insist on client-side extraction for privacy before any code existed, or did a tool suggest PDF.js and you adopted it after review? Did you tune UX (progress, errors) yourself? A sentence or two and, if your instructor wants a number, an estimate like “~__% my intent / ~__% implementation assistance” is fine.*

---

## 2. Structured JSON from the model + a normalization layer in the UI

### Decision

The backend asks the LLM for **JSON only** (system prompt + `response_format: json_object` where supported), defining a schema: `plain_summary`, `sections[]`, `risks[]`, `open_questions[]`, etc. The React app then runs **`normalizeAnalysis`** so older or slightly malformed model output still maps into typed `Analysis` objects before rendering.

### Rationale

- **Predictable UI**: `ResultsView` can rely on lists and fields instead of parsing free-form markdown or prose from the model.
- **Easier iteration**: Prompt and schema can evolve; normalization absorbs minor inconsistencies without crashing the page.
- **Separation of concerns**: The server validates “is this JSON?”; the client makes the UI resilient to schema drift.

### Alternatives considered

- Markdown or prose-only answers (faster to prompt, harder to build a consistent layout and history export).
- Strict server-side schema validation only (rejects more often; pushes complexity to error handling for users).

### Authorship reflection *(edit for your submission)*

*Who owned the “shape” of the analysis—summary vs sections vs risks? Did you write or revise the system prompt yourself, or mostly accept generated text? Did you add normalization because you hit real model quirks, or was that suggested by a tool? Brief honest note.*

---

## 3. Google sign-in + per-user Firestore, with localStorage fallback and migration

### Decision

Access is gated by **Firebase Authentication (Google)**. Saved analyses live under **`users/{uid}/runs/{runId}`** in **Cloud Firestore**, with **security rules** so each user can only read/write their own subtree. If Firestore is not available but the user is signed in, the app can fall back to **`localStorage`**; on first cloud availability, **local runs migrate** in a batch and local copies are cleared.

### Rationale

- **Accounts without custom backend auth**: Firebase handles identity; Firestore gives a managed document store with real-time updates for History.
- **Safety**: Rules encode “only my data” in one place; no ad hoc checks in every client call for a prototype.
- **Continuity**: Fallback + migration avoid losing work when moving from offline or misconfigured Firestore to a working project.

### Alternatives considered

- Session-only, no save (simpler; worse for returning users).
- Custom JWT + your own database (more control; more homework scope).

### Authorship reflection *(edit for your submission)*

*Firebase vs another auth provider—was that your requirement, a course default, or a suggestion you accepted? How much did you personally design the History UX versus implement lists from a scaffold? Again, a short paragraph or percentage split is enough.*

---

## Summary

| # | Decision | Main tradeoff |
|---|------------|----------------|
| 1 | Client-side extraction | Better privacy story; some PDFs extract poorly vs server tools |
| 2 | JSON + normalization | Stable UI; prompt and normalizer need maintenance |
| 3 | Firebase + rules + fallback | Fast path to secure per-user data; vendor lock-in to Google Cloud stack |

For the course: **replace the three italicized reflection sections** with your own voice so the submission accurately reflects *your* collaboration with agentic tools.
