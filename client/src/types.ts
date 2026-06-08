/** One clause / subsection explained in plain language */
export type SectionExplained = {
  /** Heading or label as it appears in the document (or best guess). */
  formal_title: string;
  /** Very short friendly label for navigation (2–8 words). */
  simple_heading: string;
  /** Main explanation in simple, everyday language (several sentences). */
  explanation: string;
  /** Optional: why this block matters for the reader. */
  why_it_matters?: string;
  /** Optional: one-line “watch out” if something is sneaky or easy to miss. */
  watch_out?: string;
  evidence_quote?: string;
};

export type KeyPoint = {
  title: string;
  plain: string;
  evidence_quote?: string;
};

export type Risk = {
  label: string;
  severity: string;
  plain: string;
  evidence_quote?: string;
};

export type Analysis = {
  /** Short overview in plain language (2–5 sentences). */
  plain_summary: string;
  /** Clause-by-clause walkthrough — primary reading experience. */
  sections: SectionExplained[];
  /** Legacy analyses may still have bullet key points. */
  key_points?: KeyPoint[];
  risks: Risk[];
  open_questions: string[];
};

export type DocumentChunk = {
  id: string;
  index: number;
  text: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  quotes?: string[];
  unclear?: boolean;
  retrievalWarning?: string;
  retrievalFailed?: boolean;
  createdAt: string;
};

export type CompareAlignment = {
  topic: string;
  doc_a_says: string;
  doc_b_says: string;
};

export type CompareConflict = {
  topic: string;
  plain: string;
  doc_a_quote?: string;
  doc_b_quote?: string;
};

export type CompareGap = {
  topic: string;
  only_in: "a" | "b";
  plain: string;
};

export type CompareResult = {
  summary: string;
  alignments: CompareAlignment[];
  conflicts: CompareConflict[];
  gaps: CompareGap[];
  docA: string;
  docB: string;
  retrievalWarnings?: { status: string; message: string }[];
};

export type SavedRun = {
  id: string;
  savedAt: string;
  fileName: string;
  model: string | null;
  analysis: Analysis;
  /** Paragraph-sized segments for grounded Q&A */
  chunks?: DocumentChunk[];
  messages?: ChatMessage[];
};
