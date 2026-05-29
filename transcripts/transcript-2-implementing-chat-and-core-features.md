# Agent Transcript 2 — A4 initial submission package

| Field | Value |
|-------|--------|
| **Course** | CSE 190 — Generative AI Programming (SP26) |
| **Project** | Unfold — AI legal document assistant |
| **Tool** | Cursor (Composer agent) |
| **Chat ID** | `8eef32e9-5ef0-4b6e-9304-59288636dba8` |
| **Author** | Siddharth Mundra |

**Purpose of this session:** Assemble required initial-submission documents (proposal folder, marked proposal, DEMO.md, transcripts, DESIGN.md, README) and align them with the live deployment.

---

## Turn 1

### My prompt

For my initial submission I need to include the standard documents plus:

- 3 agent transcripts  
- `DESIGN.md`  
- `README.md`  
- YouTube demo video  
- **`proposal/`** — original proposal + a **marked-up** copy (same format as original). For each item, mark: **(a)** implemented as written (with code locations), **(b)** planned, or **(c)** no longer planned. Report on: planned technologies, first deliverable, rough architecture, after-first-deliverable goals.  
- **`DEMO.md`** — either live-demo access instructions **or** build-from-scratch (Linux/WSL-friendly; no Windows/Mac-only steps).

Please set this up for my initial submission. My live site is:

**https://unifold-ai.onrender.com**

### Agent response

The agent explored the repo and prior chats, then created the submission package.

#### Files created or updated

| Requirement | Location |
|-------------|----------|
| Original proposal | `proposal/PROPOSAL.md` |
| Marked proposal | `proposal/PROPOSAL_MARKED.md` |
| Live demo | `DEMO.md` → https://unifold-ai.onrender.com |
| Transcripts (×3) | `transcripts/transcript-1-…`, `transcript-2-…`, `transcript-3-…` |
| Design + authorship | `DESIGN.md` |
| Index + setup | `README.md` |

#### Marked proposal summary (agent assessment)

**Mostly implemented (a) for first deliverable:**

- React/Vite, Express, Firebase (Google + Firestore), TritonGPT, Render, PDF.js  
- Document chat: chunk → keyword relevance → grounded answers  
- Privacy items from staff feedback: disclaimers, Firestore rules, History delete, lexical top-k in `server/relevance.js`  
- Rate limiting in `server/rateLimit.js`

**Still planned (b) after first deliverable:**

- Multi-document comparison  
- History search/filter  
- Streaming chat responses  
- Optional embedding-based semantic search

#### Remaining tasks (for me)

1. Record YouTube demo and add URL to `README.md`  
2. Review `DESIGN.md` authorship percentages  
3. Push to GitHub before Gradescope

---

## Outcome

Initial submission document structure in the repo; `PROPOSAL_MARKED.md` maps proposal claims to code paths for grading.

*Tool calls (read repo, write markdown files) omitted from this export.*
