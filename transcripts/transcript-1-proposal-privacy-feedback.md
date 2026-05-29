# Transcript 1 — Responding to proposal privacy feedback

**Tool:** Cursor (agent chat)  
**Topic:** Staff feedback on privacy, legal advice, and chunk relevance  
**Author:** Siddharth Mundra

---

**User:** Hi — here's feedback on my proposal (from Joe). I need to think hard about privacy and sensitive data:

- Are you giving legal advice?
- What are you doing with contracts — database, delete, can you read them, discovery risk, acquisition?
- How will you define "relevant" chunks?

How do I reply?

**Assistant:** Reviewed `PROPOSAL.md` and README. Joe wants explicit answers on legal scope, data lifecycle, and a concrete v1 relevance definition — not just "we'll find relevant parts." Drafted a structured email reply covering: not legal advice, Firestore storage, planned delete on History, security rules, honest admin access, and lexical top-k chunk ranking.

**User:** Can you answer them line by line in the order they asked?

**Assistant:** Provided ordered answers:

1. Privacy — treat uploads as sensitive; document in proposal by first deadline.
2. Legal advice — **No**; UI + README disclaimers.
3. What happens to contracts — extract, analyze, chunk, save to Firestore; TritonGPT on request only.
4. Database — yes, Firestore per user.
5. Delete — yes, History delete by first deadline.
6. Can I read random contracts — technically via Firebase console; won't routinely browse.
7. Should I — no, except debugging/grading.
8. Discovery risk — real at scale; mitigations for student demo.
9. Acquisition — N/A for class; note for production.
10. Discuss at first deadline — Privacy section in proposal.
11. Relevant chunks — paragraph split, token overlap scoring, top 3–5, grounded prompt; embeddings later optional.

**User:** Reframe all in simple words as if I wrote it.

**Assistant:** Rewrote each answer in plain first-person language suitable for an email reply to course staff.

---

**Outcome:** Privacy & data handling section added to `PROPOSAL.md` (lines 60–81). Implementation followed in About page, Firestore rules, History delete, and `server/relevance.js`.
