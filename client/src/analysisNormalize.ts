import type { Analysis, SectionExplained } from "./types";

function isSection(x: unknown): x is SectionExplained {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.formal_title === "string" &&
    typeof o.simple_heading === "string" &&
    typeof o.explanation === "string"
  );
}

/** Coerces API / stored JSON into a safe Analysis shape (handles older saved runs). */
export function normalizeAnalysis(raw: unknown): Analysis {
  if (!raw || typeof raw !== "object") {
    return {
      plain_summary: "",
      sections: [],
      risks: [],
      open_questions: [],
    };
  }
  const o = raw as Record<string, unknown>;
  const sectionsRaw = o.sections;
  const sections = Array.isArray(sectionsRaw)
    ? sectionsRaw.filter(isSection)
    : [];

  const keyRaw = o.key_points;
  const risksRaw = o.risks;
  const risks = Array.isArray(risksRaw) ? risksRaw : [];

  const oqRaw = o.open_questions;
  const open_questions = Array.isArray(oqRaw) ? oqRaw.map(String) : [];

  const out: Analysis = {
    plain_summary:
      typeof o.plain_summary === "string" ? o.plain_summary : "",
    sections,
    risks: risks as Analysis["risks"],
    open_questions,
  };
  if (Array.isArray(keyRaw) && keyRaw.length > 0) {
    out.key_points = keyRaw as Analysis["key_points"];
  }
  return out;
}
