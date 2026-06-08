/**
 * v1 relevance: lexical overlap between question tokens and chunk text,
 * expanded via a plain-language ↔ legal-term synonym map.
 */

const STOP = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "had",
  "her",
  "was",
  "one",
  "our",
  "out",
  "day",
  "get",
  "has",
  "him",
  "his",
  "how",
  "its",
  "may",
  "new",
  "now",
  "old",
  "see",
  "two",
  "way",
  "who",
  "did",
  "does",
  "what",
  "when",
  "where",
  "which",
  "with",
  "this",
  "that",
  "from",
  "have",
  "will",
  "your",
  "about",
  "into",
  "than",
  "them",
  "then",
  "there",
  "their",
  "would",
  "could",
  "should",
]);

/** Plain-language term → related legal/formal terms (bidirectional at lookup time). */
export const LEGAL_SYNONYMS = {
  fired: ["termination", "terminated", "dismissal", "dismissed", "discharge"],
  quit: ["resignation", "resign", "voluntary", "notice"],
  deposit: ["security", "escrow", "bond", "collateral"],
  rent: ["lease", "payment", "monthly", "rental", "landlord"],
  evict: ["eviction", "dispossess", "remove", "vacate"],
  sue: ["litigation", "lawsuit", "damages", "claim", "arbitration"],
  cancel: ["termination", "rescission", "void", "revoke"],
  fee: ["charge", "cost", "penalty", "fine", "assessment"],
  pet: ["animal", "pets", "domestic"],
  repair: ["maintenance", "fix", "upkeep", "habitability"],
  sublet: ["sublease", "assign", "assignment", "transfer"],
  renew: ["renewal", "extension", "extend"],
  breach: ["violation", "default", "noncompliance"],
  indemnify: ["indemnification", "hold", "harmless", "liability"],
  confidential: ["confidentiality", "nda", "non-disclosure", "proprietary"],
  overtime: ["hours", "compensation", "wage", "payroll"],
};

/** @param {string} s */
function tokenize(s) {
  const tokens = s.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  return tokens.filter((t) => !STOP.has(t));
}

/**
 * Expand question tokens with synonym equivalents for matching against legal text.
 * @param {string[]} tokens
 */
export function expandQueryTokens(tokens) {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const direct = LEGAL_SYNONYMS[token];
    if (direct) {
      for (const term of direct) expanded.add(term);
    }
    for (const [key, values] of Object.entries(LEGAL_SYNONYMS)) {
      if (values.includes(token)) {
        expanded.add(key);
        for (const v of values) expanded.add(v);
      }
    }
  }
  return expanded;
}

/**
 * @param {string} question
 * @param {string} chunkText
 */
export function scoreChunk(question, chunkText) {
  const qTokens = tokenize(question);
  if (qTokens.length === 0) return 0;
  const qSet = expandQueryTokens(qTokens);
  const cTokens = tokenize(chunkText);
  let score = 0;
  for (const t of cTokens) {
    if (qSet.has(t)) score += 1;
  }
  return score;
}

/**
 * @param {{ id: string; index: number; text: string; score?: number }[]} ranked
 * @param {{ id: string; index: number; text: string; score?: number }[]} selected
 * @param {string} question
 */
function assessRetrieval(ranked, selected, question) {
  const maxScore = ranked[0]?.score ?? 0;
  const qTokenCount = tokenize(question).length;
  const weakThreshold = Math.max(2, Math.ceil(qTokenCount * 0.35));

  if (maxScore === 0) {
    return {
      status: "failed",
      maxScore: 0,
      matchedChunks: 0,
      message:
        "No matching excerpts found for your question (even after synonym expansion). The answer may miss relevant sections — try rephrasing with words from the document.",
    };
  }

  const matchedInTop = selected.filter((c) => (c.score ?? 0) > 0).length;
  if (maxScore < weakThreshold || matchedInTop === 0) {
    return {
      status: "weak",
      maxScore,
      matchedChunks: matchedInTop,
      message:
        "Weak overlap between your question and the retrieved excerpts. The answer may not reflect the most relevant parts of the document — try more specific terms.",
    };
  }

  return {
    status: "ok",
    maxScore,
    matchedChunks: matchedInTop,
    message: null,
  };
}

/**
 * @param {{ id: string; index: number; text: string }[]} chunks
 * @param {string} question
 * @param {number} [k]
 */
export function topKChunks(chunks, question, k = 4) {
  if (!chunks?.length) {
    return {
      chunks: [],
      retrieval: {
        status: "failed",
        maxScore: 0,
        matchedChunks: 0,
        message: "No document chunks available for retrieval.",
      },
    };
  }

  const ranked = chunks
    .map((c) => ({ ...c, score: scoreChunk(question, c.text) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const withHits = ranked.filter((c) => c.score > 0).slice(0, k);
  const selected =
    withHits.length > 0
      ? withHits
      : ranked.slice(0, Math.min(k, ranked.length));

  const retrieval = assessRetrieval(ranked, selected, question);
  return { chunks: selected, retrieval };
}
