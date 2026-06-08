# Review Plan — Unfold

**Author:** Siddharth Mundra, A17520533  
**Live app:** https://unifold-ai.onrender.com

## 1. Finish from proposal

| Item | Status | Where |
|------|--------|--------|
| History search/filter | **Done** | `client/src/App.tsx` |
| Firebase ID token verification | **Done** | `server/verifyAuth.js`, `client/src/api/authFetch.ts` |
| Multi-document comparison | **Done** | `POST /api/compare`, `client/src/components/CompareView.tsx` |
| Streaming chat | **Not doing** | Out of scope for final |

---

## 2. Review day feedback (in class)

This is what reviewers actually raised when I demoed Unfold on review day:

| Source | Feedback | My plan | Done? |
|--------|----------|---------|-------|
| Reviewers | **Rate limiting** — public URL + LLM calls; worried someone could spam analyze/chat and burn API quota; limits should be real per-user on the server | Move daily caps off in-memory storage; enforce per signed-in user on analyze, chat, and compare; keep sign-in required for LLM routes | Yes — `server/rateLimit.js` (Firestore `users/{uid}/usage/`), limits on all three API routes |
| Reviewers | **Data privacy** — what happens to uploaded contract text, who can see saved runs, whether users have control | Keep browser-side PDF extraction; document what we store (analysis, chunks, chat in Firestore); per-user Firestore rules | Yes — `firestore.rules`, History Remove, upload note + About/README copy |
| Class (whole-room demo) | **Encryption** — while demoing in front of the whole class, someone asked whether uploaded contracts are encrypted at rest and in transit beyond HTTPS/Firebase defaults | Acknowledge the gap honestly in docs; for final scope, rely on Firebase/Google infra + per-user Firestore rules rather than building client-side or field-level encryption | No — out of scope for final; see [REGRETS.md](REGRETS.md) |

No other themes came up repeatedly in the live review (no one asked for streaming, UI polish, etc.). Encryption was a one-off question during the full-class demo, not a recurring reviewer theme.

---

## 3. Staff email feedback (post–review day)


| Staff email | My response / fix | Done? |
|-------------|-------------------|-------|
| Server trusted `userId` from the request body instead of verifying Firebase tokens | Verify ID tokens on `/api/analyze`, `/api/chat`, `/api/compare`; production requires Bearer auth | Yes — `server/verifyAuth.js` |
| Quotas were in-memory and reset on deploy | Persist daily usage per user in Firestore | Yes — `server/rateLimit.js` |
| Lexical retrieval misses plain-language questions | Synonym map in `server/relevance.js` (e.g. "fired" → termination) | Yes |
| Multi-document comparison was still planned but missing | Compare page + `/api/compare` | Yes — `CompareView.tsx` |
| Users shouldn't get confident answers when retrieval finds nothing | Show retrieval warnings in chat (and compare) when overlap is weak or zero | Yes — `DocumentChat.tsx`, `server/relevance.js` |

---

---

## 5. Out of scope for final

- Streaming (SSE) chat
- Embedding-based semantic search (current search was performing decent)
- Stronger encryption for uploaded contract text (raised during the whole-class demo; see REGRETS.md)
