# Design decisions — Unfold

---

## 1. Parse documents in the browser, not on the server

When someone uploads a PDF or `.txt`, the text gets pulled out in the browser with PDF.js (for PDFs) or a normal file read (for text). The server never sees the original file—only the string that comes out of extraction, when the user hits analyze or asks a chat question.

I carried this over from Assignment 2 on purpose. I wanted users to feel like parsing happens on their machine first, and that we're not storing a copy of every PDF on our server just because they opened the site. It also kept the backend small: Express just takes JSON, calls the model, and returns JSON. No file upload endpoint, no server-side PDF library, no object storage bill on Render's free tier.

I did think about server-side parsing because some PDFs come out garbled in the browser, and about sending the file to a third-party extractor. I stuck with client-side for this class project because the privacy story mattered more to me than perfect extraction on weird scans.

**Authorship:** The "extract locally" idea was mine before I touched Cursor. The tool helped wire up `pdfjs-dist` and the worker import in `extractText.ts`; I spent time on the progress bar and error messages after a couple of uploads failed silently. I'd say most of the product intent was mine, and maybe a quarter of the actual code was generated and then edited by me.

---

## 2. Ask the model for JSON, then clean it up in the UI

The analyze endpoint tells the LLM to return one JSON object: summary, a list of sections (each clause explained in plain English), risks, and open questions. The chat endpoint does the same kind of thing—answer, optional quotes, and a flag when the doc doesn't really support the answer.

I didn't want the main screen to be a wall of markdown that changes shape every run. `ResultsView` needs stable fields so History and the PDF download look the same every time. So the server checks "is this valid JSON?" and the client runs `normalizeAnalysis` to fill in missing pieces or fix slightly wrong shapes when the model gets lazy (which happened on my fake lease PDFs more than once).

The other option was to let the model write free-form prose and parse it later. That felt faster to build for one afternoon and painful for the rest of the quarter.

**Authorship:** I decided what fields the UI needed—summary, per-section breakdown, risks, questions—before I asked the agent to scaffold types and components. I rewrote big chunks of the system prompt in `server/index.js`, especially the "this is not legal advice" language and the rule to split numbered clauses into separate sections. Cursor wrote most of `analysisNormalize.ts` after I showed it examples of broken output; I chose what to treat as optional vs required. Roughly half and half on product/prompt vs generated code, leaning toward my side on anything user-facing.

---

## 3. Google login, Firestore per user, localStorage as a backup

You have to sign in with Google to use the hosted app. Saves go under `users/{your uid}/runs/...` in Firestore, and the security rules only let you read and write your own subtree. If Firestore isn't configured but you're signed in, the app can still stash runs in `localStorage`; the first time cloud save works, those local runs get copied up and cleared locally.

Firebase was in my proposal from the start—I picked the "ship with auth + live URL" track and didn't want to build login myself. Google-only was a time call, not a deep product decision. The History page (list of past docs, open one again, delete, download PDF) is layout I cared about; a lot of the React in `App.tsx` and `useRuns.ts` came from Cursor and I tweaked it. After staff feedback on privacy I made sure delete actually removes a run and that the rules file says other users can't see your data. I was also honest in the About page that someone with Firebase console access could technically look at stored docs—that's true and pretending otherwise felt wrong.

