import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.join(__dirname, "..", ".env");
dotenv.config({ path: rootEnv });
dotenv.config({ path: path.join(__dirname, ".env") });

/** Trim and strip wrapping quotes (handles `KEY = "value"` style .env lines). */
function envStr(name) {
  const v = process.env[name];
  if (v == null || v === "") return undefined;
  return v.trim().replace(/^["']|["']$/g, "");
}

/** OpenAI client expects base URL ending in /v1 */
function openAIBaseURL(raw) {
  if (!raw) return undefined;
  let u = raw.trim().replace(/\/+$/, "");
  if (!u.endsWith("/v1")) u = `${u}/v1`;
  return u;
}

import cors from "cors";
import express from "express";
import OpenAI from "openai";
import { chunkText } from "./chunkText.js";
import { topKChunks } from "./relevance.js";
import { checkRateLimit, parseLimit } from "./rateLimit.js";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "12mb" }));

const baseURL = openAIBaseURL(envStr("TRITON_BASE_URL") ?? "");
const apiKey = envStr("TRITON_API_KEY");
const model = envStr("TRITON_MODEL") ?? "gpt-oss-120b";

const client =
  baseURL && apiKey
    ? new OpenAI({ baseURL, apiKey })
    : null;

const SYSTEM_PROMPT = `You help non-lawyers understand contracts, terms of service, leases, and policies.

Return ONLY valid JSON (no markdown fences). Write in clear, everyday English. Avoid legalese in explanations.

Required shape:
{
  "plain_summary": "3-6 sentences: the big picture — who the agreement is between, what it is for, and what the reader should pay attention to.",
  "sections": [
    {
      "formal_title": "The subsection title or clause label as it appears or can be inferred (e.g. 'Section 4.2 Termination' or 'Payment Terms').",
      "simple_heading": "2-8 word friendly label for navigation (e.g. 'When the contract ends').",
      "explanation": "Several sentences in very simple language: what this part says, what each side must do or gets, and any important numbers or dates.",
      "why_it_matters": "Optional 1-3 sentences on practical impact for the reader.",
      "watch_out": "Optional one sentence if something is unusually strict, one-sided, or easy to miss.",
      "evidence_quote": "Optional short verbatim quote from the excerpt supporting this block."
    }
  ],
  "risks": [
    { "label": "short label", "severity": "low|medium|high", "plain": "why it could matter", "evidence_quote": "optional" }
  ],
  "open_questions": ["things still unclear, missing, or that depend on context outside the excerpt"]
}

Rules for "sections":
- Split the excerpt into logical blocks: numbered sections, titled clauses, or clear topic shifts.
- Aim for at least 4 sections for a long excerpt, and up to about 25 for very long text — every distinct subsection should get its own object.
- If the excerpt is short, use fewer sections (minimum 1).
- Do not skip subsections: small numbered items (4.1, 4.2) should each get an entry when they carry distinct meaning.
- If the text is not a legal document, still return helpful sections describing what it is.

If something is missing from the excerpt, say so in open_questions.`;

const CHAT_SYSTEM_PROMPT = `You answer questions about a legal or policy document using ONLY the excerpts provided.

Return ONLY valid JSON (no markdown fences):
{
  "answer": "Plain-English answer in several sentences. Do not give legal advice — explain what the excerpts say, not what the user should do.",
  "quotes": ["optional short verbatim quotes from the excerpts that support the answer"],
  "unclear": false
}

Set "unclear" to true when the excerpts do not contain enough information to answer confidently.
Do not invent clauses, dates, or obligations that are not supported by the excerpts.
If the user asks for legal advice (e.g. whether to sign), decline and remind them this tool is informational only.`;

const ANALYZE_DAILY_LIMIT = parseLimit("ANALYZE_DAILY_LIMIT", 25);
const CHAT_DAILY_LIMIT = parseLimit("CHAT_DAILY_LIMIT", 80);

function requireUserId(req, res) {
  const uid =
    typeof req.body?.userId === "string"
      ? req.body.userId.trim()
      : typeof req.headers["x-user-id"] === "string"
        ? req.headers["x-user-id"].trim()
        : "";
  if (!uid) {
    res.status(400).json({ error: "Missing userId (sign in required)" });
    return null;
  }
  return uid;
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    llmConfigured: Boolean(client),
    model: client ? model : null,
  });
});

app.post("/api/chunk", (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) {
    return res.status(400).json({ error: "Missing text" });
  }
  if (text.length > 120_000) {
    return res.status(400).json({ error: "Text too long for this prototype" });
  }
  const chunks = chunkText(text);
  return res.json({ chunks, count: chunks.length });
});

app.post("/api/analyze", async (req, res) => {
  const uid = requireUserId(req, res);
  if (!uid) return;

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) {
    return res.status(400).json({ error: "Missing text" });
  }
  if (text.length > 120_000) {
    return res.status(400).json({ error: "Text too long for this prototype" });
  }

  const limited = checkRateLimit(uid, "analyze", ANALYZE_DAILY_LIMIT);
  if (!limited.ok) {
    return res.status(429).json({ error: limited.error, limit: limited.limit });
  }

  if (!client) {
    return res.status(503).json({
      error: "LLM not configured",
      hint:
        "Set TRITON_BASE_URL, TRITON_API_KEY, and TRITON_MODEL in .env (project root or server/)",
    });
  }

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Document excerpt:\n\n${text}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        error: "Model returned non-JSON",
        raw,
      });
    }

    const chunks = chunkText(text);
    return res.json({
      result: parsed,
      model,
      chunks,
      usage: { analyzeRemaining: limited.remaining },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(502).json({ error: message });
  }
});

app.post("/api/chat", async (req, res) => {
  const uid = requireUserId(req, res);
  if (!uid) return;

  const question =
    typeof req.body?.question === "string" ? req.body.question.trim() : "";
  if (!question) {
    return res.status(400).json({ error: "Missing question" });
  }
  if (question.length > 4_000) {
    return res.status(400).json({ error: "Question too long" });
  }

  const chunks = Array.isArray(req.body?.chunks) ? req.body.chunks : [];
  const validChunks = chunks
    .filter(
      (c) =>
        c &&
        typeof c.text === "string" &&
        c.text.trim() &&
        typeof c.id === "string",
    )
    .map((c, i) => ({
      id: String(c.id),
      index: typeof c.index === "number" ? c.index : i,
      text: c.text.trim(),
    }));

  if (validChunks.length === 0) {
    return res.status(400).json({
      error: "Missing document chunks — re-analyze the document first",
    });
  }

  const limited = checkRateLimit(uid, "chat", CHAT_DAILY_LIMIT);
  if (!limited.ok) {
    return res.status(429).json({ error: limited.error, limit: limited.limit });
  }

  if (!client) {
    return res.status(503).json({
      error: "LLM not configured",
      hint:
        "Set TRITON_BASE_URL, TRITON_API_KEY, and TRITON_MODEL in .env (project root or server/)",
    });
  }

  const topK = Math.min(
    8,
    Math.max(1, Number(req.body?.topK) || 4),
  );
  const selected = topKChunks(validChunks, question, topK);
  const history = Array.isArray(req.body?.history)
    ? req.body.history
        .filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string",
        )
        .slice(-6)
    : [];

  const excerptBlock = selected
    .map(
      (c, i) =>
        `[Excerpt ${i + 1} | chunk ${c.id} | score ${c.score ?? 0}]\n${c.text}`,
    )
    .join("\n\n---\n\n");

  const historyBlock =
    history.length > 0
      ? history
          .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
          .join("\n")
      : "(none)";

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Recent conversation:\n${historyBlock}\n\nUser question:\n${question}\n\nDocument excerpts (answer ONLY from these):\n\n${excerptBlock}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        error: "Model returned non-JSON",
        raw,
      });
    }

    const answer =
      typeof parsed.answer === "string"
        ? parsed.answer.trim()
        : "I could not generate an answer.";
    const quotes = Array.isArray(parsed.quotes)
      ? parsed.quotes.filter((q) => typeof q === "string" && q.trim())
      : [];
    const unclear = Boolean(parsed.unclear);

    return res.json({
      answer,
      quotes,
      unclear,
      model,
      chunksUsed: selected.map(({ id, index, score }) => ({ id, index, score })),
      usage: { chatRemaining: limited.remaining },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(502).json({ error: message });
  }
});

const clientDist = path.join(__dirname, "..", "client", "dist");
const isProduction =
  process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

if (isProduction) {
  app.use(express.static(clientDist, { index: false }));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const port = Number(process.env.PORT ?? 8787);
app.listen(port, "0.0.0.0", () => {
  console.log(
    isProduction
      ? `Unfold listening on port ${port} (API + static client)`
      : `API http://localhost:${port}`,
  );
});
