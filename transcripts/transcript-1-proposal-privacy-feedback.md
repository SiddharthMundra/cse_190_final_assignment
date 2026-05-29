# Transcript 1 — Proposal privacy feedback (Joe)

**Tool:** Cursor (agent chat)  
**Chat ID:** `4cd6c5f2-ece1-4bac-8a52-dcc2938b3fb3`  
**Topic:** Staff feedback on privacy, legal advice, and chunk relevance  
**Author:** Siddharth Mundra

> Exported from Cursor agent transcripts. Tool-only steps are omitted.

---

## Turn 1 — User

Hi Sid Mundra,

Here's our feedback on your project proposal (feedback by joe):

You MUST think hard about privacy and handling sensitive data here.

- Are you giving legal advice? Say so one way or another
- What are you doing with all these contracts? Do they sit in your
database? Can
people delete them? Will you be able to read random people's contracts?
Should
you? Will you be a target for document discovery in legal cases as a
result of
the trove of data you have? If you're acquired will the buying company
behave as
well as you? Discuss, at the *first* deadline, the consequences of
storing this
kind of data.
- How will you define “relevant” chunks in the search

Let us know if you have question

how do i reply to all this?

## Turn 1 — Assistant

Reviewing your project proposal and codebase so we can draft a concrete reply to Joe's feedback.

*(continued)*

This is proposal feedback, not a request to rewrite code. Joe wants you to show you’ve thought through privacy, legal boundaries, and retrieval — especially for the **first deadline**. Below is how to read each point and a reply you can adapt.

## What Joe is asking for

| Topic | What they want |
|--------|----------------|
| **Legal advice** | A clear yes/no: are you giving legal advice? If not, how you say that and what the product actually does |
| **Contract storage** | Where data lives, who can read it, deletion, abuse/legal discovery, acquisition |
| **“Relevant” chunks** | A concrete definition for v1 search, not “we’ll find relevant parts” |

Your proposal already says chunks go in Firestore and you use paragraph-sized chunks, but it doesn’t answer privacy, legal disclaimers, or how relevance is scored.

---

## Draft reply (email or comment thread)

You can paste and edit this:

---

**Subject: Re: proposal feedback — privacy, legal scope, and chunk retrieval**

Hi Joe,

Thanks for the feedback. I’ve thought through privacy and sensitive data for Unfold and plan to document this explicitly at the **first deliverable**. Answers below:

### Am I giving legal advice?

**No.** Unfold is a document-reading and explanation tool for a course project, not a law firm or licensed legal service. It helps users understand text in documents they upload (summaries, clause explanations, Q&A grounded in the file). It does **not** tell users what they should do legally, whether they should sign, or how to litigate.

For the first deliverable I will:
- State in the UI and README that outputs are **informational only, not legal advice**, and that users should consult a qualified attorney for legal decisions.
- Avoid language like “you should sign” or “this clause is enforceable in your jurisdiction.”

### What happens to uploaded contracts?

**Storage (first deliverable):**
- Extracted text, chunk text, analysis results, and chat history are stored in **Firestore**, scoped to the signed-in user’s Firebase UID.
- Data is sent to **TritonGPT** only for analysis/chat on that user’s request (same as today’s flow, with usage limits).

**Deletion:**
- I will add **user-initiated delete** for a saved document (and its chunks + chat) from the History page by the first deadline, and document that in the proposal/README.

**Who can read them:**
- **Other users:** No — Firestore security rules will restrict reads/writes to `request.auth.uid == resource.data.userId` (or equivalent).
- **Me / course staff:** Firebase project admins (me, and potentially course/TAs with console access for grading) *could* access data in the console. For a class project I will **not** routinely read user documents; I’ll only access data if needed for debugging with permission or for grading a specific submission the student points me to.
- **TritonGPT / API provider:** Request payloads include document excerpts sent for that API call; I’ll note this in the privacy section.

**Legal discovery / being a target:**
- At course scale, I’m not building a large commercial corpus. Still, **any central storage of contracts creates risk** if the app were deployed broadly: subpoenas, breaches, or misuse of admin access. Mitigations for this project: minimal retention (delete on request), no public sharing of uploads, no training on user documents, and clear terms that this is a **student demo**, not a production legal platform.

**Acquisition:**
- Not applicable to the class project. If this were real product, I’d want **no sale of user documents without explicit consent**, data export/delete before transfer, and contractual commitments from an acquirer — I can add a short “if this were production” paragraph in the proposal.

I’ll add a **“Privacy & data handling”** subsection to the first-deliverable section of the proposal before the deadline.

### How will I define “relevant” chunks?

For **v1 (first deliverable)** I’m **not** using embeddings yet. Relevance means:

1. **Chunking:** Split extracted text into **paragraph-sized** segments (blank-line boundaries, with a max character cap so chunks stay within model limits).
2. **Scoring:** Rank chunks by **overlap with the user’s question** — e.g. tokenize question and chunk, score by shared terms (and optionally simple stemming), take **top-k** (e.g. 3–5) chunks.
3. **Grounding:** Only those top-k chunks plus recent chat history go to TritonGPT, with instructions to answer **only from those excerpts** and to say when the document doesn’t support an answer.

If time allows after the first deadline, I may move to **embedding-based semantic search** for better relevance on paraphrased questions; v1 relevance is explicitly **lexical overlap / keyword ranking**, not semantic similarity.

Happy to clarify anything or tighten the first-deadline privacy write-up.

Best,  
Sid

---

## What to add to `PROPOSAL.md` (first deadline)

A short subsection under **First Deliverable** is enough, for example:

1. **Not legal advice** — UI disclaimer + scope of outputs  
2. **Data lifecycle** — Firestore, per-user isolation, delete, API transmission  
3. **Access & risks** — who can read data, student-demo limits, discovery in one paragraph  
4. **Relevance (v1)** — paragraph chunks + keyword top-k, embeddings as optional later  

That shows Joe you’re treating this seriously, not only replying in email.

---

## Tone tips

- Be **direct** (“No, not legal advice”) — don’t hedge.  
- Separate **what you will build by deadline** (delete, rules, disclaimer, lexical top-k) from **production hypotheticals** (acquisition, discovery at scale).  
- Admit **admin/console access** honestly; pretending only the user can ever see data isn’t credible with Firebase.  

If you want, I can draft the exact **Privacy & data handling** block for `PROPOSAL.md` so it matches this reply.

---

## Turn 2 — User

can you answeer them line by line based on what they asked in order

## Turn 2 — Assistant

Answers in the **same order** as Joe’s questions, tied to your proposal (Firestore, paragraph chunks, TritonGPT, first deliverable).

---

**“You MUST think hard about privacy and handling sensitive data here.”**

I am treating uploads as sensitive: contracts and policies may contain names, addresses, financial terms, and other PII. For the first deliverable I will document a privacy section in the proposal covering what is stored, who can access it, how users delete data, what is sent to the LLM API, and that this is a student demo—not a production legal platform. I will use Firebase security rules so users only read/write their own documents, avoid using uploads for training, and add clear in-app notice that users should not upload documents they are not allowed to share with this app.

---

**“Are you giving legal advice? Say so one way or another”**

**No, I am not giving legal advice.** Unfold explains and summarizes text in documents the user uploads; it does not tell them what to do legally, whether to sign, or whether a clause is enforceable. By the first deadline I will state in the UI and README that outputs are informational only, not legal advice, and that users should consult a qualified attorney for legal decisions.

---

**“What are you doing with all these contracts?”**

When a user uploads a PDF or `.txt`, the app extracts text, runs analysis (summary, clauses, risks), splits the text into chunks for chat, and saves that material to **Firestore** linked to their Firebase account so they can reopen it on the History page. Text is also sent to **TritonGPT** when they run analysis or ask a chat question (only for that request, with usage limits). I am not building a shared corpus or selling/using contracts for model training.

---

**“Do they sit in your database?”**

**Yes.** Extracted text, chunk text, analysis results, and chat history sit in **Firestore** (Firebase), scoped per signed-in user. They are not stored in a separate custom database for this project.

---

**“Can people delete them?”**

**They will be able to by the first deadline.** I will add user-initiated delete from the History page (remove the saved document and its chunks, analysis, and chat for that item). I will describe this in the proposal/README for the first deadline.

---

**“Will you be able to read random people's contracts?”**

**Technically, yes, in limited ways; in practice, no for routine use.** As the Firebase project owner (and possibly course staff with console access), admin access could view stored data. Other signed-in users will **not** be able to read each other’s contracts if security rules enforce `auth.uid` ownership. I will not routinely read strangers’ uploads; I would only access a specific document for debugging with permission or for grading when a student points me to their submission.

---

**“Should you?”**

**No, I should not read users’ contracts except when necessary** (e.g. debugging a reported bug on a document they agree to share, or course grading on work they submit). Reading random uploads would violate user trust and is unnecessary for the app to function.

---

**“Will you be a target for document discovery in legal cases as a result of the trove of data you have?”**

**If the app held a large commercial trove of contracts, yes—that kind of central storage can attract subpoenas, breaches, and discovery.** For this **course project** at small scale, the risk is lower but not zero. I will mitigate by: per-user isolation, user delete, no public sharing of uploads, no training on user documents, and clear labeling as a student demo. I will discuss these consequences explicitly in the proposal at the **first deadline**, not only at ship time.

---

**“If you're acquired will the buying company behave as well as you?”**

**Not applicable to the class project.** If this were a real product, an acquirer could change practices unless constrained by contract and law; I would want no sale of document content without consent, strong delete/export rights, and privacy commitments that survive acquisition. I can add a short “production / acquisition” note in the first-deadline privacy discussion.

---

**“Discuss, at the *first* deadline, the consequences of storing this kind of data.”**

By the **first deadline** I will add a **Privacy & data handling** subsection to the proposal covering: (1) sensitive nature of contracts; (2) what is stored and where; (3) API transmission to TritonGPT; (4) user delete and access control; (5) admin/console access honesty; (6) risks (breach, misuse, discovery) and why this stays a limited student deployment; (7) not legal advice. That satisfies discussing storage consequences at the first milestone, not only at final ship.

---

**“How will you define ‘relevant’ chunks in the search”**

For the **first deliverable**, “relevant” means **the chunks that best match the user’s question under a simple lexical rule**, not semantic “understanding” yet:

1. **Chunking:** Split document text into **paragraph-sized** segments (e.g. blank-line breaks), with a max size so chunks fit the model context.  
2. **Scoring:** Compare the user’s question to each chunk (e.g. shared words / token overlap).  
3. **Selection:** Take the **top-k** highest-scoring chunks (e.g. 3–5).  
4. **Use:** Send only those chunks (plus recent chat history) to TritonGPT with instructions to answer only from those excerpts and to say when the document does not support an answer.

Later, if time allows, “relevant” may mean **embedding similarity** (semantic search); for v1 it is explicitly **keyword/overlap ranking on paragraph chunks**.

---

You can paste this as your reply as-is or shorten each block to one sentence if they want a brief email. I can also turn this into a `PROPOSAL.md` subsection if you want it in the repo.

---

## Turn 3 — User

reframe all in simple words as if i have writtne it

## Turn 3 — Assistant

Here’s the same order, in plain words, like you wrote it:

---

**You must think hard about privacy and handling sensitive data.**

I know people might upload real contracts with personal info in them. I’m treating that seriously. For the first deadline I’ll write a clear section in my proposal about what I store, who can see it, and how people can delete stuff. I’ll lock data so each person only sees their own files, I won’t use their docs to train anything, and I’ll tell users this is a school project demo—not something they should trust like a real legal product.

---

**Are you giving legal advice? Say so one way or another.**

**No. I’m not giving legal advice.** My app just helps explain what’s in a document they upload. It doesn’t tell them whether to sign, sue, or what they “should” do legally. Before the first deadline I’ll put a note in the app and README that says: this is for understanding only, not legal advice—talk to a real lawyer if you need that.

---

**What are you doing with all these contracts?**

When someone uploads a file, I pull out the text, run the summary/clause/risk stuff, break it into pieces for chat, and save it in Firebase so they can open it again later. When they chat or re-run analysis, some of that text goes to TritonGPT. I’m not collecting everyone’s contracts into one big pile or selling them or training a model on them.

---

**Do they sit in your database?**

**Yeah.** The text, the chunks, the analysis, and the chat all live in **Firestore** under their account. I’m not running a separate database for this.

---

**Can people delete them?**

**Yes—that’s my plan for the first deadline.** I’ll add a delete button on the history page so they can remove a saved doc and everything tied to it (chunks, analysis, chat). I’ll say that clearly in the proposal too.

---

**Will you be able to read random people’s contracts?**

**Kind of, but only because I own the Firebase project.** I *could* see stuff in the Firebase console if I looked. Random users won’t see each other’s stuff if my security rules are set up right. I’m **not** planning to go read people’s uploads for fun—only if I need to debug something they ask me about, or for grading if it’s part of the class.

---

**Should you?**

**No.** I shouldn’t be reading people’s contracts unless there’s a real reason (like they asked for help fixing a bug, or it’s for grading). There’s no good reason for me to snoop.

---

**Will you be a target for document discovery in legal cases because of all the data you have?**

If this were a huge real product with tons of contracts stored, **yeah, that could be a problem**—people could try to get that data in a lawsuit or it could get hacked. For my **class project** it’s much smaller, but the risk still exists in theory. I’m trying to keep it safer by: only letting people see their own stuff, letting them delete, not sharing uploads publicly, and being clear this is just a student app—not a place to dump your most sensitive legal files.

---

**If you’re acquired, will the buying company behave as well as you?**

**Doesn’t really apply to my class project.** But if this were a real company someday, a buyer might not care about privacy the much as I do unless there are strict rules. I’d want users to be able to delete/export their data and not have their contracts sold off. I can mention that briefly in my first-deadline write-up.

---

**Discuss, at the first deadline, the consequences of storing this kind of data.**

By the **first deadline** I’ll add a section to my proposal that talks straight about: this is sensitive stuff, here’s where it lives, it goes to the LLM when they use the app, users can delete, I could technically see it in Firebase but won’t browse it, and there are risks like leaks or someone trying to get the data later. I’m not waiting until the final version to write that.

---

**How will you define “relevant” chunks in the search?**

For the **first version**, “relevant” just means **the chunks that match the question the best with simple word matching**:

- I split the doc into **paragraph-sized** pieces.  
- When they ask a question, I compare it to each chunk (like which chunks share the most words with the question).  
- I grab the **top few** (maybe 3–5) and send only those to the AI, plus tell it to stick to those parts and say “not in the doc” if it can’t answer.

Later I might do fancier semantic search with embeddings, but for v1 it’s basically **keyword overlap**, not AI magic guessing what’s relevant.

---

---
