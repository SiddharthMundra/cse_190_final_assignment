import { jsPDF } from "jspdf";
import type { Analysis, ChatMessage, SectionExplained } from "./types";

/* ── Page geometry (A4, mm) ── */
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 20;
const MARGIN_TOP = 22;
const MARGIN_BOTTOM = 24;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const BODY_MAX_Y = PAGE_H - MARGIN_BOTTOM;
const HEADER_H = 10;

/* ── Palette (matches Unfold UI) ── */
const C = {
  ink: [10, 10, 10] as const,
  inkSoft: [31, 31, 31] as const,
  muted: [107, 107, 107] as const,
  faint: [163, 163, 163] as const,
  white: [255, 255, 255] as const,
  accent: [101, 163, 13] as const,
  accentSoft: [247, 254, 231] as const,
  accentLine: [217, 249, 157] as const,
  surface: [250, 250, 250] as const,
  line: [228, 228, 228] as const,
  rose: [185, 28, 28] as const,
  roseSoft: [254, 242, 242] as const,
  amber: [161, 98, 7] as const,
  amberSoft: [254, 252, 232] as const,
};

const DISCLAIMER =
  "This report is informational only and does not constitute legal advice. Consult a qualified attorney for legal decisions.";

const LH = {
  xs: 3.6,
  sm: 4.2,
  md: 4.8,
  lg: 5.4,
};

export type PdfExportInput = {
  fileName: string;
  analysis: Analysis;
  model?: string | null;
  messages?: ChatMessage[];
  savedAt?: string;
};

function safePdfName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[^\w.\-]+/g, "_");
  return `unfold-report-${base.slice(0, 60)}.pdf`;
}

function formatDate(iso?: string): string {
  try {
    return new Date(iso ?? Date.now()).toLocaleString(undefined, {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return new Date().toLocaleString();
  }
}

function riskStyle(severity: string) {
  const s = severity.toLowerCase();
  if (s === "high") return { bg: C.roseSoft, fg: C.rose, label: "HIGH" };
  if (s === "medium") return { bg: C.amberSoft, fg: C.amber, label: "MEDIUM" };
  return { bg: C.accentSoft, fg: C.accent, label: "LOW" };
}

class PdfBuilder {
  private doc: jsPDF;
  private y = MARGIN_TOP;
  private pageNum = 1;
  private totalPages = 1;
  private docTitle = "";

  constructor() {
    this.doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  }

  /* ── Layout helpers ── */

  private setFont(
    style: "normal" | "bold" | "italic" | "bolditalic",
    size: number,
    color: readonly [number, number, number] = C.ink,
  ) {
    this.doc.setFont("helvetica", style);
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
  }

  private wrappedLines(
    text: string,
    width: number,
    size: number,
    style: "normal" | "bold" | "italic" = "normal",
  ): string[] {
    this.doc.setFont("helvetica", style);
    this.doc.setFontSize(size);
    return this.doc.splitTextToSize(text, width);
  }

  private lineCount(text: string, width: number, size: number, lh: number): number {
    return this.wrappedLines(text, width, size).length * lh;
  }

  private newPage(showHeader = true) {
    this.doc.addPage();
    this.pageNum += 1;
    this.y = MARGIN_TOP;
    if (showHeader) this.drawRunningHeader();
  }

  private ensureSpace(needed: number, showHeaderOnNew = true) {
    if (this.y + needed > BODY_MAX_Y) {
      this.newPage(showHeaderOnNew);
    }
  }

  private advance(h: number) {
    this.y += h;
  }

  private drawRunningHeader() {
    this.setFont("bold", 7, C.faint);
    this.doc.text("UNFOLD", MARGIN_X, MARGIN_TOP - 4);
    this.setFont("normal", 7, C.faint);
    const title =
      this.docTitle.length > 52
        ? `${this.docTitle.slice(0, 49)}…`
        : this.docTitle;
    this.doc.text(title, MARGIN_X + 18, MARGIN_TOP - 4);
    this.doc.setDrawColor(...C.line);
    this.doc.setLineWidth(0.15);
    this.doc.line(MARGIN_X, MARGIN_TOP - 1, PAGE_W - MARGIN_X, MARGIN_TOP - 1);
    this.y = MARGIN_TOP + HEADER_H - 4;
  }

  private drawHorizontalRule(gapBefore = 6, gapAfter = 6) {
    this.ensureSpace(gapBefore + 1 + gapAfter);
    this.advance(gapBefore);
    this.doc.setDrawColor(...C.line);
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN_X, this.y, PAGE_W - MARGIN_X, this.y);
    this.advance(gapAfter);
  }

  /* ── Drawing primitives ── */

  private sectionTitle(text: string) {
    this.ensureSpace(14);
    this.setFont("bold", 15, C.ink);
    this.doc.text(text, MARGIN_X, this.y);
    this.advance(10);
  }

  private overline(text: string) {
    this.ensureSpace(8);
    this.setFont("bold", 7.5, C.faint);
    this.doc.text(text.toUpperCase(), MARGIN_X, this.y);
    this.advance(5);
  }

  private bodyText(
    text: string,
    opts?: {
      size?: number;
      color?: readonly [number, number, number];
      width?: number;
      indent?: number;
      lh?: number;
      gapAfter?: number;
    },
  ) {
    const size = opts?.size ?? 10;
    const color = opts?.color ?? C.inkSoft;
    const width = opts?.width ?? CONTENT_W - (opts?.indent ?? 0);
    const lh = opts?.lh ?? LH.md;
    const indent = opts?.indent ?? 0;
    const lines = this.wrappedLines(text, width, size);
    this.ensureSpace(lines.length * lh + (opts?.gapAfter ?? 4));
    this.setFont("normal", size, color);
    this.doc.text(lines, MARGIN_X + indent, this.y);
    this.advance(lines.length * lh + (opts?.gapAfter ?? 4));
  }

  private calloutBox(
    label: string,
    body: string,
    opts?: {
      bg?: readonly [number, number, number];
      border?: readonly [number, number, number];
      textColor?: readonly [number, number, number];
    },
  ) {
    const padX = 5;
    const padY = 5;
    const labelH = 5;
    const bodyLines = this.wrappedLines(body, CONTENT_W - padX * 2 - 2, 9.5);
    const boxH = padY * 2 + labelH + bodyLines.length * LH.sm;
    this.ensureSpace(boxH + 4);

    const x = MARGIN_X;
    const y0 = this.y;
    this.doc.setFillColor(...(opts?.bg ?? C.accentSoft));
    this.doc.setDrawColor(...(opts?.border ?? C.accentLine));
    this.doc.setLineWidth(0.25);
    this.doc.roundedRect(x, y0, CONTENT_W, boxH, 2, 2, "FD");
    this.doc.setFillColor(...(opts?.border ?? C.accent));
    this.doc.rect(x, y0 + 1.5, 1.2, boxH - 3, "F");

    this.setFont("bold", 7, opts?.textColor ?? C.accent);
    this.doc.text(label.toUpperCase(), x + padX + 1, y0 + padY + 3);
    this.setFont("normal", 9.5, C.inkSoft);
    this.doc.text(bodyLines, x + padX + 1, y0 + padY + labelH + 3);
    this.y = y0 + boxH + 5;
  }

  private quoteBlock(text: string) {
    const pad = 5;
    const lines = this.wrappedLines(`"${text}"`, CONTENT_W - pad * 2 - 4, 9, "italic");
    const boxH = lines.length * LH.sm + pad * 2;
    this.ensureSpace(boxH + 4);

    const x = MARGIN_X;
    const y0 = this.y;
    this.doc.setFillColor(...C.surface);
    this.doc.setDrawColor(...C.line);
    this.doc.roundedRect(x, y0, CONTENT_W, boxH, 1.5, 1.5, "FD");
    this.doc.setFillColor(...C.accent);
    this.doc.rect(x + 1, y0 + 1.5, 0.8, boxH - 3, "F");
    this.setFont("italic", 9, C.muted);
    this.doc.text(lines, x + pad + 2, y0 + pad + 3);
    this.y = y0 + boxH + 4;
  }

  private sectionCard(index: number, section: SectionExplained) {
    const pad = 6;
    const titleLines = this.wrappedLines(
      `${index}. ${section.simple_heading}`,
      CONTENT_W - pad * 2 - 4,
      11,
      "bold",
    );
    const formalLines = this.wrappedLines(
      section.formal_title,
      CONTENT_W - pad * 2 - 4,
      8.5,
    );
    const explLines = this.wrappedLines(
      section.explanation,
      CONTENT_W - pad * 2 - 4,
      10,
    );

    let extraH = 0;
    if (section.why_it_matters) {
      extraH += 5 + this.lineCount(section.why_it_matters, CONTENT_W - pad * 2 - 8, 9, LH.sm);
    }
    if (section.watch_out) {
      extraH += 5 + this.lineCount(section.watch_out, CONTENT_W - pad * 2 - 8, 9, LH.sm);
    }
    if (section.evidence_quote) {
      extraH += 8 + this.lineCount(section.evidence_quote, CONTENT_W - pad * 2 - 8, 9, LH.sm) + 8;
    }

    const cardH =
      pad * 2 +
      titleLines.length * LH.md +
      2 +
      formalLines.length * LH.xs +
      4 +
      explLines.length * LH.md +
      extraH;

    this.ensureSpace(cardH + 6);

    const x = MARGIN_X;
    const y0 = this.y;
    this.doc.setFillColor(...C.white);
    this.doc.setDrawColor(...C.line);
    this.doc.setLineWidth(0.2);
    this.doc.roundedRect(x, y0, CONTENT_W, cardH, 2.5, 2.5, "FD");
    this.doc.setFillColor(...C.accent);
    this.doc.roundedRect(x, y0, 3.5, cardH, 2.5, 0, "F");

    let cy = y0 + pad + 4;
    this.setFont("bold", 11, C.ink);
    this.doc.text(titleLines, x + pad + 2, cy);
    cy += titleLines.length * LH.md + 2;

    this.setFont("normal", 8.5, C.muted);
    this.doc.text(formalLines, x + pad + 2, cy);
    cy += formalLines.length * LH.xs + 4;

    this.setFont("normal", 10, C.inkSoft);
    this.doc.text(explLines, x + pad + 2, cy);
    cy += explLines.length * LH.md + 2;

    if (section.why_it_matters) {
      this.setFont("bold", 7.5, C.accent);
      this.doc.text("WHY IT MATTERS", x + pad + 2, cy);
      cy += 4.5;
      const wLines = this.wrappedLines(section.why_it_matters, CONTENT_W - pad * 2 - 6, 9);
      this.setFont("normal", 9, C.inkSoft);
      this.doc.text(wLines, x + pad + 4, cy);
      cy += wLines.length * LH.sm + 3;
    }

    if (section.watch_out) {
      this.setFont("bold", 7.5, C.amber);
      this.doc.text("WATCH OUT", x + pad + 2, cy);
      cy += 4.5;
      const wLines = this.wrappedLines(section.watch_out, CONTENT_W - pad * 2 - 6, 9);
      this.setFont("normal", 9, C.amber);
      this.doc.text(wLines, x + pad + 4, cy);
      cy += wLines.length * LH.sm + 3;
    }

    if (section.evidence_quote) {
      cy += 2;
      const qLines = this.wrappedLines(
        `"${section.evidence_quote}"`,
        CONTENT_W - pad * 2 - 8,
        8.5,
        "italic",
      );
      const qH = qLines.length * LH.sm + 6;
      this.doc.setFillColor(...C.surface);
      this.doc.roundedRect(x + pad + 2, cy - 2, CONTENT_W - pad * 2 - 4, qH, 1, 1, "F");
      this.setFont("italic", 8.5, C.muted);
      this.doc.text(qLines, x + pad + 5, cy + 3);
    }

    this.y = y0 + cardH + 6;
  }

  private riskCard(label: string, severity: string, plain: string, evidence?: string) {
    const style = riskStyle(severity);
    const pad = 5;
    const labelLines = this.wrappedLines(label, CONTENT_W - pad * 2 - 28, 10, "bold");
    const plainLines = this.wrappedLines(plain, CONTENT_W - pad * 2 - 4, 9.5);
    const quoteLines = evidence
      ? this.wrappedLines(`"${evidence}"`, CONTENT_W - pad * 2 - 6, 8.5, "italic")
      : [];

    const boxH =
      pad * 2 +
      Math.max(labelLines.length * LH.sm, 6) +
      4 +
      plainLines.length * LH.sm +
      (quoteLines.length ? quoteLines.length * LH.xs + 6 : 0);

    this.ensureSpace(boxH + 5);

    const x = MARGIN_X;
    const y0 = this.y;
    this.doc.setFillColor(...style.bg);
    this.doc.setDrawColor(...C.line);
    this.doc.roundedRect(x, y0, CONTENT_W, boxH, 2, 2, "FD");

    this.setFont("bold", 10, C.ink);
    this.doc.text(labelLines, x + pad, y0 + pad + 4);

    const badge = style.label;
    this.setFont("bold", 6.5, style.fg);
    const badgeW = this.doc.getTextWidth(badge) + 6;
    this.doc.setFillColor(...C.white);
    this.doc.roundedRect(PAGE_W - MARGIN_X - pad - badgeW, y0 + pad, badgeW, 5.5, 1.2, 1.2, "F");
    this.doc.text(badge, PAGE_W - MARGIN_X - pad - badgeW + 3, y0 + pad + 3.8);

    let cy = y0 + pad + Math.max(labelLines.length * LH.sm, 6) + 5;
    this.setFont("normal", 9.5, C.inkSoft);
    this.doc.text(plainLines, x + pad, cy);
    cy += plainLines.length * LH.sm;

    if (quoteLines.length) {
      cy += 2;
      this.setFont("italic", 8.5, C.muted);
      this.doc.text(quoteLines, x + pad + 2, cy);
    }

    this.y = y0 + boxH + 5;
  }

  private bulletList(items: string[]) {
    for (const item of items) {
      const bullet = "•";
      const lines = this.wrappedLines(item, CONTENT_W - 8, 10);
      this.ensureSpace(lines.length * LH.md + 2);
      this.setFont("bold", 10, C.accent);
      this.doc.text(bullet, MARGIN_X + 1, this.y);
      this.setFont("normal", 10, C.inkSoft);
      this.doc.text(lines, MARGIN_X + 6, this.y);
      this.advance(lines.length * LH.md + 2);
    }
    this.advance(2);
  }

  private chatEntry(role: "user" | "assistant", content: string, quotes?: string[]) {
    const isUser = role === "user";
    const pad = 5;
    const roleLabel = isUser ? "You asked" : "Unfold answered";
    const lines = this.wrappedLines(content, CONTENT_W - pad * 2 - 4, 9.5);
    let quoteH = 0;
    if (quotes?.length) {
      for (const q of quotes) {
        quoteH += this.lineCount(q, CONTENT_W - pad * 2 - 10, 8.5, LH.xs) + 2;
      }
      quoteH += 4;
    }
    const boxH = pad * 2 + 5 + lines.length * LH.sm + quoteH;
    this.ensureSpace(boxH + 4);

    const x = MARGIN_X;
    const y0 = this.y;
    this.doc.setFillColor(...(isUser ? C.accentSoft : C.surface));
    this.doc.setDrawColor(...(isUser ? C.accentLine : C.line));
    this.doc.roundedRect(x, y0, CONTENT_W, boxH, 2, 2, "FD");

    this.setFont("bold", 7, isUser ? C.accent : C.faint);
    this.doc.text(roleLabel.toUpperCase(), x + pad, y0 + pad + 3);

    this.setFont("normal", 9.5, C.inkSoft);
    this.doc.text(lines, x + pad, y0 + pad + 8);

    let cy = y0 + pad + 8 + lines.length * LH.sm + 2;
    if (quotes?.length) {
      for (const q of quotes) {
        const qLines = this.wrappedLines(`"${q}"`, CONTENT_W - pad * 2 - 8, 8.5, "italic");
        this.setFont("italic", 8.5, C.muted);
        this.doc.text(qLines, x + pad + 3, cy);
        cy += qLines.length * LH.xs + 2;
      }
    }

    this.y = y0 + boxH + 4;
  }

  private tableOfContents(sections: SectionExplained[]) {
    this.overline("Contents");
    for (let i = 0; i < sections.length; i++) {
      const entry = `${i + 1}.  ${sections[i].simple_heading}`;
      const truncated =
        entry.length > 68 ? `${entry.slice(0, 65)}…` : entry;
      this.ensureSpace(LH.sm + 1);
      this.setFont("normal", 9.5, C.inkSoft);
      this.doc.text(truncated, MARGIN_X + 2, this.y);
      this.setFont("normal", 9.5, C.faint);
      const dots = ".".repeat(
        Math.max(2, 62 - truncated.length),
      );
      this.doc.text(dots, MARGIN_X + 2 + this.doc.getTextWidth(truncated) + 1, this.y);
      this.advance(LH.sm + 1);
    }
    this.advance(4);
  }

  private coverPage(fileName: string, savedAt?: string, model?: string | null) {
    this.doc.setFillColor(...C.ink);
    this.doc.rect(0, 0, PAGE_W, PAGE_H, "F");

    this.doc.setFillColor(...C.accent);
    this.doc.rect(0, 0, PAGE_W, 3, "F");

    this.setFont("bold", 36, C.white);
    this.doc.text("Unfold", MARGIN_X, 52);

    this.setFont("normal", 12, C.faint);
    this.doc.text("Plain-language document report", MARGIN_X, 64);

    this.doc.setDrawColor(...[60, 60, 60]);
    this.doc.setLineWidth(0.3);
    this.doc.line(MARGIN_X, 74, PAGE_W - MARGIN_X, 74);

    this.setFont("bold", 14, C.white);
    const titleLines = this.wrappedLines(fileName, CONTENT_W, 14, "bold");
    this.doc.text(titleLines, MARGIN_X, 88);
    const titleH = titleLines.length * 7;

    this.setFont("normal", 9.5, C.faint);
    this.doc.text(`Generated ${formatDate(savedAt)}`, MARGIN_X, 88 + titleH + 8);
    if (model) {
      this.doc.text(`Model: ${model}`, MARGIN_X, 88 + titleH + 15);
    }

    const boxY = PAGE_H - 58;
    this.doc.setFillColor(30, 30, 30);
    this.doc.setDrawColor(...[60, 60, 60]);
    this.doc.roundedRect(MARGIN_X, boxY, CONTENT_W, 28, 2, 2, "FD");
    this.setFont("bold", 7.5, C.accent);
    this.doc.text("IMPORTANT", MARGIN_X + 5, boxY + 8);
    this.setFont("normal", 8.5, [200, 200, 200]);
    const discLines = this.wrappedLines(DISCLAIMER, CONTENT_W - 10, 8.5);
    this.doc.text(discLines, MARGIN_X + 5, boxY + 14);

    this.setFont("normal", 8, C.faint);
    this.doc.text("unfold.app · confidential reading aid", MARGIN_X, PAGE_H - 14);

    this.newPage(true);
  }

  private addFooters() {
    this.totalPages = this.doc.getNumberOfPages();
    for (let i = 2; i <= this.totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setDrawColor(...C.line);
      this.doc.setLineWidth(0.15);
      this.doc.line(MARGIN_X, PAGE_H - MARGIN_BOTTOM + 2, PAGE_W - MARGIN_X, PAGE_H - MARGIN_BOTTOM + 2);
      this.setFont("normal", 7, C.faint);
      this.doc.text(DISCLAIMER.slice(0, 90) + "…", MARGIN_X, PAGE_H - MARGIN_BOTTOM + 7);
      this.doc.text(
        `${i - 1} / ${this.totalPages - 1}`,
        PAGE_W - MARGIN_X,
        PAGE_H - MARGIN_BOTTOM + 7,
        { align: "right" },
      );
    }
  }

  build(input: PdfExportInput): jsPDF {
    const { fileName, analysis, model, messages, savedAt } = input;
    this.docTitle = fileName;

    this.coverPage(fileName, savedAt, model);

    const sections = analysis.sections?.length ? analysis.sections : null;
    const legacy = !sections?.length ? analysis.key_points ?? [] : [];

    /* Summary */
    this.sectionTitle("Executive summary");
    this.calloutBox(
      "Overview",
      analysis.plain_summary ||
        "A plain-language overview of your document is provided in the sections below.",
      { bg: C.accentSoft, border: C.accent, textColor: C.accent },
    );

    /* TOC */
    if (sections && sections.length > 1) {
      this.drawHorizontalRule(4, 6);
      this.tableOfContents(sections);
    }

    /* Sections */
    if (sections?.length) {
      this.drawHorizontalRule(4, 8);
      this.sectionTitle("Section-by-section guide");
      this.bodyText(
        "Each clause explained in everyday language, with practical notes where relevant.",
        { size: 9, color: C.muted, gapAfter: 6 },
      );
      for (let i = 0; i < sections.length; i++) {
        this.sectionCard(i + 1, sections[i]);
      }
    } else if (legacy.length > 0) {
      this.drawHorizontalRule(4, 8);
      this.sectionTitle("Key points");
      this.bulletList(legacy.map((k) => `${k.title} — ${k.plain}`));
    }

    /* Risks */
    if (analysis.risks?.length) {
      this.drawHorizontalRule(8, 8);
      this.sectionTitle("Risk highlights");
      this.bodyText("Items flagged as potentially important or unfavorable.", {
        size: 9,
        color: C.muted,
        gapAfter: 6,
      });
      for (const r of analysis.risks) {
        this.riskCard(r.label, r.severity, r.plain, r.evidence_quote);
      }
    }

    /* Open questions */
    if (analysis.open_questions?.length) {
      this.drawHorizontalRule(8, 8);
      this.sectionTitle("Questions to clarify");
      this.bulletList(analysis.open_questions);
    }

    /* Chat */
    if (messages?.length) {
      this.drawHorizontalRule(8, 8);
      this.sectionTitle("Document Q&A");
      this.bodyText(
        "Your questions and Unfold's answers, grounded in the uploaded document.",
        { size: 9, color: C.muted, gapAfter: 6 },
      );
      for (const m of messages) {
        this.chatEntry(m.role, m.content, m.quotes);
      }
    }

    this.addFooters();
    return this.doc;
  }
}

/** Build and trigger download of a formatted PDF report. */
export function downloadAnalysisPdf(input: PdfExportInput): void {
  const builder = new PdfBuilder();
  const doc = builder.build(input);
  doc.save(safePdfName(input.fileName));
}
