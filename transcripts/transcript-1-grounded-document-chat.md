# Transcript 1 — Grounded document chat

**Me:** I need the chat feature from my proposal. When someone asks a question, only send the most relevant parts of the doc to the model, not the whole thing. Keep answers tied to excerpts. I don't want a vector DB for v1—just something simple that works.

**Agent:** Added `server/chunkText.js` to split on paragraph breaks (blank lines) with a ~1200 char cap so long clauses get split safely. `server/relevance.js` tokenizes the question and each chunk, scores by shared words (stopwords removed), and returns top 4. `POST /api/chat` in `server/index.js` sends those excerpts plus the last few chat turns to the model. Response JSON: `answer`, `quotes`, `unclear`. Analyze already calls `chunkText` and returns `chunks` with the analysis so the client can save them.

**Me:** Wire it on the frontend after results show up.

**Agent:** Built `DocumentChat.tsx`—textarea, send button, bubble list for user/assistant. It POSTs `question`, `chunks`, `history`, and `userId` to `/api/chat`. Hooked it into `App.tsx` below `ResultsView` once analyze finishes. Shows supporting quotes under the assistant message when the model returns them.

**Me:** If nothing matches the question, don't hallucinate a clause.

**Agent:** Updated `CHAT_SYSTEM_PROMPT` to answer only from excerpts and set `unclear: true` when evidence is thin. If every chunk scores zero overlap, it still sends a few chunks but the prompt tells the model to admit uncertainty. UI renders a small warning when `unclear` is true.

**Me:** Also block legal advice questions.

**Agent:** Added instruction in the chat prompt: if they ask whether to sign or sue, decline and remind them it's informational only.
