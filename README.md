# Unfold

**Live demo:** https://unifold-ai.onrender.com — see **[DEMO.md](DEMO.md)** for access instructions.

## Project description

**Unfold** is a web application that helps non-lawyers understand contracts, terms of service, leases, and policies. Users sign in with Google, upload a **PDF** or **.txt** file, and receive a structured plain-language analysis: a short summary, clause-by-clause explanations, flagged risks, and open questions. They can also **ask questions** in a grounded document chat: the server ranks paragraph chunks by keyword overlap and answers from those excerpts only. Text is extracted in the browser; a small backend sends text to a language model (OpenAI-compatible API). Results, chunks, and chat history can be saved per account (Cloud Firestore or browser storage), reopened from History, and downloaded as a formatted PDF report.

**Unfold is not legal advice**—it is a reading aid only.

Design tradeoffs and authorship reflection for three key decisions: see **[DESIGN.md](DESIGN.md)**. Technical architecture: **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## Setup

Follow these steps **from the repository root** (terminal).

### 1. Install dependencies

```bash
npm install
```

Uses npm **workspaces** (`client`, `server`).

### 2. API keys and LLM endpoint (backend)

Analysis calls require an OpenAI-**compatible** HTTP API (this project uses env names aligned with a Triton-style host).

1. Create a file named **`.env`** in the **project root** (same folder as the root `package.json`), **or** in **`server/`**.
2. Add:

```env
TRITON_BASE_URL=https://your-api-host.example.com
TRITON_API_KEY=your-secret-key-here
TRITON_MODEL=your-model-name
```

- **`TRITON_BASE_URL`** — Base URL for the API; the server trims slashes and ensures a `/v1` suffix for the OpenAI client.
- **`TRITON_API_KEY`** — API key for that endpoint.
- **`TRITON_MODEL`** — Model identifier sent to the chat API (if omitted, the server defaults to `gpt-oss-120b`).
- **`PORT`** *(optional)* — Port for the Express API (default **8787**).
- **`ANALYZE_DAILY_LIMIT`** *(optional)* — Max analyze requests per signed-in user per day (default **25**).
- **`CHAT_DAILY_LIMIT`** *(optional)* — Max chat requests per signed-in user per day (default **80**).

Without `TRITON_BASE_URL` and `TRITON_API_KEY`, `/api/analyze` and `/api/chat` return **503** (LLM not configured).

### 3. Firebase and client keys (sign-in + optional cloud history)

1. In the [Firebase Console](https://console.firebase.google.com/), create or select a project; enable **Authentication → Google** and create a **Firestore** database in production or test mode (then deploy `firestore.rules` from this repo).
2. Register a **Web** app and copy the config object.
3. Copy **`client/.env.example`** to **`client/.env`**.
4. Fill in all **`VITE_FIREBASE_*`** variables from the Firebase snippet.
5. Deploy Firestore rules when ready: `firebase deploy --only firestore:rules` (from repo root, with Firebase CLI logged in).

Vite only exposes variables prefixed with **`VITE_`**. Restart the dev server after changing `client/.env`.

---

## How to run

Run the **full local pipeline** (browser UI + API) from the **repository root**:

```bash
npm run dev
```

This starts:

| Process | Command (via workspaces) | Default URL |
|--------|---------------------------|-------------|
| React client (Vite) | `npm run dev -w client` | http://localhost:5173 |
| Express API | `npm run dev -w server` | http://localhost:8787 |

The Vite dev server **proxies** requests to **`/api/*`** to the API, so in development you open **http://localhost:5173** and use the app there; API calls go to `/api/health`, `/api/analyze`, and `/api/chat` on the same origin.

**Production build** (static frontend only):

```bash
npm run build
```

Output: **`client/dist/`**. For production, run **`npm start`** — the server serves **`client/dist/`** and the API on one port (see **[DEPLOY.md](DEPLOY.md)** for Render).

### Deploy on Render

See **[DEPLOY.md](DEPLOY.md)** for step-by-step instructions. Summary:

1. Connect the GitHub repo to a Render **Web Service** (or use **`render.yaml`** Blueprint).
2. Set **`TRITON_*`** and **`VITE_FIREBASE_*`** env vars in the Render dashboard.
3. Add your `*.onrender.com` host to **Firebase → Authorized domains**.
4. Build: `npm install && npm run build` · Start: `npm start`

---

## Demo video

- **YouTube:** [Add your demo video URL here before Gradescope submit](https://www.youtube.com/watch?v=REPLACE_WITH_YOUR_VIDEO_ID)

---

## Initial submission documents (A4)

| Document | Path |
|----------|------|
| Original proposal | [proposal/PROPOSAL.md](proposal/PROPOSAL.md) |
| Marked proposal (implementation status) | [proposal/PROPOSAL_MARKED.md](proposal/PROPOSAL_MARKED.md) |
| Demo access | [DEMO.md](DEMO.md) |
| Design decisions + authorship | [DESIGN.md](DESIGN.md) |
| Agent transcripts (×3) | [transcripts/](transcripts/) |

---

## Pipeline stages

Each stage matches a part of the product; together they keep **trust** (local parsing), **quality** (structured LLM output), and **accountability** (signed-in saves) aligned with a small team or coursework scope.

| Stage | What happens | Why this stage |
|-------|----------------|----------------|
| **1. Authentication** | User signs in with **Google** via Firebase; session gates the main app. | Ties saved analyses to an identity without building custom auth; enables per-user data in Firestore. |
| **2. Ingest & extract** | User selects or drops **PDF** or **.txt**; text is read **in the browser** (PDF.js for PDFs). | Avoids uploading binary files to our server for parsing; only text is sent onward; clear privacy story. |
| **3. Analyze** | Browser `POST`s text to **`/api/analyze`** (with `userId`); server chunks the text, calls the LLM, returns analysis + chunks; per-user daily limits apply. | Centralizes secrets (`TRITON_*`); chunks enable grounded chat without sending the full document every time. |
| **4. Present & chat** | React shows summary, sections, risks, and questions; user asks follow-ups via **`/api/chat`** (top keyword-matched chunks + history). | Structured analysis plus interactive Q&A grounded in the upload. |
| **5. Persist** | Each run (analysis, chunks, chat) is saved under **`users/{uid}/runs`** in **Firestore** when configured, else **localStorage**; users can delete runs from History. | Users can return to past work and continue chat; rules enforce one user’s data per subtree. |

---

## Repository layout

| Path | Role |
|------|------|
| `client/` | React + TypeScript + Vite SPA |
| `server/` | Express API (`/api/health`, `/api/analyze`, `/api/chat`, `/api/chunk`) |
| `firestore.rules` | Firestore security rules (user-scoped data) |
| `firebase.json` | Firebase CLI config (e.g. rules deployment) |
| `DESIGN.md` | Design decisions and authorship reflection |
| `ARCHITECTURE.md` | Deeper technical detail |
