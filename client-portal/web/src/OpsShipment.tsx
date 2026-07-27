import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";

type Shipment = {
  id: string;
  ref: string;
  goods: string;
  statusLabel: string;
  port: string;
  tradeFlow: string;
  milestones: Array<{ id: string; label: string; at: string | null; done: boolean; note?: string }>;
  documents: Array<{ id: string; name: string; status: string }>;
  alerts: Array<{ id: string; level: string; message: string }>;
  dispatch: {
    mode: string;
    transporter: string;
    vehicle: string | null;
    driverPhone: string | null;
    scheduledAt: string | null;
    notes: string;
  } | null;
};

export function OpsShipment() {
  const { id } = useParams();
  const { staff } = useAuth();
  const [s, setS] = useState<Shipment | null>(null);
  const [clientName, setClientName] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    if (!id) return;
    try {
      const data = await api<{ shipment: Shipment; client: { company: string } }>(
        `/ops/shipments/${id}`
      );
      setS(data.shipment);
      setClientName(data.client?.company ?? "");
      setVehicle(data.shipment.dispatch?.vehicle ?? "");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    if (staff) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff, id]);

  if (!staff) return <Navigate to="/ops/login" replace />;

  async function complete(mid: string) {
    setMsg("");
    await api(`/ops/shipments/${id}/milestones/${mid}/complete`, {
      method: "POST",
      body: JSON.stringify({ note: note.trim() || undefined }),
    });
    setNote("");
    setMsg("Milestone updated — client can see this now.");
    await load();
  }

  async function setDoc(did: string, status: string) {
    await api(`/ops/shipments/${id}/documents/${did}`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function sendAlert(e: FormEvent) {
    e.preventDefault();
    if (!alertMsg.trim()) return;
    await api(`/ops/shipments/${id}/alert`, {
      method: "POST",
      body: JSON.stringify({ level: "warning", message: alertMsg.trim() }),
    });
    setAlertMsg("");
    await load();
  }

  async function saveDispatch(e: FormEvent) {
    e.preventDefault();
    await api(`/ops/shipments/${id}/dispatch`, {
      method: "POST",
      body: JSON.stringify({ vehicle: vehicle.trim() || null }),
    });
    setMsg("Dispatch updated.");
    await load();
  }

  if (error) {
    return (
      <div>
        <Link to="/ops" className="text-sm font-semibold text-neo-blue">
          ← Board
        </Link>
        <p className="mt-4 text-red-700">{error}</p>
      </div>
    );
  }

  if (!s) return <p className="text-sm text-neo-700/60">Loading…</p>;

  return (
    <div className="space-y-6">
      <Link to="/ops" className="text-sm font-semibold text-neo-blue hover:underline">
        ← Ops board
      </Link>
      <header className="panel p-6">
        <p className="font-mono text-xs text-neo-700/55">
          {s.ref} · {clientName}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-neo">{s.goods}</h1>
        <p className="mt-2 text-sm text-neo-700/75">
          {s.tradeFlow.toUpperCase()} · {s.port} · {s.statusLabel}
        </p>
        {msg && <p className="mt-3 text-sm text-emerald-800">{msg}</p>}
      </header>

      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold text-neo">Complete milestones</h2>
        <input
          className="field mt-3"
          placeholder="Optional note for this update (visible to client)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <ul className="mt-4 space-y-3">
          {s.milestones.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neo-50 px-4 py-3"
            >
              <div>
                <p className={`text-sm font-semibold ${m.done ? "text-emerald-800" : "text-neo"}`}>
                  {m.label}
                </p>
                <p className="text-xs text-neo-700/55">
                  {m.done
                    ? m.at
                      ? new Date(m.at).toLocaleString("en-IN")
                      : "Done"
                    : "Pending"}
                  {m.note ? ` · ${m.note}` : ""}
                </p>
              </div>
              {!m.done && (
                <button
                  type="button"
                  className="btn-primary bg-amber-700 hover:bg-amber-800"
                  onClick={() => void complete(m.id)}
                >
                  Mark done
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold text-neo">Documents</h2>
        <ul className="mt-3 space-y-2">
          {s.documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {d.name}{" "}
                <span className="text-xs uppercase text-neo-700/55">({d.status})</span>
              </span>
              <span className="flex gap-2">
                <button type="button" className="btn-ghost py-1 text-xs" onClick={() => void setDoc(d.id, "available")}>
                  Available
                </button>
                <button type="button" className="btn-ghost py-1 text-xs" onClick={() => void setDoc(d.id, "pending")}>
                  Pending
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={sendAlert} className="panel space-y-3 p-5">
        <h2 className="font-display text-lg font-semibold text-neo">Push alert to client</h2>
        <input
          className="field"
          placeholder="e.g. Please share invoice by EOD to protect ETD"
          value={alertMsg}
          onChange={(e) => setAlertMsg(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          Send warning alert
        </button>
      </form>

      <form onSubmit={saveDispatch} className="panel space-y-3 p-5">
        <h2 className="font-display text-lg font-semibold text-neo">Dispatch vehicle</h2>
        <input
          className="field"
          placeholder="Vehicle number"
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
        />
        <button type="submit" className="btn-ghost">
          Save dispatch
        </button>
      </form>
    </div>
  );
}
