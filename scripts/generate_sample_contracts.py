#!/usr/bin/env python3
"""Generate detailed multi-page sample contract PDFs for Unfold demos."""

from __future__ import annotations

import subprocess
from pathlib import Path

from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "data" / "samples" / "source"
OUT_DIR = ROOT / "data" / "samples"

CONTRACTS = [
    {
        "source": "residential_lease.txt",
        "pdf": "sample_residential_lease.pdf",
        "title": "RESIDENTIAL LEASE AGREEMENT",
        "subtitle": "892 Valencia Street, Unit 4B · San Francisco, California · Effective April 1, 2026",
    },
    {
        "source": "pet_addendum.txt",
        "pdf": "sample_pet_addendum.pdf",
        "title": "PET ADDENDUM TO RESIDENTIAL LEASE",
        "subtitle": "Harborview Property Management LLC · Tenant: Alexandra Nguyen · Cat: Mochi",
    },
    {
        "source": "employment_agreement.txt",
        "pdf": "sample_employment_agreement.pdf",
        "title": "EMPLOYMENT AGREEMENT",
        "subtitle": "Northline Analytics, Inc. · Senior Software Engineer · Effective April 15, 2026",
    },
    {
        "source": "saas_terms.txt",
        "pdf": "sample_saas_terms.pdf",
        "title": "CLOUDFLOW SAAS TERMS OF SERVICE",
        "subtitle": "CloudFlow Labs, Inc. · Professional Plan · Version 3.2 · January 2026",
    },
]


def build_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "ContractTitle",
            parent=base["Heading1"],
            fontName="Times-Bold",
            fontSize=14,
            leading=18,
            alignment=TA_CENTER,
            spaceAfter=12,
        ),
        "subtitle": ParagraphStyle(
            "ContractSubtitle",
            parent=base["Normal"],
            fontName="Times-Roman",
            fontSize=10,
            leading=13,
            alignment=TA_CENTER,
            spaceAfter=16,
        ),
        "body": ParagraphStyle(
            "ContractBody",
            parent=base["Normal"],
            fontName="Times-Roman",
            fontSize=11,
            leading=14,
            alignment=TA_JUSTIFY,
            spaceAfter=8,
        ),
        "section": ParagraphStyle(
            "ContractSection",
            parent=base["Heading2"],
            fontName="Times-Bold",
            fontSize=11,
            leading=14,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "sig": ParagraphStyle(
            "ContractSig",
            parent=base["Normal"],
            fontName="Times-Roman",
            fontSize=11,
            leading=16,
            spaceBefore=4,
        ),
    }


def parse_blocks(text: str) -> list[tuple[str, str]]:
    """Return list of (kind, content) where kind is body|section|sig."""
    blocks: list[tuple[str, str]] = []
    current: list[str] = []
    mode = "body"

    def flush() -> None:
        nonlocal current, mode
        if not current:
            return
        blocks.append((mode, "\n".join(current).strip()))
        current = []

    for raw in text.splitlines():
        line = raw.rstrip()
        if line.startswith("## "):
            flush()
            mode = "section"
            current = [line[3:].strip()]
            flush()
            mode = "body"
            continue
        if line.strip() == "SIG:":
            flush()
            mode = "sig"
            continue
        if mode == "sig":
            if line.strip():
                current.append(line)
            continue
        if not line.strip():
            flush()
            continue
        current.append(line)

    flush()
    return blocks


def render_pdf(path: Path, title_text: str, subtitle_text: str, blocks: list[tuple[str, str]]) -> None:
    styles = build_styles()
    doc = SimpleDocTemplate(
        str(path),
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        title=title_text,
    )

    story = [
        Paragraph(title_text, styles["title"]),
        Paragraph(subtitle_text, styles["subtitle"]),
    ]

    for kind, content in blocks:
        if kind == "section":
            story.append(Paragraph(content, styles["section"]))
        elif kind == "sig":
            story.append(Spacer(1, 0.2 * inch))
            for sig_line in content.split("\n"):
                story.append(Paragraph(sig_line.replace(" ", "&nbsp;"), styles["sig"]))
        else:
            story.append(Paragraph(content, styles["body"]))

    doc.build(story)


def page_count(path: Path) -> int:
    try:
        from pypdf import PdfReader

        return len(PdfReader(str(path)).pages)
    except Exception:
        result = subprocess.run(
            ["pdfinfo", str(path)],
            capture_output=True,
            text=True,
            check=False,
        )
        for line in result.stdout.splitlines():
            if line.startswith("Pages:"):
                return int(line.split(":")[1].strip())
        return -1


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Writing PDFs to {OUT_DIR}\n")

    for spec in CONTRACTS:
        source = SOURCE_DIR / spec["source"]
        text = source.read_text(encoding="utf-8")
        blocks = parse_blocks(text)
        out_path = OUT_DIR / spec["pdf"]
        render_pdf(out_path, spec["title"], spec["subtitle"], blocks)
        pages = page_count(out_path)
        status = "ok" if pages >= 3 else "SHORT"
        print(f"  [{status}] {out_path.name}: {pages} page(s)")

    print(
        "\nTip: use sample_residential_lease.pdf + sample_pet_addendum.pdf for Compare "
        "(pet deposit $300 in lease vs $500 in addendum)."
    )


if __name__ == "__main__":
    main()
