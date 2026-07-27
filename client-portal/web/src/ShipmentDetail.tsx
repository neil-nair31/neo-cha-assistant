import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";

type Shipment = {
  id: string;
  ref: string;
  tradeFlow: string;
  statusLabel: string;
  priority: string;
  port: string;
  origin: string;
  destination: string;
  goods: string;
  cth: string;
  cthDotted: string;
  blNumber: string | null;
  bookingRef: string | null;
  vessel: string;
  voyage: string;
  eta: string | null;
  etd: string | null;
  lastUpdate: string;
  containers: Array<{
    number: string;
    type: string;
    seal: string | null;
    packages: number;
    grossWeightKg: number;
    status: string;
  }>;
  milestones: Array<{ id: string; label: string; at: string | null; done: boolean; note?: string }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    updatedAt: string | null;
  }>;
  charges: Array<{ label: string; amount: number; currency: string; status: string }>;
  dispatch: {
    mode: string;
    transporter: string;
    vehicle: string | null;
    driverPhone: string | null;
    scheduledAt: string | null;
    deliveredAt: string | null;
    notes: string;
  } | null;
  alerts: Array<{ id: string; level: string; message: string; at: string }>;
  deskNotes: string;
};

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ShipmentDetail() {
  const { id } = useParams();
  const { client } = useAuth();
  const [s, setS] = useState<Shipment | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [deskMsg, setDeskMsg] = useState("");
  const [deskBusy, setDeskBusy] = useState(false);
  const [deskOk, setDeskOk] = useState("");

  useEffect(() => {
    if (!client || !id) return;
    api<{ shipment: Shipment }>(`/shipments/${id}`)
      .then((d) => setS(d.shipment))
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, [client, id]);

  if (!client) return <Navigate to="/login" replace />;

  async function askDesk(e: FormEvent) {
    e.preventDefault();
    if (!s || !msg.trim()) return;
    setDeskBusy(true);
    setDeskOk("");
    try {
      const data = await api<{ message: string }>("/desk-request", {
        method: "POST",
        body: JSON.stringify({
          name: client!.contactName,
          email: client!.email,
          company: client!.company,
          shipmentRef: s.ref,
          message: msg.trim(),
        }),
      });
      setDeskOk(data.message);
      setMsg("");
    } catch (err) {
      setDeskOk(err instanceof Error ? err.message : "Could not send");
    } finally {
      setDeskBusy(false);
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard" className="text-sm font-semibold text-neo-blue">
          ← Back
        </Link>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!s) return <p className="text-sm text-neo-700/60">Loading shipment…</p>;

  const progress = Math.round(
    (s.milestones.filter((m) => m.done).length / Math.max(s.milestones.length, 1)) * 100
  );

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="text-sm font-semibold text-neo-blue hover:underline">
        ← All shipments
      </Link>

      <header className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-neo-700/55">{s.ref}</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-neo">{s.goods}</h1>
            <p className="mt-2 text-sm text-neo-700/75">
              {s.tradeFlow.toUpperCase()} · {s.port} · {s.origin} → {s.destination}
            </p>
            <p className="mt-1 text-sm text-neo-700/60">
              Vessel {s.vessel} / {s.voyage}
              {s.blNumber ? ` · BL ${s.blNumber}` : ""}
              {s.bookingRef ? ` · Booking ${s.bookingRef}` : ""}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block rounded-full bg-neo-50 px-3 py-1 text-xs font-semibold uppercase text-neo">
              {s.statusLabel}
            </span>
            <p className="mt-2 font-mono text-lg font-bold text-neo-blue">{s.cthDotted}</p>
            <p className="text-xs text-neo-700/55">India CTH</p>
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-neo-50">
          <div className="h-full rounded-full bg-neo" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-neo-700/55">
          {progress}% clearance progress · updated {new Date(s.lastUpdate).toLocaleString("en-IN")}
        </p>
        {s.deskNotes && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            {s.deskNotes}
          </p>
        )}
      </header>

      {s.alerts.length > 0 && (
        <section className="space-y-2">
          {s.alerts.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl px-4 py-3 text-sm ${
                a.level === "warning"
                  ? "bg-amber-50 text-amber-950"
                  : a.level === "success"
                    ? "bg-emerald-50 text-emerald-950"
                    : "bg-neo-50 text-neo-900"
              }`}
            >
              {a.message}
            </div>
          ))}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold text-neo">Clearance timeline</h2>
          <ol className="mt-4 space-y-4">
            {s.milestones.map((m) => (
              <li key={m.id} className="flex gap-3">
                <span
                  className={`mt-1 h-3 w-3 shrink-0 rounded-full ${m.done ? "bg-emerald-500" : "bg-neo-200"}`}
                />
                <div>
                  <p className={`text-sm font-semibold ${m.done ? "text-neo-900" : "text-neo-700/45"}`}>
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
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold text-neo">Containers</h2>
          <ul className="mt-4 space-y-3">
            {s.containers.map((c) => (
              <li key={c.number} className="rounded-xl border border-neo-50 px-4 py-3">
                <p className="font-mono text-sm font-bold text-neo">{c.number}</p>
                <p className="mt-1 text-xs text-neo-700/70">
                  {c.type}
                  {c.seal ? ` · seal ${c.seal}` : ""} · {c.packages} pkgs
                  {c.grossWeightKg ? ` · ${c.grossWeightKg.toLocaleString("en-IN")} kg` : ""}
                </p>
                <p className="mt-1 text-sm text-neo-900">{c.status}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold text-neo">Documents</h2>
          <ul className="mt-4 divide-y divide-neo-50">
            {s.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="text-neo-900">{d.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                    d.status === "available"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-900"
                  }`}
                >
                  {d.status}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-neo-700/55">
            Document download links go live when Neo ops attaches files (Phase A shows status first).
          </p>
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold text-neo">Charges summary</h2>
          <ul className="mt-4 space-y-3">
            {s.charges.map((c) => (
              <li key={c.label} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-neo-900">{c.label}</p>
                  <p className="text-xs uppercase text-neo-700/55">{c.status}</p>
                </div>
                <p className="font-semibold text-neo">{inr(c.amount)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-neo-700/55">
            Duty figures are indicative until assessment / challan — confirm with Neo desk before payment.
          </p>
        </section>
      </div>

      {s.dispatch && (
        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold text-neo">Dispatch & delivery</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
            <p>
              <span className="text-neo-700/55">Mode:</span> {s.dispatch.mode}
            </p>
            <p>
              <span className="text-neo-700/55">Transporter:</span> {s.dispatch.transporter}
            </p>
            <p>
              <span className="text-neo-700/55">Vehicle:</span> {s.dispatch.vehicle || "TBA"}
            </p>
            <p>
              <span className="text-neo-700/55">Driver:</span> {s.dispatch.driverPhone || "TBA"}
            </p>
            <p>
              <span className="text-neo-700/55">Scheduled:</span>{" "}
              {s.dispatch.scheduledAt
                ? new Date(s.dispatch.scheduledAt).toLocaleString("en-IN")
                : "TBA"}
            </p>
            <p>
              <span className="text-neo-700/55">Delivered:</span>{" "}
              {s.dispatch.deliveredAt
                ? new Date(s.dispatch.deliveredAt).toLocaleString("en-IN")
                : "Not yet"}
            </p>
          </div>
          <p className="mt-3 rounded-xl bg-neo-50 px-4 py-3 text-sm text-neo-900">{s.dispatch.notes}</p>
        </section>
      )}

      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold text-neo">Ask Neo desk about this shipment</h2>
        <p className="mt-1 text-sm text-neo-700/70">
          Message goes to Cochin / Chennai CHA ops with this shipment ref attached.
        </p>
        <form onSubmit={askDesk} className="mt-4 space-y-3">
          <textarea
            className="field min-h-[96px]"
            placeholder="e.g. Please share duty challan as soon as assessment is complete…"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={deskBusy}>
            {deskBusy ? "Sending…" : "Send to Neo desk"}
          </button>
          {deskOk && <p className="text-sm text-neo-700">{deskOk}</p>}
        </form>
      </section>
    </div>
  );
}
