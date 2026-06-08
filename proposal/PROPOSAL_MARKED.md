# Unfold: AI Legal Document Assistant — Marked Proposal (Final)


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

**Status: (a) Implemented**

---

# Planned Technologies

| Technology | Status | Where in code / notes |
|------------|--------|------------------------|
| **Frontend: React + Vite** | **(a)** | `client/` |
| **Backend: Node + Express** | **(a)** | `server/index.js` |
| **Login & saves: Firebase (Google + Firestore)** | **(a)** | `client/src/auth/`, `client/src/services/firestoreRuns.ts`, `firestore.rules` |
| **AI: TritonGPT LLM API** | **(a)** | `server/index.js` — `TRITON_*` env vars |
| **Hosting: Render** | **(a)** | `render.yaml`, https://unifold-ai.onrender.com |
| **PDF Processing: PDF.js** | **(a)** | `client/src/extractText.ts` |
| **Server auth: Firebase Admin** | **(a)** | `server/verifyAuth.js`, `client/src/api/authFetch.ts` |
| **Server-side quotas: Firestore** | **(a)** | `server/rateLimit.js` — `users/{uid}/usage/` |

---

# First Deliverable

> Agent-based document chat: upload PDF or `.txt`, extract text, ask questions in a chat interface.

**Status: (a) Implemented** — upload, extract, analyze, chat, saves, history. See prior marked proposal for file-level map.

---

# Rough Architecture for First Deliverable

| Component | Status | Location |
|-----------|--------|----------|
| Upload + Text Extraction | **(a)** | `client/src/extractText.ts`, `client/src/App.tsx` |
| Authentication | **(a)** | Firebase client + **server ID token verification** (`server/verifyAuth.js`) |
| Document Analysis API | **(a)** | `POST /api/analyze` |
| Document Chunking | **(a)** | `server/chunkText.js` |
| Chat Agent API | **(a)** | `POST /api/chat`, `server/relevance.js` (lexical + **synonym map**) |
| Grounded Answers | **(a)** | JSON answer + quotes + unclear flag + **retrieval warnings** |
| Firestore Saves | **(a)** | `client/src/services/firestoreRuns.ts` |
| History Page | **(a)** | `client/src/App.tsx` — includes **search/filter** |
| Usage Limits | **(a)** | **Firestore-backed** daily limits — `server/rateLimit.js` |

### Relevance (v1 + staff additions)

1. Paragraph chunking — `server/chunkText.js`
2. Lexical overlap + **plain-language ↔ legal synonym expansion** — `server/relevance.js` (`LEGAL_SYNONYMS`, `expandQueryTokens`)
3. Top-k excerpts to TritonGPT
4. **Retrieval status** (`ok` / `weak` / `failed`) surfaced in chat UI — `DocumentChat.tsx`

---

# After First Deliverable Goals

| Goal | Status | Notes |
|------|--------|-------|
| **Multi-document comparison** | **(a) Implemented** | `POST /api/compare`, Compare page — `client/src/components/CompareView.tsx`, nav in `App.tsx` |
| **History search/filter** | **(a) Implemented** | Filename search + sort — `client/src/App.tsx` |
| **Streaming responses** | **(c) No longer planned** | See [REGRETS.md](../REGRETS.md) |
| **Server validation + rate limiting** | **(a) Implemented** | Verified Firebase tokens + **Firestore per-user quotas** + input length checks |
| **Embedding-based semantic search** | **(c) No longer planned** | Synonym map shipped instead; embeddings deferred |

---

# Feedback addressed (final submission)

### Review day (in class)

| Feedback | Status | Code |
|----------|--------|------|
| Rate limiting on public deploy | **(a)** | `server/rateLimit.js` — Firestore per-user daily caps |
| Data privacy — storage, access, user control | **(a)** | `firestore.rules`, History delete, upload/About/README notices |

### Staff email (post–review day)

| Feedback | Status | Code |
|----------|--------|------|
| Verify Firebase ID tokens | **(a)** | `server/verifyAuth.js` |
| Persistent per-user quotas | **(a)** | `server/rateLimit.js` |
| Synonym map in relevance | **(a)** | `server/relevance.js` |
| Multi-document comparison | **(a)** | `/api/compare` + `CompareView.tsx` |
| Surface retrieval failure | **(a)** | `retrievalWarning` in chat + compare UI |

