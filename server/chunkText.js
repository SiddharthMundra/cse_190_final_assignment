/**
 * Split document text into paragraph-sized chunks for retrieval.
 * Boundaries: blank lines; oversized paragraphs are split on sentences or hard cap.
 */

const DEFAULT_MAX_CHARS = 1200;
const DEFAULT_MIN_CHARS = 60;

function splitLongParagraph(text, maxChars) {
  const parts = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let buf = "";
  for (const sentence of sentences) {
    const next = buf ? `${buf} ${sentence}` : sentence;
    if (next.length <= maxChars) {
      buf = next;
      continue;
    }
    if (buf) parts.push(buf.trim());
    if (sentence.length <= maxChars) {
      buf = sentence;
      continue;
    }
    for (let i = 0; i < sentence.length; i += maxChars) {
      parts.push(sentence.slice(i, i + maxChars).trim());
    }
    buf = "";
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

/**
 * @param {string} text
 * @param {{ maxChars?: number; minChars?: number }} [opts]
 * @returns {{ id: string; index: number; text: string }[]}
 */
export function chunkText(text, opts = {}) {
  const maxChars = opts.maxChars ?? DEFAULT_MAX_CHARS;
  const minChars = opts.minChars ?? DEFAULT_MIN_CHARS;
  const raw = typeof text === "string" ? text.replace(/\r\n/g, "\n").trim() : "";
  if (!raw) return [];

  const paragraphs = raw
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const merged = [];
  let buf = "";

  const flush = () => {
    const t = buf.trim();
    if (t.length >= minChars || merged.length === 0) {
      merged.push(t);
    } else if (t && merged.length > 0) {
      merged[merged.length - 1] = `${merged[merged.length - 1]}\n\n${t}`.trim();
    }
    buf = "";
  };

  for (const p of paragraphs) {
    if (p.length > maxChars) {
      if (buf) flush();
      for (const part of splitLongParagraph(p, maxChars)) {
        merged.push(part);
      }
      continue;
    }
    const next = buf ? `${buf}\n\n${p}` : p;
    if (next.length > maxChars) {
      flush();
      buf = p;
    } else {
      buf = next;
    }
  }
  if (buf) flush();

  return merged
    .filter((t) => t.length > 0)
    .map((t, index) => ({
      id: `chunk-${index}`,
      index,
      text: t,
    }));
}
