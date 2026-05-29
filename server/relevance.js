/**
 * v1 relevance: lexical overlap between question tokens and chunk text.
 * (Embeddings can replace this later for paraphrased questions.)
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

/** @param {string} s */
function tokenize(s) {
  const tokens = s.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  return tokens.filter((t) => !STOP.has(t));
}

/**
 * @param {string} question
 * @param {string} chunkText
 */
export function scoreChunk(question, chunkText) {
  const qTokens = tokenize(question);
  if (qTokens.length === 0) return 0;
  const qSet = new Set(qTokens);
  const cTokens = tokenize(chunkText);
  let score = 0;
  for (const t of cTokens) {
    if (qSet.has(t)) score += 1;
  }
  return score;
}

/**
 * @param {{ id: string; index: number; text: string }[]} chunks
 * @param {string} question
 * @param {number} [k]
 */
export function topKChunks(chunks, question, k = 4) {
  if (!chunks?.length) return [];
  const ranked = chunks
    .map((c) => ({ ...c, score: scoreChunk(question, c.text) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const withHits = ranked.filter((c) => c.score > 0).slice(0, k);
  if (withHits.length > 0) return withHits;

  return ranked.slice(0, Math.min(k, ranked.length));
}
