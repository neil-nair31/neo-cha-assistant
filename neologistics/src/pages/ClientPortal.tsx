import { PageShell } from "../components/PageShell.tsx";

const PORTAL_URL =
  (import.meta as { env?: { VITE_PORTAL_URL?: string; DEV?: boolean } }).env?.VITE_PORTAL_URL ||
  ((import.meta as { env?: { DEV?: boolean } }).env?.DEV
    ? "http://localhost:5175/app/"
    : "/app/");

export function ClientPortal() {
  return (
    <PageShell
      seoTitle="Client Portal · Shipment tracking"
      seoDescription="Track containers, clearance milestones, documents and dispatch with Neo Logistics Cochin & Chennai CHA desk."
      breadcrumb={[{ label: "Home", to: "/" }, { label: "Client Portal" }]}
      kicker="Neo Client Portal"
      title="Your shipments, in one place"
      subtitle="Track by container or BL, see clearance progress, documents, duty status, and dispatch — the same desk Neo runs at Cochin and Chennai."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-neo-100 bg-white p-6 shadow-card">
          <h2 className="font-display text-xl font-semibold text-neo">Open the portal</h2>
          <p className="mt-2 text-sm text-neo-600">
            Public track works without login. Client login unlocks your full shipment list, document
            vault, charges, and desk messaging.
          </p>
          <a
            href={PORTAL_URL}
            className="btn-primary mt-5 inline-flex"
            target="_blank"
            rel="noreferrer"
          >
            Launch Client Portal
          </a>
          <p className="mt-3 text-xs text-neo-500">
            Portal: {PORTAL_URL}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
          <h2 className="font-display text-xl font-semibold">Demo logins</h2>
          <p className="mt-3 text-sm font-semibold">Clients (password neo-demo)</p>
          <ul className="mt-1 space-y-1 text-sm">
            <li>import@pearlchem.demo</li>
            <li>ops@acmeagro.demo</li>
          </ul>
          <p className="mt-4 text-sm font-semibold">Neo staff / Ops (password neo-ops)</p>
          <ul className="mt-1 space-y-1 text-sm">
            <li>desk.cochin@neologistics.demo</li>
            <li>desk.chennai@neologistics.demo</li>
            <li>admin@neologistics.demo</li>
          </ul>
          <p className="mt-4 text-sm">
            In the portal header use <strong>Client login</strong> or the amber{" "}
            <strong>Neo staff login</strong> button.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
