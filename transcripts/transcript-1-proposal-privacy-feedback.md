# Agent Transcript 1 — Proposal privacy & legal-scope feedback

| Field | Value |
|-------|--------|
| **Course** | CSE 190 — Generative AI Programming (SP26) |
| **Project** | Unfold — AI legal document assistant |
| **Tool** | Cursor (Composer agent) |
| **Chat ID** | `4cd6c5f2-ece1-4bac-8a52-dcc2938b3fb3` |
| **Author** | Siddharth Mundra |

**Purpose of this session:** Respond to course staff feedback on my A4 proposal—especially privacy, whether the app gives legal advice, and how “relevant” document chunks are defined for chat.

---

## Turn 1

### My prompt

I received feedback on my project proposal from Joe. I need to reply thoughtfully. The main points are:

1. Think hard about privacy and sensitive data.
2. **Are you giving legal advice?** Say so clearly.
3. **What happens to uploaded contracts?** Do they sit in a database? Can users delete them? Could I read other people’s files? Discovery risk? Acquisition?
4. Discuss, at the **first deadline**, the consequences of storing this kind of data.
5. **How will you define “relevant” chunks** in search?

How should I reply to all of this?

*(I pasted the full staff email into the chat.)*

### Agent response

The agent reviewed `proposal/PROPOSAL.md` and summarized what staff were asking for: a clear legal-advice boundary, a concrete data lifecycle, and a v1 definition of chunk relevance—not vague “we’ll find relevant parts.”

It drafted a structured email reply covering:

- **Not legal advice** — informational summaries only; UI/README disclaimers planned.
- **Storage** — Firestore per user; TritonGPT only on user-initiated analyze/chat requests.
- **Deletion** — user-initiated delete from History by first deadline.
- **Access** — Firestore rules; honest note about Firebase admin/console access for debugging/grading.
- **Risks** — discovery/breach at scale; mitigations for a student demo.
- **Relevance (v1)** — paragraph chunks, lexical overlap scoring, top-k excerpts, grounded answers.

It also listed what to add to `PROPOSAL.md`: not legal advice, data lifecycle, access & risks, relevance definition.

---

## Turn 2

### My prompt

Can you answer each of Joe’s questions **line by line**, in the same order they were asked?

### Agent response

The agent produced ordered answers tied to my stack (Firestore, paragraph chunks, TritonGPT, first deliverable). Summary by question:

| Staff question | My planned answer (summary) |
|----------------|---------------------------|
| Privacy & sensitive data | Treat uploads as PII; document storage, access, delete, and LLM transmission in the proposal; Firebase rules; no training on user docs. |
| Legal advice? | **No.** Explain text only; disclaimers in UI and README. |
| What are you doing with contracts? | Extract → analyze → chunk → save to Firestore; send excerpts to TritonGPT on request only. |
| In a database? | **Yes** — Firestore, scoped per `auth.uid`. |
| Can people delete? | **Yes** — History delete by first deadline. |
| Can you read random contracts? | Technically via Firebase console; other users cannot; I won’t browse routinely. |
| Should you? | **No** — only debugging or grading when appropriate. |
| Discovery risk? | Real at commercial scale; lower for class demo; mitigations documented at first deadline. |
| Acquisition? | N/A for class; note production concerns briefly. |
| Discuss consequences at first deadline? | Add **Privacy & data handling** section to proposal. |
| Define “relevant” chunks? | Paragraph split → token overlap → top-k → grounded prompt; embeddings optional later. |

---

## Turn 3

### My prompt

Reframe all of that in **simple words**, as if I wrote it myself (for an email to staff).

### Agent response

The agent rewrote every answer in first-person, plain language—suitable for a direct reply to Joe. Key lines I used in follow-up work:

- *“No. I’m not giving legal advice.”*
- *“The text, chunks, analysis, and chat live in Firestore under their account.”*
- *“For the first version, ‘relevant’ means the chunks that match the question best with simple word matching.”*

---

## Outcome

- Added **Privacy & data handling** to `proposal/PROPOSAL.md`.
- Implemented matching features: About-page privacy copy, Firestore rules, History delete, `server/relevance.js` (lexical top-k), disclaimers in UI.

*Tool calls (file search, read proposal) omitted from this export.*
