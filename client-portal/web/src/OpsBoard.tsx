import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";

type BoardShipment = {
  id: string;
  ref: string;
  clientName: string;
  tradeFlow: string;
  statusLabel: string;
  priority: string;
  port: string;
  goods: string;
  progress: number;
  nextMilestone: string;
  alertCount: number;
  lastUpdate: string;
};

type DeskReq = {
  id: string;
  name: string;
  email: string;
  company?: string;
  shipmentRef?: string;
  message: string;
  createdAt: string;
};

type Audit = {
  id: string;
  at: string;
  actorName: string;
  action: string;
  detail: string;
  shipmentId: string;
};

export function OpsBoard() {
  const { staff } = useAuth();
  const [shipments, setShipments] = useState<BoardShipment[]>([]);
  const [deskRequests, setDeskRequests] = useState<DeskReq[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [summary, setSummary] = useState({ active: 0, needsAttention: 0, openClientMessages: 0 });
  const [q, setQ] = useState("");
  const [scan, setScan] = useState("");
  const [scanMsg, setScanMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  async function load(query = q) {
    setBusy(true);
    try {
      const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      const data = await api<{
        shipments: BoardShipment[];
        deskRequests: DeskReq[];
        audits: Audit[];
        summary: typeof summary;
      }>(`/ops/board${qs}`);
      setShipments(data.shipments);
      setDeskRequests(data.deskRequests);
      setAudits(data.audits);
      setSummary(data.summary);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ops board");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (staff) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff]);

  if (!staff) return <Navigate to="/ops/login" replace />;

  async function onScan(e: FormEvent) {
    e.preventDefault();
    if (scan.trim().length < 4) return;
    setScanMsg("");
    try {
      const data = await api<{
        ok: boolean;
        completed?: string;
        message?: string;
        shipment?: { id: string; ref: string };
      }>("/ops/scan/complete-next", {
        method: "POST",
        body: JSON.stringify({ code: scan.trim(), note: "Scanned at desk / yard" }),
      });
      setScanMsg(
        data.completed
          ? `Completed “${data.completed}” on ${data.shipment?.ref}`
          : data.message || "Scan OK"
      );
      setScan("");
      await load();
    } catch (err) {
      setScanMsg(err instanceof Error ? err.message : "Scan failed");
    }
  }

  async function resolveReq(id: string) {
    await api(`/ops/desk-requests/${id}/resolve`, { method: "POST", body: "{}" });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
          Neo Ops · {staff.port}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-neo">Desk board</h1>
        <p className="mt-1 text-sm text-neo-700/70">
          Signed in as {staff.name} · update milestones clients see live
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Active shipments", summary.active],
          ["Needs attention", summary.needsAttention],
          ["Client messages", summary.openClientMessages],
        ].map(([l, v]) => (
          <div key={l as string} className="panel px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neo-700/55">{l}</p>
            <p className="mt-1 font-display text-3xl font-bold text-neo">{v}</p>
          </div>
        ))}
      </div>

      <form onSubmit={onScan} className="panel space-y-3 border-amber-200 p-5">
        <h2 className="font-display text-lg font-semibold text-neo">Scan / enter code → complete next step</h2>
        <p className="text-sm text-neo-700/70">
          Paste container no., BL, or Neo ref — marks the next pending milestone done.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="field flex-1 font-mono"
            placeholder="e.g. MSCU7845123 or COSU2607088SHA"
            value={scan}
            onChange={(e) => setScan(e.target.value)}
          />
          <button type="submit" className="btn-primary bg-amber-700 hover:bg-amber-800">
            Scan & complete next
          </button>
        </div>
        {scanMsg && <p className="text-sm text-neo-800">{scanMsg}</p>}
      </form>

      <div className="flex flex-wrap gap-2">
        <input
          className="field max-w-sm"
          placeholder="Filter board…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="button" className="btn-ghost" onClick={() => void load(q)}>
          Search
        </button>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {busy && <p className="text-sm text-neo-700/60">Loading…</p>}

      <section className="space-y-3">
        {shipments.map((s) => (
          <Link
            key={s.id}
            to={`/ops/shipments/${s.id}`}
            className="panel block p-5 transition hover:border-amber-400"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-neo-700/55">
                  {s.ref} · {s.clientName}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-neo">{s.goods}</h3>
                <p className="mt-1 text-sm text-neo-700/75">
                  {s.tradeFlow.toUpperCase()} · {s.port} · next: {s.nextMilestone}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${
                  s.priority === "high" ? "bg-amber-100 text-amber-900" : "bg-neo-50 text-neo"
                }`}
              >
                {s.statusLabel}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neo-50">
              <div className="h-full bg-amber-600" style={{ width: `${s.progress}%` }} />
            </div>
          </Link>
        ))}
      </section>

      {deskRequests.length > 0 && (
        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold text-neo">Open client messages</h2>
          <ul className="mt-3 space-y-3">
            {deskRequests.map((r) => (
              <li key={r.id} className="rounded-xl border border-neo-50 px-4 py-3 text-sm">
                <p className="font-semibold text-neo">
                  {r.name} · {r.shipmentRef || "no ref"}
                </p>
                <p className="mt-1 text-neo-800">{r.message}</p>
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-neo-blue underline"
                  onClick={() => void resolveReq(r.id)}
                >
                  Mark resolved
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {audits.length > 0 && (
        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold text-neo">Recent desk activity</h2>
          <ul className="mt-3 space-y-2 text-sm text-neo-800">
            {audits.slice(0, 8).map((a) => (
              <li key={a.id}>
                <span className="text-neo-700/55">{new Date(a.at).toLocaleString("en-IN")}</span>
                {" · "}
                <strong>{a.actorName}</strong> — {a.detail}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
