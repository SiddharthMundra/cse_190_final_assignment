import { jsPDF } from "jspdf";
import type { Analysis, ChatMessage } from "./types";

const MARGIN = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = PAGE_H - 12;
const BODY_BOTTOM = FOOTER_Y - 8;

const COLORS = {
  ink: [10, 10, 10] as [number, number, number],
  muted: [107, 107, 107] as [number, number, number],
  faint: [163, 163, 163] as [number, number, number],
  accent: [101, 163, 13] as [number, number, number],
  accentSoft: [247, 254, 231] as [number, number, number],
  line: [236, 236, 236] as [number, number, number],
  rose: [185, 28, 28] as [number, number, number],
  amber: [161, 98, 7] as [number, number, number],
  riskHigh: [254, 242, 242] as [number, number, number],
  riskMed: [254, 252, 232] as [number, number, number],
  riskLow: [247, 254, 231] as [number, number, number],
};

const DISCLAIMER =
  "This report is for informational purposes only and does not constitute legal advice. Consult a qualified attorney for legal decisions.";

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

function riskColors(severity: string): {
  fill: [number, number, number];
  text: [number, number, number];
} {
  const s = severity.toLowerCase();
  if (s === "high") return { fill: COLORS.riskHigh, text: COLORS.rose };
  if (s === "medium") return { fill: COLORS.riskMed, text: COLORS.amber };
  return { fill: COLORS.riskLow, text: COLORS.accent };
}

class PdfBuilder {
  doc: jsPDF;
  y = MARGIN;

  constructor() {
    this.doc = new jsPDF({ unit: "mm", format: "a4" });
  }

  private newPage() {
    this.doc.addPage();
    this.y = MARGIN;
  }

  ensureSpace(needed: number) {
    if (this.y + needed > BODY_BOTTOM) this.newPage();
  }

  private drawRule(gap = 4) {
    this.ensureSpace(gap + 1);
    this.doc.setDrawColor(...COLORS.line);
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += gap;
  }

  heading(text: string, size = 14) {
    this.ensureSpace(size * 0.5 + 4);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(size);
    this.doc.setTextColor(...COLORS.ink);
    this.doc.text(text, MARGIN, this.y);
    this.y += size * 0.42 + 3;
  }

  label(text: string) {
    this.ensureSpace(6);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.faint);
    this.doc.text(text.toUpperCase(), MARGIN, this.y);
    this.y += 5;
  }

  paragraph(text: string, opts?: { indent?: number; size?: number; color?: [number, number, number] }) {
    const indent = opts?.indent ?? 0;
    const size = opts?.size ?? 10;
    const color = opts?.color ?? COLORS.ink;
    const lines = this.doc.splitTextToSize(text, CONTENT_W - indent);
    const lineHeight = size * 0.45;
    this.ensureSpace(lines.length * lineHeight + 2);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
    this.doc.text(lines, MARGIN + indent, this.y);
    this.y += lines.length * lineHeight + 3;
  }

  bulletList(items: string[]) {
    for (const item of items) {
      const prefix = "•  ";
      const lines = this.doc.splitTextToSize(prefix + item, CONTENT_W - 4);
      const lineHeight = 4.5;
      this.ensureSpace(lines.length * lineHeight + 1);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(10);
      this.doc.setTextColor(...COLORS.ink);
      this.doc.text(lines, MARGIN + 2, this.y);
      this.y += lines.length * lineHeight + 1.5;
    }
    this.y += 2;
  }

  quote(text: string) {
    const lines = this.doc.splitTextToSize(`"${text}"`, CONTENT_W - 8);
    const blockH = lines.length * 4.2 + 6;
    this.ensureSpace(blockH);
    this.doc.setFillColor(...COLORS.accentSoft);
    this.doc.setDrawColor(...COLORS.line);
    this.doc.roundedRect(MARGIN, this.y - 2, CONTENT_W, blockH, 1.5, 1.5, "FD");
    this.doc.setFont("helvetica", "italic");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.muted);
    this.doc.text(lines, MARGIN + 4, this.y + 3);
    this.y += blockH + 3;
  }

  riskCard(label: string, severity: string, plain: string, evidence?: string) {
    const plainLines = this.doc.splitTextToSize(plain, CONTENT_W - 12);
    const quoteLines = evidence
      ? this.doc.splitTextToSize(`"${evidence}"`, CONTENT_W - 12)
      : [];
    const blockH = 10 + plainLines.length * 4.2 + (quoteLines.length ? quoteLines.length * 3.8 + 4 : 0);
    this.ensureSpace(blockH + 2);

    const { fill, text: sevColor } = riskColors(severity);
    this.doc.setFillColor(...fill);
    this.doc.setDrawColor(...COLORS.line);
    this.doc.roundedRect(MARGIN, this.y, CONTENT_W, blockH, 2, 2, "FD");

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.ink);
    this.doc.text(label, MARGIN + 4, this.y + 6);

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(7);
    this.doc.setTextColor(...sevColor);
    const sevW = this.doc.getTextWidth(severity.toUpperCase()) + 4;
    this.doc.setFillColor(255, 255, 255);
    this.doc.roundedRect(PAGE_W - MARGIN - sevW - 4, this.y + 2.5, sevW + 2, 5, 1, 1, "F");
    this.doc.text(severity.toUpperCase(), PAGE_W - MARGIN - sevW - 3, this.y + 6);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...COLORS.ink);
    this.doc.text(plainLines, MARGIN + 4, this.y + 11);

    let endY = this.y + 11 + plainLines.length * 4.2;
    if (quoteLines.length) {
      this.doc.setFont("helvetica", "italic");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(...COLORS.muted);
      this.doc.text(quoteLines, MARGIN + 4, endY);
      endY += quoteLines.length * 3.8;
    }
    this.y += blockH + 4;
  }

  chatBubble(role: "user" | "assistant", content: string) {
    const lines = this.doc.splitTextToSize(content, CONTENT_W - 10);
    const blockH = lines.length * 4.3 + 8;
    this.ensureSpace(blockH + 2);

    const isUser = role === "user";
    this.doc.setFillColor(...(isUser ? COLORS.accentSoft : [250, 250, 250]));
    this.doc.setDrawColor(...COLORS.line);
    this.doc.roundedRect(MARGIN, this.y, CONTENT_W, blockH, 1.5, 1.5, "FD");

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(7);
    this.doc.setTextColor(...COLORS.faint);
    this.doc.text(isUser ? "YOU" : "UNFOLD", MARGIN + 3, this.y + 4.5);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...COLORS.ink);
    this.doc.text(lines, MARGIN + 3, this.y + 9);
    this.y += blockH + 3;
  }

  addFooters() {
    const total = this.doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      this.doc.setPage(i);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(7);
      this.doc.setTextColor(...COLORS.faint);
      const footerLines = this.doc.splitTextToSize(DISCLAIMER, CONTENT_W - 24);
      this.doc.text(footerLines, MARGIN, FOOTER_Y - 2);
      this.doc.text(`Page ${i} of ${total}`, PAGE_W - MARGIN, FOOTER_Y + 2, {
        align: "right",
      });
    }
  }

  build(input: PdfExportInput): jsPDF {
    const { fileName, analysis, model, messages, savedAt } = input;

    // ── Cover header ──
    this.doc.setFillColor(...COLORS.ink);
    this.doc.rect(0, 0, PAGE_W, 42, "F");
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(22);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text("Unfold", MARGIN, 18);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    this.doc.setTextColor(220, 220, 220);
    this.doc.text("Plain-language document report", MARGIN, 26);
    this.doc.setFontSize(9);
    this.doc.text(formatDate(savedAt), MARGIN, 34);
    this.y = 52;

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(12);
    this.doc.setTextColor(...COLORS.ink);
    const titleLines = this.doc.splitTextToSize(fileName, CONTENT_W);
    this.doc.text(titleLines, MARGIN, this.y);
    this.y += titleLines.length * 5 + 2;

    if (model) {
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.muted);
      this.doc.text(`Analysis model: ${model}`, MARGIN, this.y);
      this.y += 6;
    }

    this.drawRule(6);

    // ── Summary ──
    this.label("Executive summary");
    this.paragraph(
      analysis.plain_summary ||
        "A plain-language overview of your document is below.",
      { size: 11 },
    );
    this.drawRule(8);

    // ── Sections ──
    const sections = analysis.sections?.length
      ? analysis.sections
      : null;
    const legacy = !sections?.length ? analysis.key_points ?? [] : [];

    if (sections?.length) {
      this.heading("Section-by-section guide", 13);
      this.y += 2;

      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        this.ensureSpace(20);
        this.doc.setFillColor(...COLORS.accentSoft);
        this.doc.rect(MARGIN, this.y - 1, 3, 8, "F");
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(11);
        this.doc.setTextColor(...COLORS.ink);
        this.doc.text(`${i + 1}. ${s.simple_heading}`, MARGIN + 5, this.y + 5);
        this.y += 9;

        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(8.5);
        this.doc.setTextColor(...COLORS.muted);
        this.doc.text(s.formal_title, MARGIN + 5, this.y);
        this.y += 5;

        this.paragraph(s.explanation, { indent: 2 });
        if (s.why_it_matters) {
          this.label("Why it matters");
          this.paragraph(s.why_it_matters, { indent: 2, size: 9.5 });
        }
        if (s.watch_out) {
          this.label("Watch out");
          this.paragraph(s.watch_out, {
            indent: 2,
            size: 9.5,
            color: COLORS.amber,
          });
        }
        if (s.evidence_quote) {
          this.quote(s.evidence_quote);
        }
        if (i < sections.length - 1) this.drawRule(4);
      }
    } else if (legacy.length > 0) {
      this.heading("Key points", 13);
      this.bulletList(legacy.map((k) => `${k.title} — ${k.plain}`));
    }

    // ── Risks ──
    if (analysis.risks?.length) {
      this.drawRule(8);
      this.heading("Risk highlights", 13);
      this.y += 2;
      for (const r of analysis.risks) {
        this.riskCard(r.label, r.severity, r.plain, r.evidence_quote);
      }
    }

    // ── Open questions ──
    if (analysis.open_questions?.length) {
      this.drawRule(8);
      this.heading("Questions to clarify", 13);
      this.bulletList(analysis.open_questions);
    }

    // ── Chat transcript ──
    if (messages?.length) {
      this.drawRule(8);
      this.heading("Document Q&A", 13);
      this.paragraph(
        "Questions you asked about this document and Unfold’s grounded answers.",
        { size: 9, color: COLORS.muted },
      );
      for (const m of messages) {
        this.chatBubble(m.role, m.content);
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
