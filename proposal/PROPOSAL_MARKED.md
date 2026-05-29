# Unfold: AI Legal Document Assistant — Marked Proposal


- **(a) Implemented** — built and in use as described (with code location)
- **(b) Planned** — still intended after the first deliverable
- **(c) No longer planned** — dropped or superseded

---

## Description

> AI-powered contract and policy reader with Firebase-authenticated accounts, conversational document Q&A, and risk analysis deployed as a live web application (“Ship with auth + live URL”)

**Status: (a) Implemented**

- Live app: **https://unifold-ai.onrender.com**
- Google sign-in: `client/src/auth/AuthContext.tsx`, `client/src/pages/LoginPage.tsx`
- Document chat: `client/src/components/DocumentChat.tsx`, `server/index.js` (`POST /api/chat`)
- Risk analysis + clause summaries: `server/index.js` (`POST /api/analyze`), `client/src/components/ResultsView.tsx`
- Render deployment: `render.yaml` (Web Service: build + `npm start`)

> **Past Project Reference:** Extension of assignment 2; https://github.com/siddharthmundra/02-doc-scanner-superman-1

**Status: (a) Implemented** — same product direction; codebase extends the A2 document-scanner idea into a hosted web app.

---

# Planned Technologies

| Technology | Proposal | Status | Where in code / notes |
|------------|----------|--------|------------------------|
| **Frontend: React + Vite** | React + Vite | **(a) Implemented** | `client/` — `client/vite.config.ts`, `client/src/App.tsx` |
| **Backend: Node + Express** | Node + Express | **(a) Implemented** | `server/index.js`, `server/package.json` |
| **Login & saves: Firebase (Google + Firestore)** | Firebase | **(a) Implemented** | `client/src/auth/AuthContext.tsx`, `client/src/services/firestoreRuns.ts`, `firestore.rules` |
| **AI: TritonGPT LLM API** | TritonGPT | **(a) Implemented** | `server/index.js` — OpenAI-compatible client via `TRITON_*` env vars |
| **Hosting: Netlify or Render** | Static/hosted | **(a) Implemented** | **Render** Web Service — `render.yaml`, live at https://unifold-ai.onrender.com |
| **PDF Processing: PDF.js** | PDF.js | **(a) Implemented** | `client/src/extractText.ts` (`pdfjs-dist`) |

---

# First Deliverable

> Agent-based document chat: upload PDF or `.txt`, extract text, ask questions in a chat interface. (Existing clause summaries remain.)

**Status: (a) Implemented**

| Piece | Location |
|-------|----------|
| PDF / `.txt` upload | `client/src/App.tsx` (file input + drag/drop) |
| Browser text extraction | `client/src/extractText.ts` |
| Chat UI | `client/src/components/DocumentChat.tsx` |
| Grounded Q&A API | `server/index.js` — `POST /api/chat` |
| Structured analysis (summary, clauses, risks) | `server/index.js` — `POST /api/analyze`, `client/src/components/ResultsView.tsx` |

---

# Rough Architecture for First Deliverable

> Lightweight retrieval (no vector DB): paragraph chunks, keyword relevance, top-k to TritonGPT. Optional embeddings later.

**Status: (a) Implemented** (lexical v1; embeddings still optional for later)

### Upload + Text Extraction

**Status: (a) Implemented** — `client/src/extractText.ts`; upload flow in `client/src/App.tsx`.

### Authentication

**Status: (a) Implemented** — `client/src/auth/AuthContext.tsx` (Google popup); `firestore.rules` enforces `request.auth.uid == userId`.

### Document Analysis API

**Status: (a) Implemented** — `POST /api/analyze` in `server/index.js`; client calls from `client/src/App.tsx`.

### Document Chunking

**Status: (a) Implemented** — `server/chunkText.js` (paragraph boundaries, max char cap). Proposal mentioned TypeScript; implementation is JavaScript on the server with the same behavior. Chunks returned with analyze response and saved in Firestore.

### Chat Agent API

**Status: (a) Implemented** — `POST /api/chat` in `server/index.js`; `server/relevance.js` selects top-k chunks; `DocumentChat.tsx` sends question, chunks, and history.

### Grounded Answers

**Status: (a) Implemented** — `CHAT_SYSTEM_PROMPT` in `server/index.js` returns JSON with `answer`, `quotes`, `unclear`. UI shows quotes and an “unclear” notice in `DocumentChat.tsx`.

### Firestore Saves

**Status: (a) Implemented** — `client/src/services/firestoreRuns.ts` (`users/{uid}/runs/{runId}`); fallback `client/src/storage.ts` when Firestore unavailable.

### History Page

**Status: (a) Implemented** — `client/src/App.tsx` (`page === "history"`); reopen run via `openRunAndGoHome`; list from `client/src/hooks/useRuns.ts`.

### Usage Limits

**Status: (a) Implemented** — `server/rateLimit.js`; enforced on analyze/chat in `server/index.js` (`ANALYZE_DAILY_LIMIT`, `CHAT_DAILY_LIMIT`). Requires `userId` on API calls (`requireUserId`).

---

# Privacy & data handling (first deliverable)



| Item | Status | Location |
|------|--------|----------|
| **Not legal advice** | **(a)** | README.md, About page (`client/src/App.tsx`), chat hint in `DocumentChat.tsx`, `CHAT_SYSTEM_PROMPT` |
| **What we store** (chunks, analysis, chat in Firestore) | **(a)** | `client/src/services/firestoreRuns.ts`, About page |
| **Deletion** | **(a)** | History “Remove” → `useRuns.ts` → `deleteRunRemote` / local delete |
| **Per-user access** | **(a)** | `firestore.rules` |
| **Admin / course staff access called out** | **(a)** | About page, proposal text, README |
| **Relevance definition (v1)** | **(a)** | `server/chunkText.js`, `server/relevance.js` (lexical overlap, top-k default 4) |


---

# After First Deliverable Goals

| Goal | Status | Notes |
|------|--------|-------|
| **Multi-document comparison** (e.g. lease vs pet policy) | **(b) Planned** | Would need new UI (compare view) and API to load/rank chunks from multiple saved runs; no code yet. |
| **History search/filter by file name and date** | **(b) Planned** | History list exists (`client/src/App.tsx`) but no search/filter controls yet. |
| **Streaming responses** for chat | **(b) Planned** | Chat uses full JSON response today (`DocumentChat.tsx` → `/api/chat`); would add SSE or chunked streaming in `server/index.js` and client reader. |
| **Better server-side validation and rate limiting for public deployment** | **(a) Implemented** (moved into first deliverable) | Input length checks, `requireUserId`, daily limits in `server/rateLimit.js`, 429 responses. Firebase ID token verification on the server remains **(b) Planned** (currently trusts client-sent `userId`; noted in `server/rateLimit.js` comment). |

---
