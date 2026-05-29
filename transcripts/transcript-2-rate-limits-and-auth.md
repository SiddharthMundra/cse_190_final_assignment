# Transcript 2 — Rate limits before public deploy


**Me:** I'm putting this on Render with a public URL. I need per-user limits on analyze and chat so one account can't burn through my API quota overnight.

**Agent:** Added `server/rateLimit.js` with in-memory daily buckets keyed by `userId` and action (`analyze` vs `chat`). Resets use the calendar day in UTC. `POST /api/analyze` and `POST /api/chat` call `checkRateLimit` before calling Triton and return **429** when over cap. Defaults: 25 analyze / 80 chat per day, overridable with `ANALYZE_DAILY_LIMIT` and `CHAT_DAILY_LIMIT` in `.env`.

**Me:** Don't let random visitors hit the API without signing in.

**Agent:** Added `requireUserId` on both routes—reads `userId` from JSON body (client sends Firebase uid after Google sign-in). Missing id returns **400** with "sign in required". That way the LLM routes aren't open to anonymous POSTs even though we haven't added server-side Firebase token verification yet.

**Me:** Return something useful when they hit the limit.

**Agent:** 429 body includes a plain error string and the limit number. Successful responses include `usage.analyzeRemaining` or `usage.chatRemaining` so I could show it in the UI later. Documented the limits in README.

**Me:** What about huge pasted text?

**Agent:** Both routes already reject text over 120k chars and chat questions over 4k. Keeps payloads reasonable for the free Render instance.
