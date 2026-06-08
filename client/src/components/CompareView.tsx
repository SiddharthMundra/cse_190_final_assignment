import { useCallback, useMemo, useState } from "react";
import { authFetch, parseApiJson } from "../api/authFetch";
import type { CompareResult, SavedRun } from "../types";

type Props = {
  runs: SavedRun[];
  userId: string;
};

export function CompareView({ runs, userId }: Props) {
  const eligible = useMemo(
    () => runs.filter((r) => (r.chunks?.length ?? 0) > 0),
    [runs],
  );

  const [docAId, setDocAId] = useState("");
  const [docBId, setDocBId] = useState("");
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  const runA = eligible.find((r) => r.id === docAId);
  const runB = eligible.find((r) => r.id === docBId);

  const compare = useCallback(async () => {
    if (!runA || !runB || busy) return;
    if (runA.id === runB.id) {
      setError("Pick two different saved documents.");
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const res = await authFetch("/api/compare", {
        method: "POST",
        body: {
          userId,
          docA: { label: runA.fileName, chunks: runA.chunks },
          docB: { label: runB.fileName, chunks: runB.chunks },
          focus: focus.trim() || undefined,
        },
      });
      const data = await parseApiJson(res);
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Compare request failed",
        );
      }

      setResult({
        summary: typeof data.summary === "string" ? data.summary : "",
        alignments: Array.isArray(data.alignments) ? data.alignments : [],
        conflicts: Array.isArray(data.conflicts) ? data.conflicts : [],
        gaps: Array.isArray(data.gaps) ? data.gaps : [],
        docA: typeof data.docA === "string" ? data.docA : runA.fileName,
        docB: typeof data.docB === "string" ? data.docB : runB.fileName,
        retrievalWarnings: Array.isArray(data.retrievalWarnings)
          ? data.retrievalWarnings
          : undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [runA, runB, busy, userId, focus]);

  if (eligible.length < 2) {
    return (
      <div className="compare-empty muted">
        <p>
          Compare two saved documents side by side (e.g. a lease and a pet
          policy). You need at least two saved runs with stored chunks — upload
          and analyze documents from Homescreen first.
        </p>
      </div>
    );
  }

  return (
    <div className="compare-panel">
      <p className="compare-intro muted">
        Select two saved documents. Unfold retrieves relevant excerpts from each
        and highlights alignments, conflicts, and gaps. Not legal advice.
      </p>

      <div className="compare-form">
        <label className="compare-field">
          <span className="compare-label">Document A</span>
          <select
            className="compare-select"
            value={docAId}
            onChange={(e) => setDocAId(e.target.value)}
          >
            <option value="">Choose a saved document…</option>
            {eligible.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fileName}
              </option>
            ))}
          </select>
        </label>

        <label className="compare-field">
          <span className="compare-label">Document B</span>
          <select
            className="compare-select"
            value={docBId}
            onChange={(e) => setDocBId(e.target.value)}
          >
            <option value="">Choose a saved document…</option>
            {eligible.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fileName}
              </option>
            ))}
          </select>
        </label>

        <label className="compare-field compare-field--wide">
          <span className="compare-label">Focus (optional)</span>
          <input
            type="text"
            className="compare-input"
            placeholder="e.g. pets, termination, fees…"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          />
        </label>

        <button
          type="button"
          className="primary compare-run"
          disabled={busy || !docAId || !docBId || docAId === docBId}
          onClick={() => void compare()}
        >
          {busy ? "Comparing…" : "Compare documents"}
        </button>
      </div>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="compare-results">
          {result.retrievalWarnings?.length ? (
            <div className="compare-retrieval-warn" role="status">
              {result.retrievalWarnings.map((w, i) => (
                <p key={i}>{w.message}</p>
              ))}
            </div>
          ) : null}

          {result.summary ? (
            <section className="compare-section">
              <h3>Summary</h3>
              <p>{result.summary}</p>
            </section>
          ) : null}

          {result.alignments.length > 0 ? (
            <section className="compare-section">
              <h3>Where they align</h3>
              <ul className="compare-list">
                {result.alignments.map((a, i) => (
                  <li key={i} className="compare-card">
                    <h4>{a.topic}</h4>
                    <p>
                      <strong>{result.docA}:</strong> {a.doc_a_says}
                    </p>
                    <p>
                      <strong>{result.docB}:</strong> {a.doc_b_says}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {result.conflicts.length > 0 ? (
            <section className="compare-section">
              <h3>Conflicts & tension</h3>
              <ul className="compare-list">
                {result.conflicts.map((c, i) => (
                  <li key={i} className="compare-card compare-card--warn">
                    <h4>{c.topic}</h4>
                    <p>{c.plain}</p>
                    {c.doc_a_quote ? (
                      <blockquote>“{c.doc_a_quote}” — {result.docA}</blockquote>
                    ) : null}
                    {c.doc_b_quote ? (
                      <blockquote>“{c.doc_b_quote}” — {result.docB}</blockquote>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {result.gaps.length > 0 ? (
            <section className="compare-section">
              <h3>Coverage gaps</h3>
              <ul className="compare-list">
                {result.gaps.map((g, i) => (
                  <li key={i} className="compare-card">
                    <h4>{g.topic}</h4>
                    <p>
                      Only in{" "}
                      <strong>
                        {g.only_in === "a" ? result.docA : result.docB}
                      </strong>
                      : {g.plain}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
