import type { Analysis } from "../types";

function slugId(s: string, i: number): string {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "section"}-${i}`;
}

type Props = {
  analysis: Analysis;
  fileLabel?: string | null;
};

export function ResultsView({ analysis, fileLabel }: Props) {
  const sections = analysis.sections?.length
    ? analysis.sections
    : null;
  const legacyPoints = !sections?.length ? analysis.key_points ?? [] : [];

  return (
    <div id="results" className="results-section results-readable">
      <div className="results-hero">
        <h2 className="results-hero-title">Plain-language summary</h2>
        {fileLabel ? (
          <p className="results-file-label">
            <span className="results-file-key">Document</span> {fileLabel}
          </p>
        ) : null}
        <p className="results-summary-lead">
          {analysis.plain_summary ||
            "Here is a section-by-section walkthrough of your document in plain language."}
        </p>
      </div>

      {sections && sections.length > 0 ? (
        <>
          <nav className="results-toc" aria-label="Jump to section">
            <span className="results-toc-label">Jump to</span>
            <ol className="results-toc-list">
              {sections.map((s, i) => (
                <li key={i}>
                  <a href={`#${slugId(s.simple_heading, i)}`}>
                    {s.simple_heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="section-explainer-stack">
            {sections.map((s, i) => (
              <article
                key={i}
                id={slugId(s.simple_heading, i)}
                className="section-explainer-card"
              >
                <header className="section-explainer-head">
                  <p className="section-explainer-formal">{s.formal_title}</p>
                  <h3 className="section-explainer-simple">{s.simple_heading}</h3>
                </header>
                <div className="section-explainer-body">
                  <p className="section-explainer-main">{s.explanation}</p>
                  {s.why_it_matters ? (
                    <div className="section-explainer-aside section-explainer-aside--matters">
                      <span className="aside-tag">Why it matters</span>
                      <p>{s.why_it_matters}</p>
                    </div>
                  ) : null}
                  {s.watch_out ? (
                    <div className="section-explainer-aside section-explainer-aside--watch">
                      <span className="aside-tag">Watch out</span>
                      <p>{s.watch_out}</p>
                    </div>
                  ) : null}
                  {s.evidence_quote ? (
                    <blockquote className="section-explainer-quote">
                      <span className="quote-mark" aria-hidden="true">
                        “
                      </span>
                      {s.evidence_quote}
                    </blockquote>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : legacyPoints.length > 0 ? (
        <div className="panel panel--legacy">
          <h3 className="panel-title">Key points</h3>
          <ul className="points">
            {legacyPoints.map((k, i) => (
              <li key={i}>
                <strong>{k.title}</strong> — {k.plain}
                {k.evidence_quote ? (
                  <div className="muted quote">“{k.evidence_quote}”</div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted empty-hint" style={{ marginTop: "1rem" }}>
          No subsection breakdown was returned (this can happen with very short
          excerpts). Try a longer document or run the analysis again.
        </p>
      )}

      <div className="results-secondary-grid">
        <div className="panel panel--risk">
          <h3 className="panel-title">Risk highlights</h3>
          {analysis.risks?.length ? (
            <ul className="risk-list">
              {analysis.risks.map((r, i) => (
                <li key={i} className="risk-item">
                  <div className="risk-item-top">
                    <strong className="risk-item-label">{r.label}</strong>
                    <span
                      className={`risk-pill risk-${r.severity === "high" || r.severity === "medium" || r.severity === "low" ? r.severity : "low"}`}
                    >
                      {r.severity}
                    </span>
                  </div>
                  <p className="risk-item-plain">{r.plain}</p>
                  {r.evidence_quote ? (
                    <p className="risk-item-quote muted">“{r.evidence_quote}”</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted empty-hint">None flagged for this document.</p>
          )}
        </div>

        {analysis.open_questions?.length ? (
          <div className="panel panel--questions">
            <h3 className="panel-title">Questions to clarify</h3>
            <ul className="questions-list">
              {analysis.open_questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
