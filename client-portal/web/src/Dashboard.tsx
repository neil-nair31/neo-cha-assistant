import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";

type ListShipment = {
  id: string;
  ref: string;
  tradeFlow: string;
  status: string;
  statusLabel: string;
  priority: string;
  port: string;
  origin: string;
  destination: string;
  goods: string;
  cthDotted: string;
  blNumber: string | null;
  vessel: string;
  eta: string | null;
  etd: string | null;
  lastUpdate: string;
  containerCount: number;
  alertCount: number;
  progress: number;
};

type AlertRow = {
  id: string;
  level: string;
  message: string;
  at: string;
  shipmentId: string;
  ref: string;
  goods: string;
};

export function Dashboard() {
  const { client } = useAuth();
  const [flow, setFlow] = useState<"all" | "import" | "export">("all");
  const [shipments, setShipments] = useState<ListShipment[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [summary, setSummary] = useState({ active: 0, import: 0, export: 0, needsAttention: 0 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!client) return;
    setBusy(true);
    const q = flow === "all" ? "" : `?flow=${flow}`;
    api<{
      shipments: ListShipment[];
      alerts: AlertRow[];
      summary: typeof summary;
    }>(`/shipments${q}`)
      .then((d) => {
        setShipments(d.shipments);
        setAlerts(d.alerts);
        setSummary(d.summary);
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setBusy(false));
  }, [client, flow]);

  if (!client) return <Navigate to="/login" replace />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neo-blue">Dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-neo">Your active logistics</h1>
          <p className="mt-1 text-sm text-neo-700/70">{client.company} · Neo CHA desk updates</p>
        </div>
        <div className="flex gap-2">
          {(["all", "import", "export"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                flow === f ? "bg-neo text-white" : "border border-neo-100 bg-white text-neo-700"
              }`}
              onClick={() => setFlow(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Active", summary.active],
          ["Import", summary.import],
          ["Export", summary.export],
          ["Needs attention", summary.needsAttention],
        ].map(([label, val]) => (
          <div key={label as string} className="panel px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neo-700/55">{label}</p>
            <p className="mt-1 font-display text-3xl font-bold text-neo">{val}</p>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold text-neo">Desk alerts</h2>
          <ul className="mt-3 space-y-3">
            {alerts.slice(0, 5).map((a) => (
              <li
                key={a.id + a.ref}
                className={`rounded-xl px-4 py-3 text-sm ${
                  a.level === "warning"
                    ? "bg-amber-50 text-amber-950"
                    : a.level === "success"
                      ? "bg-emerald-50 text-emerald-950"
                      : a.level === "danger"
                        ? "bg-red-50 text-red-950"
                        : "bg-neo-50 text-neo-900"
                }`}
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-semibold">{a.ref}</span>
                  <Link to={`/shipments/${a.shipmentId}`} className="text-xs font-semibold underline">
                    Open
                  </Link>
                </div>
                <p className="mt-1">{a.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
      {busy && <p className="text-sm text-neo-700/60">Loading shipments…</p>}

      <section className="space-y-3">
        {shipments.map((s) => (
          <Link
            key={s.id}
            to={`/shipments/${s.id}`}
            className="panel block p-5 transition hover:border-neo-blue/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-neo-700/55">{s.ref}</p>
                <h3 className="mt-1 font-display text-xl font-semibold text-neo">{s.goods}</h3>
                <p className="mt-1 text-sm text-neo-700/75">
                  {s.tradeFlow.toUpperCase()} · {s.port} · {s.origin} → {s.destination}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${
                    s.priority === "high" ? "bg-amber-100 text-amber-900" : "bg-neo-50 text-neo"
                  }`}
                >
                  {s.statusLabel}
                </span>
                <p className="mt-2 text-xs text-neo-700/55">{s.progress}% milestones</p>
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-neo-50">
              <div className="h-full rounded-full bg-neo-blue-accent" style={{ width: `${s.progress}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-neo-700/60">
              <span>{s.containerCount} container(s)</span>
              <span>CTH {s.cthDotted}</span>
              {s.blNumber && <span>BL {s.blNumber}</span>}
              {s.eta && <span>ETA {s.eta}</span>}
              {s.etd && <span>ETD {s.etd}</span>}
              {s.alertCount > 0 && <span className="font-semibold text-amber-800">{s.alertCount} alert(s)</span>}
            </div>
          </Link>
        ))}
        {!busy && !shipments.length && (
          <p className="panel p-5 text-sm text-neo-700">No shipments in this filter.</p>
        )}
      </section>
    </div>
  );
}
