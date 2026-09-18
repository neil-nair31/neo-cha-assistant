import { useState, type FormEvent } from "react";

const TOPIC_CHIPS = [
  { id: "cashew", label: "Cashew" },
  { id: "steel", label: "Steel" },
  { id: "chemicals", label: "Chemicals" },
  { id: "agro", label: "Agro" },
] as const;

/** Premium subscribe band — used on Blogs + Customs Notifications */
export function DigestSubscribe({
  variant = "band",
}: {
  variant?: "band" | "card";
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function toggleTopic(id: string) {
    setTopics((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function onSubscribe(e: FormEvent) {
    e.preventDefault();
    if (!consent || busy) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          topics: topics.length ? topics : ["all"],
          consent: true,
        }),
      });
      const data = await res.json();
      setMsg(
        res.ok
          ? data.message || "You’re on the list — Neo will email blog digest updates."
          : data.error || "Subscribe failed"
      );
      if (res.ok) {
        setEmail("");
        setName("");
        setTopics([]);
        setConsent(false);
      }
    } catch {
      setMsg(
        "Could not subscribe right now. Email customercare@neologistics.org and we’ll add you manually."
      );
    } finally {
      setBusy(false);
    }
  }

  const shell =
    variant === "band"
      ? "relative overflow-hidden rounded-none border-y border-neo-200/80 bg-neo-950 px-5 py-10 text-white sm:px-8 sm:py-12"
      : "form-card space-y-4";

  return (
    <section className={shell} aria-labelledby="digest-subscribe-title">
      {variant === "band" && (
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px 280px at 10% 0%, rgba(200,16,46,0.35), transparent 55%), radial-gradient(500px 240px at 90% 100%, rgba(30,51,146,0.45), transparent 50%)",
          }}
        />
      )}
      <div className={`relative ${variant === "band" ? "container-page" : ""}`}>
        <div className={variant === "band" ? "grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end" : "space-y-4"}>
          <div>
            <p
              className={
                variant === "band"
                  ? "text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60"
                  : "text-xs font-semibold uppercase tracking-[0.14em] text-neo-blue"
              }
            >
              Neo Logistics blogs
            </p>
            <h3
              id="digest-subscribe-title"
              className={
                variant === "band"
                  ? "mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl"
                  : "font-display text-lg font-semibold text-neo"
              }
            >
              Get blog updates before your next filing
            </h3>
            <p
              className={
                variant === "band"
                  ? "mt-3 max-w-xl text-sm leading-relaxed text-white/75"
                  : "mt-1 text-sm text-neo-600"
              }
            >
              Short CBIC / DGFT notes written for Cochin & Chennai shippers — what changed, who
              should care, what to do next. Not a spam blast. Not legal advice. Neo’s CHA still
              confirms before you file.
            </p>
          </div>

          <form onSubmit={onSubscribe} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className={
                  variant === "band"
                    ? "field-input border-white/15 bg-white/10 text-white placeholder:text-white/45"
                    : "field-input"
                }
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              <input
                type="email"
                required
                className={
                  variant === "band"
                    ? "field-input border-white/15 bg-white/10 text-white placeholder:text-white/45"
                    : "field-input"
                }
                placeholder="Work email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <p
                className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
                  variant === "band" ? "text-white/55" : "text-neo-500"
                }`}
              >
                Industries you care about (optional)
              </p>
              <div className="flex flex-wrap gap-2">
                {TOPIC_CHIPS.map((t) => {
                  const on = topics.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTopic(t.id)}
                      className={
                        on
                          ? "rounded-lg bg-neo-red px-3 py-1.5 text-xs font-semibold text-white"
                          : variant === "band"
                            ? "rounded-lg border border-white/25 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85"
                            : "rounded-lg border border-neo-100 bg-white px-3 py-1.5 text-xs font-semibold text-neo-700"
                      }
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <label
              className={`flex items-start gap-2 text-sm ${
                variant === "band" ? "text-white/80" : "text-neo-700"
              }`}
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span>
                Email me Neo blog / customs digest updates and related follow-ups. I can
                unsubscribe anytime.
              </span>
            </label>
            <button type="submit" className="btn-primary" disabled={!consent || busy}>
              {busy ? "Joining…" : "Subscribe to blog digest"}
            </button>
            {msg && (
              <p className={`text-sm ${variant === "band" ? "text-white/85" : "text-neo-700"}`}>
                {msg}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
