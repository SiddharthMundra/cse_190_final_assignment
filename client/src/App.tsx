import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./auth/AuthContext";
import { normalizeAnalysis } from "./analysisNormalize";
import { DocumentChat } from "./components/DocumentChat";
import { ResultsView } from "./components/ResultsView";
import { extractTextFromFile } from "./extractText";
import { downloadAnalysisPdf } from "./downloadPdf";
import { useRuns } from "./hooks/useRuns";
import { LoginPage } from "./pages/LoginPage";
import type { Analysis, ChatMessage, DocumentChunk, SavedRun } from "./types";

type Page = "home" | "history" | "about";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function App() {
  const { user, loading: authLoading, signOutUser } = useAuth();
  const { runs, runsLoading, saveRun, deleteRun } = useRuns();

  const [page, setPage] = useState<Page>("home");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState("");
  const progressTickerRef = useRef<number | null>(null);
  const [aboutModel, setAboutModel] = useState<{
    loading: boolean;
    configured: boolean;
    name: string | null;
  }>({ loading: true, configured: false, name: null });

  const clearProgressTicker = useCallback(() => {
    if (progressTickerRef.current != null) {
      window.clearInterval(progressTickerRef.current);
      progressTickerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearProgressTicker();
  }, [clearProgressTicker]);

  useEffect(() => {
    if (page !== "about") return;
    let cancelled = false;
    setAboutModel((s) => ({ ...s, loading: true }));
    fetch("/api/health")
      .then((r) => r.json())
      .then((data: { llmConfigured?: boolean; model?: string | null }) => {
        if (cancelled) return;
        setAboutModel({
          loading: false,
          configured: Boolean(data.llmConfigured),
          name: typeof data.model === "string" ? data.model : null,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setAboutModel({
            loading: false,
            configured: false,
            name: null,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const persistAndSelect = useCallback(
    async (run: SavedRun) => {
      await saveRun(run);
      setCurrentRunId(run.id);
      setAnalysis(run.analysis);
      setFileName(run.fileName);
      setModelUsed(run.model);
      setChunks(run.chunks ?? []);
      setChatMessages(run.messages ?? []);
    },
    [saveRun],
  );

  const patchCurrentRun = useCallback(
    async (patch: Partial<SavedRun>) => {
      if (!currentRunId || !analysis || !fileName) return;
      const existing = runs.find((r) => r.id === currentRunId);
      const run: SavedRun = {
        id: currentRunId,
        savedAt: existing?.savedAt ?? new Date().toISOString(),
        fileName,
        model: modelUsed,
        analysis,
        chunks: patch.chunks ?? chunks,
        messages: patch.messages ?? chatMessages,
        ...patch,
      };
      await saveRun(run);
    },
    [
      currentRunId,
      analysis,
      fileName,
      modelUsed,
      chunks,
      chatMessages,
      runs,
      saveRun,
    ],
  );

  const onChatMessagesChange = useCallback(
    (messages: ChatMessage[]) => {
      setChatMessages(messages);
      if (currentRunId) {
        void patchCurrentRun({ messages });
      }
    },
    [currentRunId, patchCurrentRun],
  );

  const runAnalyze = useCallback(
    async (file: File) => {
      if (busy) return;
      setBusy(true);
      setError(null);
      setAnalysis(null);
      setModelUsed(null);
      setCurrentRunId(null);
      setChunks([]);
      setChatMessages([]);
      setFileName(file.name);
      setUploadProgress(0);
      setUploadLabel("Reading file…");
      clearProgressTicker();

      try {
        const isPdf = file.name.toLowerCase().endsWith(".pdf");
        const text = await extractTextFromFile(file, (p) => {
          setUploadProgress(Math.round((p / 100) * 38));
          setUploadLabel(isPdf ? "Reading PDF pages…" : "Reading file…");
        });

        if (text.length < 40) {
          throw new Error(
            "Extracted very little text — try another PDF or a .txt sample.",
          );
        }

        setUploadProgress(40);
        setUploadLabel("Analyzing with model…");

        let simulated = 40;
        progressTickerRef.current = window.setInterval(() => {
          simulated = Math.min(92, simulated + 0.7 + Math.random() * 1.4);
          setUploadProgress(Math.floor(simulated));
        }, 170);

        if (!user?.uid) {
          throw new Error("Sign in required to analyze documents.");
        }

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, userId: user.uid }),
        });
        const data = await res.json();
        clearProgressTicker();

        if (!res.ok) {
          throw new Error(data.error ?? data.hint ?? "Request failed");
        }
        const result = normalizeAnalysis(data.result);
        const model = typeof data.model === "string" ? data.model : null;
        const docChunks: DocumentChunk[] = Array.isArray(data.chunks)
          ? data.chunks.filter(
              (c: DocumentChunk) =>
                c && typeof c.text === "string" && typeof c.id === "string",
            )
          : [];

        setUploadProgress(100);
        setUploadLabel("Done");
        await new Promise((r) => setTimeout(r, 420));

        const run: SavedRun = {
          id: crypto.randomUUID(),
          savedAt: new Date().toISOString(),
          fileName: file.name,
          model,
          analysis: result,
          chunks: docChunks,
          messages: [],
        };
        await persistAndSelect(run);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        clearProgressTicker();
        setBusy(false);
        setUploadProgress(0);
        setUploadLabel("");
      }
    },
    [busy, clearProgressTicker, persistAndSelect, user?.uid],
  );

  const onFiles = useCallback(
    (files: FileList | null) => {
      if (busy) return;
      const file = files?.[0];
      if (file) void runAnalyze(file);
    },
    [busy, runAnalyze],
  );

  const [drag, setDrag] = useState(false);

  const downloadCurrent = useCallback(() => {
    if (!analysis || !fileName) return;
    const existing = runs.find((r) => r.id === currentRunId);
    downloadAnalysisPdf({
      fileName,
      analysis,
      model: modelUsed,
      messages: chatMessages,
      savedAt: existing?.savedAt ?? new Date().toISOString(),
    });
  }, [analysis, fileName, modelUsed, currentRunId, chatMessages, runs]);

  const downloadRunPdf = useCallback((run: SavedRun) => {
    downloadAnalysisPdf({
      fileName: run.fileName,
      analysis: normalizeAnalysis(run.analysis),
      model: run.model,
      messages: run.messages,
      savedAt: run.savedAt,
    });
  }, []);

  const loadRun = useCallback((run: SavedRun) => {
    setError(null);
    setCurrentRunId(run.id);
    setFileName(run.fileName);
    setModelUsed(run.model);
    setAnalysis(normalizeAnalysis(run.analysis));
    setChunks(run.chunks ?? []);
    setChatMessages(run.messages ?? []);
  }, []);

  const openRunAndGoHome = useCallback(
    (run: SavedRun) => {
      loadRun(run);
      setPage("home");
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    },
    [loadRun],
  );

  const removeRun = useCallback(
    async (id: string) => {
      await deleteRun(id);
      if (currentRunId === id) {
        setAnalysis(null);
        setFileName(null);
        setModelUsed(null);
        setCurrentRunId(null);
        setChunks([]);
        setChatMessages([]);
      }
    },
    [currentRunId, deleteRun],
  );

  if (authLoading) {
    return (
      <div className="site">
        <div className="bg-blobs" aria-hidden="true" />
        <div className="auth-gate-loading">
          <span className="muted small">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="site">
        <div className="bg-blobs" aria-hidden="true" />
        <LoginPage />
      </div>
    );
  }

  return (
    <div className="site">
      <div className="bg-blobs" aria-hidden="true" />

      <header className="top-nav">
        <div className="top-nav-inner">
          <a
            className="brand"
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              setPage("home");
            }}
          >
            <span className="brand-name">Unfold</span>
          </a>
          <nav className="header-nav" aria-label="Main">
            <a
              href="#home"
              className={`header-link ${page === "home" ? "is-active" : ""}`}
              aria-current={page === "home" ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                setPage("home");
              }}
            >
              Homescreen
            </a>
            <a
              href="#history"
              className={`header-link ${page === "history" ? "is-active" : ""}`}
              aria-current={page === "history" ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                setPage("history");
              }}
            >
              History
            </a>
            <a
              href="#about"
              className={`header-link ${page === "about" ? "is-active" : ""}`}
              aria-current={page === "about" ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                setPage("about");
              }}
            >
              About
            </a>
          </nav>
          <div className="auth-cluster" aria-live="polite">
            <span className="auth-name" title={user.email ?? undefined}>
              {user.displayName ?? user.email ?? "Signed in"}
            </span>
            <button
              type="button"
              className="btn-ghost auth-signout"
              onClick={() => void signOutUser()}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {page === "home" && (
        <div className="view-shell view-shell--home">
          <section className="intro intro--center" aria-labelledby="intro-desc">
            <h1 className="sr-only">Unfold — plain language for contracts</h1>
            <p id="intro-desc" className="intro-text">
              <strong>Unfold</strong> reviews contracts and policies you upload
              and explains each section in clear, accessible language—covering
              fees, deadlines, and obligations—so you can read them with
              confidence.
            </p>
          </section>

          <div className="main-wrap">
            <div className="page main">
              <section id="upload" className="upload-section">
                <label
                  className={`dropzone ${drag ? "drag" : ""} ${busy ? "dropzone--busy" : ""}`}
                  aria-busy={busy}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!busy) setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    onFiles(e.dataTransfer.files);
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,.txt,application/pdf,text/plain"
                    style={{ display: "none" }}
                    disabled={busy}
                    onChange={(e) => onFiles(e.target.files)}
                  />
                  {!busy ? (
                    <>
                      <p className="dropzone-title">Drop a file here</p>
                      <p className="muted drop-hint">
                        or click to browse · PDF or .txt
                      </p>
                      <p className="privacy-upload-note">
                        Upload only documents you are allowed to share. Stored
                        under your account; you can delete saved runs from
                        History. Not legal advice.
                      </p>
                    </>
                  ) : (
                    <div className="upload-progress" aria-live="polite">
                      <p className="upload-progress-file">{fileName}</p>
                      <div
                        className="progress-track"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={uploadProgress}
                        aria-label={uploadLabel}
                      >
                        <div
                          className="progress-fill"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <div className="progress-row">
                        <span className="progress-pct">{uploadProgress}%</span>
                        <span className="progress-stage">{uploadLabel}</span>
                      </div>
                    </div>
                  )}
                </label>
              </section>

              {fileName && (
                <div className="meta-bar">
                  <p className="muted meta-line">
                    <span className="meta-label">File</span> {fileName}
                    {currentRunId ? (
                      <>
                        {" "}
                        · <span className="ok-badge">Saved to your account</span>
                      </>
                    ) : null}
                  </p>
                  {analysis ? (
                    <div className="toolbar">
                      <button
                        type="button"
                        className="primary"
                        onClick={downloadCurrent}
                      >
                        Download PDF
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}

              {analysis ? (
                <>
                  <ResultsView analysis={analysis} fileLabel={fileName} />
                  {user ? (
                    <DocumentChat
                      chunks={chunks}
                      messages={chatMessages}
                      userId={user.uid}
                      disabled={busy}
                      onMessagesChange={onChatMessagesChange}
                    />
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {page === "history" && (
        <div className="view-shell view-shell--history">
        <div className="main-wrap main-wrap--wide">
          <div className="page-header">
            <h2>History</h2>
            <p>
              Your saved analyses and document chats in your account. Open one to
              view results and continue chatting on Homescreen. Use Remove to
              delete a document and its stored chunks from your account.
            </p>
          </div>

          {runsLoading ? (
            <p className="muted small">Loading saved runs…</p>
          ) : null}

          <aside className="sidebar" aria-label="Saved analyses">
            <div className="sidebar-inner">
              <ul className="run-list">
                {runs.length === 0 ? (
                  <li className="muted small" style={{ padding: "0.5rem 0" }}>
                    No saved runs yet. Upload a document from Homescreen.
                  </li>
                ) : (
                  runs.map((run) => (
                    <li key={run.id} className="run-card">
                      <button
                        type="button"
                        className="run-select"
                        onClick={() => openRunAndGoHome(run)}
                      >
                        <span className="run-name">{run.fileName}</span>
                        <span className="run-date">{formatWhen(run.savedAt)}</span>
                      </button>
                      <div className="run-actions">
                        <button
                          type="button"
                          className="run-action-btn"
                          title="Download PDF report"
                          onClick={() => downloadRunPdf(run)}
                        >
                          PDF
                        </button>
                        <button
                          type="button"
                          className="run-action-btn run-action-btn--danger"
                          title="Remove from saved"
                          onClick={() => void removeRun(run.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </aside>
        </div>
        </div>
      )}

      {page === "about" && (
        <div className="view-shell view-shell--about">
        <div className="main-wrap">
          <div className="page-header">
            <h2>About</h2>
            <p>An overview of how Unfold works.</p>
          </div>
          <div className="about-prose">
            <p>
              Unfold reviews uploaded contracts and policies and explains each
              section in clear, accessible language. Document text is extracted
              within your browser and sent to the language model only for the
              purpose of generating an explanation.
            </p>
            <h3>Account</h3>
            <p>
              Access requires a Google sign-in. Each user’s saved analyses are
              stored privately under their account and are not visible to other
              users.
            </p>
            <h3>Model</h3>
            <p>
              {aboutModel.loading ? (
                <span className="about-model-status">Loading…</span>
              ) : aboutModel.configured && aboutModel.name ? (
                <>
                  Analyses are generated by the model{" "}
                  <strong className="about-model-name">{aboutModel.name}</strong>.
                </>
              ) : (
                <span className="about-model-status">
                  The language model is not currently configured on the server.
                </span>
              )}
            </p>
            <h3>Privacy &amp; your data</h3>
            <p>
              Extracted text, analysis, paragraph chunks, and chat messages are
              stored in Firestore under your Google account. Other users cannot
              access your runs (enforced by security rules). You can delete a
              saved document from History at any time.
            </p>
            <p>
              When you analyze or chat, excerpts are sent to the configured
              language model API for that request only. This is a course project
              demo — not a production legal platform. Project admins with Firebase
              console access could technically view stored data for debugging or
              grading; routine browsing of user contracts is not intended.
            </p>
            <h3>Document chat relevance</h3>
            <p>
              For each question, the server ranks stored paragraph chunks by
              keyword overlap with your question and sends only the top matches
              to the model, which must answer from those excerpts only.
            </p>
            <h3>Disclaimer</h3>
            <p>
              Unfold does not provide legal advice. For matters involving the
              signing, negotiation, or interpretation of legal documents, please
              consult a qualified attorney.
            </p>
          </div>
        </div>
        </div>
      )}

      <footer className="site-footer">
        <div className="footer-inner">
          <p>
            <strong>This service does not constitute legal advice.</strong>{" "}
            Unfold is intended as a reading aid only. Please consult a
            qualified attorney for legal matters.
          </p>
          <nav className="footer-links" aria-label="Site">
            <a
              href="#home"
              className="footer-link"
              onClick={(e) => {
                e.preventDefault();
                setPage("home");
              }}
            >
              Homescreen
            </a>
            <span className="footer-sep" aria-hidden="true">
              ·
            </span>
            <a
              href="#history"
              className="footer-link"
              onClick={(e) => {
                e.preventDefault();
                setPage("history");
              }}
            >
              History
            </a>
            <span className="footer-sep" aria-hidden="true">
              ·
            </span>
            <a
              href="#about"
              className="footer-link"
              onClick={(e) => {
                e.preventDefault();
                setPage("about");
              }}
            >
              About
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
