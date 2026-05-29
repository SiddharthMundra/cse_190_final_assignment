# Transcript 2 — A4 initial submission deliverables

**Tool:** Cursor (agent chat)  
**Chat ID:** `8eef32e9-5ef0-4b6e-9304-59288636dba8`  
**Topic:** DESIGN.md, proposal/, DEMO.md, marked proposal, transcript scaffolds  
**Author:** Siddharth Mundra

> Exported from Cursor agent transcripts. Tool-only steps are omitted.

---

## Turn 1 — User

Along with your implementation, include the standard set of documents plus two more:

3 transcripts
DESIGN.md
README.md
YouTube video
(new) proposal/
(new) DEMO.md
proposal/ should include:

Your original proposal
A document that is a “marked up” copy of your proposal. It should be the same format as your original (e.g. PDF if you submitted PDF, markdown if you submitted markdown), where for each item in your proposal, you indicate if it's (a) implemented as written/in-use as written, in which case you say where in the code that is, (b) planned to be implemented, in which case you should say where it will fit in, (c) no longer planned. The items you should report on are:
Planned technologies
First deliverable
Rough architecture for first deliverable
After first deliverable goals
DEMO.md should include ONE of:

Instructions for accessing a live demo/install of your tool (e.g. visit this URL, download this Github repo, etc)
Instructions for building the tool from scratch
Please do not give Windows- or Mac-specific instructions. Assume that folks can get WSL or general Linuxy setups to work. You won't be strictly graded on your tool being able to run/install/build on someone else's machine (and given the nature of some of the projects, it's hard to expect someone else to always be able to do it), but please make an effort.

can you do this for my intiial submissio? my website link is https://unifold-ai.onrender.com

## Turn 1 — Assistant

Exploring the project and any existing proposal or documentation so we can create the required deliverables.

*(continued)*

Reading agent transcripts to produce submission documents.

*(continued)*

Creating the submission documents: proposal folder, marked proposal, DEMO.md, transcripts, and README/DESIGN updates.

*(continued)*

I've set up your **A4 initial submission** package. Here's what's in the repo now:

## Created / updated

| Requirement | Location |
|-------------|----------|
| **proposal/** (original) | `proposal/PROPOSAL.md` |
| **proposal/** (marked up) | `proposal/PROPOSAL_MARKED.md` |
| **DEMO.md** | Live demo at https://unifold-ai.onrender.com |
| **3 transcripts** | `transcripts/transcript-1-proposal-privacy-feedback.md`, `transcript-2-implementing-chat-and-core-features.md`, `transcript-3-deploy-and-pdf-export.md` |
| **DESIGN.md** | Authorship reflections filled in |
| **README.md** | Live demo link + submission docs index |

## Marked proposal summary

Your **first deliverable is largely complete (a)**:

- All planned technologies are in use (React/Vite, Express, Firebase, TritonGPT, Render, PDF.js)
- Document chat pipeline: chunk → keyword relevance → grounded answers
- Privacy items from Joe's feedback: disclaimers, Firestore rules, History delete, lexical top-k

**Still planned (b)** for after the first deliverable:

- Multi-document comparison
- History search/filter
- Streaming chat responses
- Embedding-based semantic search (optional upgrade to `server/relevance.js`)

**Moved into first deliverable (a):** server validation + rate limiting (`server/rateLimit.js`)

## What you still need to do

1. **YouTube demo video** — README still has a placeholder. Record a short walkthrough (sign in → upload → analyze → chat → History) and replace the URL in `README.md`.
2. **Review DESIGN.md** — Authorship percentages are drafted in your voice; tweak if they don't match how you actually used Cursor.
3. **Push to GitHub** before Gradescope submit so reviewers can clone the repo linked in `DEMO.md`.

If you share your YouTube link, I can drop it into the README for you.

---
