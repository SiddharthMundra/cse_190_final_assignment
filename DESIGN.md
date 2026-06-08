# Design decisions — Unfold

---

## 1. Parse documents in the browser, not on the server

When someone uploads a PDF or `.txt`, the text gets pulled out in the browser with PDF.js (for PDFs) or a normal file read (for text). The server never sees the original file—only the string that comes out of extraction, when the user hits analyze or asks a chat question.

I carried this over from Assignment 2 on purpose. I wanted users to feel like parsing happens on their machine first, and that we're not storing a copy of every PDF on our server just because they opened the site. It also kept the backend small: Express just takes JSON, calls the model, and returns JSON. No file upload endpoint, no server-side PDF library, no object storage bill on Render's free tier.

I did think about server-side parsing because some PDFs come out garbled in the browser, and about sending the file to a third-party extractor. I stuck with client-side for this class project because the privacy story mattered more to me than perfect extraction on weird scans.

**Authorship:** The "extract locally" idea was mine before I touched Cursor. The tool helped wire up `pdfjs-dist` and the worker import in `extractText.ts`; I spent time on the progress bar and error messages after a couple of uploads failed silently. 

---

## 2. Ask the model for JSON, then clean it up in the UI

The analyze endpoint tells the LLM to return one JSON object: summary, a list of sections (each clause explained in plain English), risks, and open questions. The chat endpoint does the same kind of thing—answer, optional quotes, and a flag when the doc doesn't really support the answer.

I didn't want the main screen to be a wall of markdown that changes shape every run. `ResultsView` needs stable fields so History and the PDF download look the same every time. So the server checks "is this valid JSON?" and the client runs `normalizeAnalysis` to fill in missing pieces or fix slightly wrong shapes when the model gets lazy (which happened on my fake lease PDFs more than once).

The other option was to let the model write free-form prose and parse it later. That felt faster to build for one afternoon and painful for the rest of the quarter.

**Authorship:** I decided what fields the UI needed—summary, per-section breakdown, risks, questions—before I asked the agent to scaffold types and components. 

---

## 3. Google login, Firestore per user, localStorage as a backup

You have to sign in with Google to use the hosted app. Saves go under `users/{your uid}/runs/...` in Firestore, and the security rules only let you read and write your own subtree. If Firestore isn't configured but you're signed in, the app can still stash runs in `localStorage`; the first time cloud save works, those local runs get copied up and cleared locally.

Firebase was in my proposal from the start—I picked the "ship with auth + live URL" track and didn't want to build login myself. Google-only was a time call, not a deep product decision. The History page (list of past docs, open one again, delete, download PDF) is layout I cared about; a lot of the React in `App.tsx` and `useRuns.ts` came from Cursor and I tweaked it. After staff feedback on the **initial proposal** I made sure delete actually removes a run and that the rules file says other users can't see your data. On **review day**, reviewers asked directly about privacy — what's stored, who can access it, and whether users have options — so I expanded the upload notice and About page: browser extraction first, Firestore per account, delete from History, and an honest note that Firebase console admins (course staff) could technically view stored data. This is a student demo, not a production legal vault.

**Review day + staff email (rate limits):** Reviewers worried about API abuse on the public Render URL. I moved daily quotas into Firestore (`users/{uid}/usage/`) so limits survive restarts, and added Firebase ID token verification so the server doesn't trust a client-sent `userId` (`verifyAuth.js`, `authFetch.ts`).

---

## 4. Lexical retrieval, synonyms, and honest warnings

Document chat ranks paragraph chunks by keyword overlap—not embeddings. In **staff's post–review email** (not review day), they asked for a plain-language ↔ legal-term synonym map (e.g. "fired" → termination) in `relevance.js`, and to **surface retrieval failure** when the top chunks probably don't contain the answer.

I kept lexical search because it is fast, debuggable, and matches the proposal's "no vector DB" architecture. The synonym map is a middle ground before embeddings. When overlap is weak or zero, the chat shows a yellow/red warning **before** the model answer so users know the excerpts may be wrong—not just an "unclear" flag buried after a confident paragraph.

Multi-document **Compare** uses the same retrieval for each side, then asks the model for alignments, conflicts, and gaps. That was in my original proposal's "after first deliverable" list; staff's email asked me to actually ship it for the final submission.

**Authorship:** Synonym terms and retrieval thresholds I picked from common lease/employment wording. Compare UI layout and the warning copy I wrote; API wiring and Firestore quota transactions were scaffolded with agent help and I tested on two sample contracts from `data/`.