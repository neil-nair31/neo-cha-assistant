import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";

type TrackResult = {
  ref: string;
  goods: string;
  tradeFlow: string;
  statusLabel: string;
  port: string;
  blNumber: string | null;
  vessel: string;
  eta: string | null;
  etd: string | null;
  lastUpdate: string;
  containers: Array<{ number: string; type: string; status: string }>;
  milestones: Array<{ id: string; label: string; at: string | null; done: boolean; note?: string }>;
  nextAction: string;
  cthDotted?: string;
};

export function TrackHome() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<TrackResult[] | null>(null);
  const [disclaimer, setDisclaimer] = useState("");

  async function onTrack(e?: FormEvent, override?: string) {
    e?.preventDefault();
    const query = (override ?? q).trim();
    if (query.length < 4) return;
    setQ(query);
    setBusy(true);
    setError("");
    try {
      const data = await api<{ results: TrackResult[]; disclaimer: string }>(
        `/track?q=${encodeURIComponent(query)}`,
        { auth: false }
      );
      setResults(data.results);
      setDisclaimer(data.disclaimer);
    } catch (err) {
      setResults(null);
      setError(err instanceof Error ? err.message : "Track failed");
    } finally {
      setBusy(false);
    }
  }

  const samples = ["MSCU7845123", "COSU2607088SHA", "NEO-IMP-2607-0088", "HLXU4456712"];

  return (
    <div className="space-y-8">
      <section className="panel overflow-hidden">
        <div className="bg-neo-gradient px-6 py-10 text-white sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            Neo Logistics · Client Portal
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Where is my shipment — right now?
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
            Track by container number, Bill of Lading, or Neo shipment ref. Signed-in clients also
            see documents, duty status, dispatch, and desk alerts.
          </p>
          <form onSubmit={onTrack} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              className="field flex-1 border-0 text-ink"
              placeholder="e.g. MSCU7845123 · COSU2607088SHA · NEO-IMP-2607-0088"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="submit" className="btn-primary bg-neo-red hover:bg-neo-red/90" disabled={busy}>
              {busy ? "Tracking…" : "Track shipment"}
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {samples.map((s) => (
              <button
                key={s}
                type="button"
                className="rounded-lg bg-white/10 px-3 py-1.5 font-mono text-xs text-white hover:bg-white/20"
                onClick={() => void onTrack(undefined, s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 border-t border-neo-50 px-6 py-6 sm:grid-cols-3 sm:px-10">
          {[
            ["Clearance timeline", "BoE / SB milestones from Neo CHA desk"],
            ["Documents & duty", "See what’s ready vs still pending"],
            ["Dispatch & delivery", "Vehicle, slot, and factory POD status"],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="font-display text-sm font-semibold text-neo">{t}</p>
              <p className="mt-1 text-sm text-neo-700/70">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {results && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-display text-xl font-semibold text-neo">
              {results.length ? `${results.length} match${results.length > 1 ? "es" : ""}` : "No match"}
            </h2>
            <Link to="/login" className="text-sm font-semibold text-neo-blue hover:underline">
              Sign in for full documents & invoices →
            </Link>
          </div>
          {!results.length && (
            <p className="panel p-5 text-sm text-neo-700">
              No shipment found for that reference. Try another container / BL, or ask Neo desk at
              customercare@neologistics.org.
            </p>
          )}
          {results.map((r) => (
            <article key={r.ref} className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-neo-700/60">{r.ref}</p>
                  <h3 className="mt-1 font-display text-2xl font-bold text-neo">{r.goods}</h3>
                  <p className="mt-1 text-sm text-neo-700/80">
                    {r.tradeFlow.toUpperCase()} · {r.port} · {r.vessel}
                    {r.cthDotted ? ` · CTH ${r.cthDotted}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-neo-50 px-3 py-1 text-xs font-semibold uppercase text-neo">
                  {r.statusLabel}
                </span>
              </div>
              <p className="mt-4 rounded-xl bg-neo-50 px-4 py-3 text-sm text-neo-900">
                <strong>Next:</strong> {r.nextAction}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {r.containers.map((c) => (
                  <div key={c.number} className="rounded-xl border border-neo-50 px-4 py-3">
                    <p className="font-mono text-sm font-semibold text-neo">{c.number}</p>
                    <p className="text-xs text-neo-700/70">
                      {c.type} · {c.status}
                    </p>
                  </div>
                ))}
              </div>
              <ol className="mt-6 space-y-3">
                {r.milestones.map((m) => (
                  <li key={m.id} className="flex gap-3 text-sm">
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        m.done ? "bg-emerald-500" : "bg-neo-200"
                      }`}
                    />
                    <div>
                      <p className={`font-medium ${m.done ? "text-neo-900" : "text-neo-700/50"}`}>
                        {m.label}
                      </p>
                      <p className="text-xs text-neo-700/55">
                        {m.at ? new Date(m.at).toLocaleString("en-IN") : "Pending"}
                        {m.note ? ` · ${m.note}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-neo-700/50">
                Updated {new Date(r.lastUpdate).toLocaleString("en-IN")}
                {r.blNumber ? ` · BL ${r.blNumber}` : ""}
                {r.eta ? ` · ETA ${r.eta}` : ""}
                {r.etd ? ` · ETD ${r.etd}` : ""}
              </p>
            </article>
          ))}
          {disclaimer && <p className="text-xs text-neo-700/55">{disclaimer}</p>}
        </section>
      )}

      <section className="panel grid gap-6 p-6 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-neo">Already a Neo client?</h2>
          <p className="mt-2 text-sm text-neo-700/75">
            Sign in to see every active import/export, document vault, charge summary, and one-click
            desk request.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/login" className="btn-primary mt-0 inline-flex">
              Client login
            </Link>
            <Link to="/ops/login" className="btn-ghost inline-flex border-amber-300 text-amber-900">
              Neo staff / Ops login
            </Link>
          </div>
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-neo">Need help clearing?</h2>
          <p className="mt-2 text-sm text-neo-700/75">
            Cochin & Chennai licensed CHA desk — customercare@neologistics.org ·
            docschennai@neologistics.org
          </p>
          <p className="mt-3 text-xs text-neo-700/55">
            Clients: password <code className="rounded bg-neo-50 px-1">neo-demo</code>
            {" · "}
            Staff: password <code className="rounded bg-neo-50 px-1">neo-ops</code>
          </p>
        </div>
      </section>
    </div>
  );
}
