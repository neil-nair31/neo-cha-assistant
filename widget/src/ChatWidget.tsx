import { useEffect, useId, useMemo, useRef, useState } from "react";
import "./ChatWidget.css";
import { ASSIST_STARTERS, formatAssistReply } from "./formatReply";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
};

type PublicConfig = {
  welcome: string;
  consentText: string;
  privacyPolicyUrl: string;
  brand: { name: string; company: string; primary: string; accent: string };
};

function sessionId(): string {
  const key = "neo_assist_sid";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function normalizeApiBase(raw?: string): string {
  if (!raw) return import.meta.env.VITE_API_BASE ?? "";
  return raw.replace(/\/$/, "");
}

export type ChatWidgetProps = {
  /** Origin of Neo Assist API, e.g. "" (same-origin proxy) or "https://assist.example.com" */
  apiBase?: string;
};

export function ChatWidget({ apiBase }: ChatWidgetProps = {}) {
  const base = useMemo(() => normalizeApiBase(apiBase), [apiBase]);
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState<PublicConfig | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [showConsent, setShowConsent] = useState(false);
  const [consentText, setConsentText] = useState("");
  const [status, setStatus] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const sid = useMemo(() => sessionId(), []);

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.reply || err.error || "Request failed");
    }
    return res.json() as Promise<T>;
  }

  useEffect(() => {
    api<PublicConfig>("/api/assistant/config")
      .then((c) => {
        setCfg(c);
        setConsentText(c.consentText);
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: c.welcome,
          },
        ]);
      })
      .catch(() => {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hello — I'm Neo Assist. The API isn't reachable yet; start the server to chat.",
          },
        ]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(preset?: string) {
    const text = (preset ?? input).trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setStatus("");
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);

    try {
      const data = await api<{
        conversationId: string;
        reply: string;
        citations?: string[];
        needsConsent?: boolean;
        consent?: { text: string };
        offline?: boolean;
        escalate?: boolean;
      }>("/api/assistant/chat", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          sessionId: sid,
          conversationId,
          language: "en",
        }),
      });
      setConversationId(data.conversationId);
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          citations: data.citations,
        },
      ]);
      if (data.needsConsent) {
        setShowConsent(true);
        if (data.consent?.text) setConsentText(data.consent.text);
      }
      if (data.escalate) setStatus("Neo's team has been flagged for follow-up.");
      if (data.offline) setStatus("Running in fallback mode — leave details for a callback.");
      // analytics hook (no PII)
      window.dispatchEvent(
        new CustomEvent("neo-assist-analytics", {
          detail: { event: "question_asked", conversationId: data.conversationId },
        })
      );
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            e instanceof Error
              ? e.message
              : "I'm having trouble right now — email customercare@neologistics.org and our team will help.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function acceptConsent() {
    if (!conversationId) return;
    try {
      await api("/api/assistant/consent", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          sessionId: sid,
          accepted: true,
        }),
      });
      setShowConsent(false);
      setStatus("Thanks — Neo may contact you about this enquiry.");
      window.dispatchEvent(
        new CustomEvent("neo-assist-analytics", {
          detail: { event: "consent_granted", conversationId },
        })
      );
    } catch {
      setStatus("Could not save consent — please try again.");
    }
  }

  return (
    <div id="neo-assist-root">
      {open && (
        <section
          className="neo-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <header className="neo-header">
            <div>
              <h2 id={titleId}>{cfg?.brand.name ?? "Neo Assist"}</h2>
              <p>Licensed CHA · Cochin & Chennai · Neo Logistics</p>
            </div>
            <button
              type="button"
              className="neo-close"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </header>

          <div className="neo-messages" ref={listRef} aria-live="polite">
            {messages.map((m) => (
              <div key={m.id} className={`neo-bubble ${m.role}`}>
                <div className="neo-bubble-body">
                  {m.role === "assistant" ? formatAssistReply(m.content) : m.content}
                </div>
                {m.citations && m.citations.length > 0 && (
                  <div className="neo-citations">Sources: {m.citations.join(" · ")}</div>
                )}
              </div>
            ))}
            {messages.length <= 1 && !busy && (
              <div className="neo-starters" aria-label="Suggested questions">
                {ASSIST_STARTERS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="neo-starter"
                    onClick={() => void send(s.text)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            {busy && (
              <div className="neo-bubble assistant" aria-busy="true">
                Neo desk is drafting a reply…
              </div>
            )}
          </div>

          {showConsent && (
            <div className="neo-consent" role="region" aria-label="Consent notice">
              <div>{consentText}</div>
              <div style={{ marginTop: 6 }}>
                <a href={cfg?.privacyPolicyUrl} target="_blank" rel="noreferrer">
                  Privacy policy
                </a>
              </div>
              <button type="button" onClick={acceptConsent}>
                I agree — Neo may contact me
              </button>
            </div>
          )}

          {status && <div className="neo-status">{status}</div>}

          <form
            className="neo-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label className="sr-only" htmlFor="neo-assist-input" style={{ position: "absolute", left: -9999 }}>
              Message
            </label>
            <textarea
              id="neo-assist-input"
              rows={1}
              value={input}
              placeholder="Ask about clearance, AEO, shipping…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              disabled={busy}
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send message">
              Send
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="neo-launcher"
        aria-label={open ? "Close Neo Assist" : "Open Neo Assist chat"}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) {
            window.dispatchEvent(
              new CustomEvent("neo-assist-analytics", { detail: { event: "widget_opened" } })
            );
          }
        }}
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
