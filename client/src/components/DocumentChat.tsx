import { useCallback, useEffect, useRef, useState } from "react";
import { authFetch } from "../api/authFetch";
import type { ChatMessage, DocumentChunk } from "../types";

type Props = {
  chunks: DocumentChunk[];
  messages: ChatMessage[];
  userId: string;
  disabled?: boolean;
  onMessagesChange: (messages: ChatMessage[]) => void;
};

export function DocumentChat({
  chunks,
  messages,
  userId,
  disabled,
  onMessagesChange,
}: Props) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  const send = useCallback(async () => {
    const question = input.trim();
    if (!question || busy || disabled || chunks.length === 0) return;

    setBusy(true);
    setError(null);
    setInput("");

    const userMsg: ChatMessage = {
      role: "user",
      content: question,
      createdAt: new Date().toISOString(),
    };
    const pending = [...messages, userMsg];
    onMessagesChange(pending);

    try {
      const res = await authFetch("/api/chat", {
        method: "POST",
        body: {
          userId,
          question,
          chunks,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Chat request failed");
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: typeof data.answer === "string" ? data.answer : "",
        quotes: Array.isArray(data.quotes) ? data.quotes : undefined,
        unclear: Boolean(data.unclear),
        retrievalWarning:
          typeof data.retrievalWarning === "string"
            ? data.retrievalWarning
            : undefined,
        retrievalFailed: Boolean(data.retrievalFailed),
        createdAt: new Date().toISOString(),
      };
      onMessagesChange([...pending, assistantMsg]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      onMessagesChange(messages);
      setInput(question);
    } finally {
      setBusy(false);
    }
  }, [
    input,
    busy,
    disabled,
    chunks,
    messages,
    userId,
    onMessagesChange,
  ]);

  if (chunks.length === 0) {
    return (
      <section className="doc-chat doc-chat--empty" aria-labelledby="doc-chat-title">
        <h3 id="doc-chat-title" className="doc-chat-title">
          Ask about this document
        </h3>
        <p className="muted small">
          Chat is available after analysis. Re-upload this file if you opened an
          older saved run without stored chunks.
        </p>
      </section>
    );
  }

  return (
    <section className="doc-chat" aria-labelledby="doc-chat-title">
      <header className="doc-chat-head">
        <h3 id="doc-chat-title" className="doc-chat-title">
          Ask about this document
        </h3>
        <p className="muted small doc-chat-hint">
          Answers use keyword-matched excerpts from your upload only — not legal
          advice.
        </p>
      </header>

      <div
        ref={listRef}
        className="doc-chat-thread"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <p className="muted small doc-chat-placeholder">
            Example: “What is the security deposit?” or “When does this lease
            end?”
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={`${m.createdAt}-${i}`}
              className={`doc-chat-bubble doc-chat-bubble--${m.role}`}
            >
              <span className="doc-chat-role">
                {m.role === "user" ? "You" : "Unfold"}
              </span>
              <p>{m.content}</p>
              {m.role === "assistant" && m.retrievalWarning ? (
                <p
                  className={`doc-chat-retrieval ${m.retrievalFailed ? "doc-chat-retrieval--failed" : ""}`}
                  role="status"
                >
                  {m.retrievalWarning}
                </p>
              ) : null}
              {m.role === "assistant" && m.unclear ? (
                <p className="doc-chat-unclear" role="status">
                  The document excerpts may not fully support this answer.
                </p>
              ) : null}
              {m.role === "assistant" && m.quotes?.length ? (
                <ul className="doc-chat-quotes">
                  {m.quotes.map((q, j) => (
                    <li key={j}>
                      <blockquote>“{q}”</blockquote>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))
        )}
        {busy ? (
          <p className="muted small doc-chat-thinking">Thinking…</p>
        ) : null}
      </div>

      {error ? (
        <p className="error doc-chat-error" role="alert">
          {error}
        </p>
      ) : null}

      <form
        className="doc-chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label className="sr-only" htmlFor="doc-chat-input">
          Your question
        </label>
        <textarea
          id="doc-chat-input"
          className="doc-chat-input"
          rows={2}
          placeholder="Ask a question about this document…"
          value={input}
          disabled={busy || disabled}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          type="submit"
          className="primary doc-chat-send"
          disabled={busy || disabled || !input.trim()}
        >
          Send
        </button>
      </form>
    </section>
  );
}
