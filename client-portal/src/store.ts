import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type {
  AlertItem,
  AuditEntry,
  Client,
  DeskRequest,
  Shipment,
  ShipmentStatus,
  Staff,
} from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(__dirname, "../data/seed.json");
const runtimePath = path.resolve(__dirname, "../data/runtime.json");

type Session =
  | { kind: "client"; userId: string; createdAt: string }
  | { kind: "staff"; userId: string; createdAt: string };

type Db = {
  clients: Client[];
  staff: Staff[];
  shipments: Shipment[];
  deskRequests: DeskRequest[];
  audits: AuditEntry[];
  sessions: Record<string, Session>;
};

function loadSeed(): Db {
  const raw = JSON.parse(fs.readFileSync(seedPath, "utf8")) as {
    clients: Client[];
    staff?: Staff[];
    shipments: Shipment[];
  };
  return {
    clients: raw.clients,
    staff: raw.staff ?? [],
    shipments: raw.shipments,
    deskRequests: [],
    audits: [],
    sessions: {},
  };
}

function persist(db: Db) {
  fs.writeFileSync(
    runtimePath,
    JSON.stringify(
      {
        shipments: db.shipments,
        deskRequests: db.deskRequests,
        audits: db.audits,
        sessions: db.sessions,
        savedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
}

let db: Db | null = null;

export function getDb(): Db {
  if (db) return db;
  const base = loadSeed();
  if (fs.existsSync(runtimePath)) {
    try {
      const runtime = JSON.parse(fs.readFileSync(runtimePath, "utf8")) as Partial<Db>;
      if (runtime.shipments?.length) base.shipments = runtime.shipments;
      if (runtime.deskRequests) base.deskRequests = runtime.deskRequests;
      if (runtime.audits) base.audits = runtime.audits;
      if (runtime.sessions) base.sessions = runtime.sessions;
    } catch {
      /* ignore */
    }
  }
  db = base;
  return db;
}

export function saveDb() {
  persist(getDb());
}

export function findClientByEmail(email: string) {
  return getDb().clients.find((c) => c.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function findStaffByEmail(email: string) {
  return getDb().staff.find((s) => s.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function findClient(id: string) {
  return getDb().clients.find((c) => c.id === id) ?? null;
}

export function findStaff(id: string) {
  return getDb().staff.find((s) => s.id === id) ?? null;
}

export function createClientSession(clientId: string) {
  const token = randomUUID();
  getDb().sessions[token] = { kind: "client", userId: clientId, createdAt: new Date().toISOString() };
  saveDb();
  return token;
}

export function createStaffSession(staffId: string) {
  const token = randomUUID();
  getDb().sessions[token] = { kind: "staff", userId: staffId, createdAt: new Date().toISOString() };
  saveDb();
  return token;
}

export function sessionClient(token: string | undefined) {
  if (!token) return null;
  const s = getDb().sessions[token];
  if (!s || s.kind !== "client") return null;
  return findClient(s.userId);
}

export function sessionStaff(token: string | undefined) {
  if (!token) return null;
  const s = getDb().sessions[token];
  if (!s || s.kind !== "staff") return null;
  return findStaff(s.userId);
}

export function destroySession(token: string | undefined) {
  if (!token) return;
  delete getDb().sessions[token];
  saveDb();
}

export function shipmentsForClient(clientId: string) {
  return getDb()
    .shipments.filter((s) => s.clientId === clientId)
    .sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate));
}

export function allShipments() {
  return [...getDb().shipments].sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate));
}

export function findShipment(id: string) {
  return getDb().shipments.find((s) => s.id === id) ?? null;
}

export function trackQuery(q: string) {
  const needle = q.trim().toUpperCase().replace(/\s+/g, "");
  if (needle.length < 4) return [];
  return getDb().shipments.filter((s) => {
    const bl = (s.blNumber ?? "").toUpperCase().replace(/\s+/g, "");
    const ref = s.ref.toUpperCase().replace(/\s+/g, "");
    const booking = (s.bookingRef ?? "").toUpperCase().replace(/\s+/g, "");
    if (bl.includes(needle) || ref.includes(needle) || booking.includes(needle)) return true;
    return s.containers.some((c) => c.number.toUpperCase().replace(/\s+/g, "").includes(needle));
  });
}

export function addDeskRequest(input: Omit<DeskRequest, "id" | "createdAt" | "status">) {
  const row: DeskRequest = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "open",
  };
  getDb().deskRequests.unshift(row);
  saveDb();
  return row;
}

function pushAudit(entry: Omit<AuditEntry, "id" | "at">) {
  getDb().audits.unshift({
    ...entry,
    id: randomUUID(),
    at: new Date().toISOString(),
  });
  if (getDb().audits.length > 500) getDb().audits.length = 500;
}

function inferStatus(s: Shipment): { status: ShipmentStatus; statusLabel: string } {
  const labels = s.milestones.filter((m) => m.done).map((m) => m.label.toLowerCase());
  const last = labels[labels.length - 1] ?? "";
  if (/deliver|pod|empty return/.test(last)) return { status: "delivered", statusLabel: "Delivered" };
  if (/sail|gated out|loaded on vessel/.test(last)) return { status: "gated_out", statusLabel: "Gated out / on vessel" };
  if (/out of charge|ooc|delivery order/.test(last)) return { status: "out_of_charge", statusLabel: "Out of charge" };
  if (/assessment|duty/.test(last)) return { status: "under_assessment", statusLabel: "Under assessment / duty" };
  if (/arriv|igm|bill of entry/.test(last)) return { status: "arrived", statusLabel: "Arrived · clearance in progress" };
  if (/invoice|packing|document|booking/.test(last) && s.milestones.some((m) => !m.done)) {
    return { status: "docs_pending", statusLabel: "Documents / prep pending" };
  }
  return { status: s.status, statusLabel: s.statusLabel };
}

export function completeMilestone(
  shipmentId: string,
  milestoneId: string,
  staff: Staff,
  note?: string
) {
  const s = findShipment(shipmentId);
  if (!s) return null;
  const m = s.milestones.find((x) => x.id === milestoneId);
  if (!m) return null;
  m.done = true;
  m.at = new Date().toISOString();
  if (note?.trim()) m.note = note.trim();
  const inferred = inferStatus(s);
  s.status = inferred.status;
  s.statusLabel = inferred.statusLabel;
  s.lastUpdate = new Date().toISOString();
  const alert: AlertItem = {
    id: randomUUID(),
    level: "success",
    message: `Updated: ${m.label}${note ? ` — ${note}` : ""}`,
    at: s.lastUpdate,
  };
  s.alerts.unshift(alert);
  if (s.alerts.length > 8) s.alerts.length = 8;
  pushAudit({
    actorType: "staff",
    actorId: staff.id,
    actorName: staff.name,
    shipmentId: s.id,
    action: "milestone_complete",
    detail: `${m.label}${note ? ` (${note})` : ""}`,
  });
  saveDb();
  return s;
}

export function setDocumentStatus(
  shipmentId: string,
  documentId: string,
  status: "available" | "pending" | "requested",
  staff: Staff
) {
  const s = findShipment(shipmentId);
  if (!s) return null;
  const d = s.documents.find((x) => x.id === documentId);
  if (!d) return null;
  d.status = status;
  d.updatedAt = status === "available" ? new Date().toISOString().slice(0, 10) : d.updatedAt;
  s.lastUpdate = new Date().toISOString();
  pushAudit({
    actorType: "staff",
    actorId: staff.id,
    actorName: staff.name,
    shipmentId: s.id,
    action: "document_status",
    detail: `${d.name} → ${status}`,
  });
  saveDb();
  return s;
}

export function addOpsAlert(
  shipmentId: string,
  level: AlertItem["level"],
  message: string,
  staff: Staff
) {
  const s = findShipment(shipmentId);
  if (!s) return null;
  s.alerts.unshift({
    id: randomUUID(),
    level,
    message,
    at: new Date().toISOString(),
  });
  if (s.alerts.length > 8) s.alerts.length = 8;
  s.lastUpdate = new Date().toISOString();
  if (level === "warning" || level === "danger") s.priority = "high";
  pushAudit({
    actorType: "staff",
    actorId: staff.id,
    actorName: staff.name,
    shipmentId: s.id,
    action: "alert",
    detail: message,
  });
  saveDb();
  return s;
}

export function updateDispatch(
  shipmentId: string,
  patch: Partial<NonNullable<Shipment["dispatch"]>>,
  staff: Staff
) {
  const s = findShipment(shipmentId);
  if (!s) return null;
  s.dispatch = {
    mode: patch.mode ?? s.dispatch?.mode ?? "Factory delivery",
    transporter: patch.transporter ?? s.dispatch?.transporter ?? "Neo contracted",
    vehicle: patch.vehicle ?? s.dispatch?.vehicle ?? null,
    driverPhone: patch.driverPhone ?? s.dispatch?.driverPhone ?? null,
    scheduledAt: patch.scheduledAt ?? s.dispatch?.scheduledAt ?? null,
    deliveredAt: patch.deliveredAt ?? s.dispatch?.deliveredAt ?? null,
    notes: patch.notes ?? s.dispatch?.notes ?? "",
  };
  s.lastUpdate = new Date().toISOString();
  pushAudit({
    actorType: "staff",
    actorId: staff.id,
    actorName: staff.name,
    shipmentId: s.id,
    action: "dispatch_update",
    detail: `${s.dispatch.mode} · ${s.dispatch.vehicle || "vehicle TBA"}`,
  });
  saveDb();
  return s;
}

export function resolveDeskRequest(id: string, staff: Staff) {
  const row = getDb().deskRequests.find((r) => r.id === id);
  if (!row) return null;
  row.status = "done";
  row.resolvedAt = new Date().toISOString();
  row.resolvedBy = staff.name;
  saveDb();
  return row;
}

export function recentAudits(limit = 40) {
  return getDb().audits.slice(0, limit);
}

export function publicSafeShipment(s: Shipment) {
  const next = s.milestones.find((m) => !m.done);
  return {
    id: s.id,
    ref: s.ref,
    goods: s.goods,
    tradeFlow: s.tradeFlow,
    status: s.status,
    statusLabel: s.statusLabel,
    port: s.port,
    blNumber: s.blNumber,
    vessel: s.vessel,
    eta: s.eta,
    etd: s.etd,
    lastUpdate: s.lastUpdate,
    containers: s.containers.map((c) => ({
      number: c.number,
      type: c.type,
      status: c.status,
    })),
    milestones: s.milestones,
    nextAction: next?.note || next?.label || "Neo desk monitoring this shipment.",
    cthDotted: s.cthDotted,
    alerts: s.alerts.slice(0, 3),
  };
}

export function clientActionItems(clientId: string) {
  const list = shipmentsForClient(clientId);
  const actions: Array<{
    shipmentId: string;
    ref: string;
    goods: string;
    kind: string;
    message: string;
  }> = [];
  for (const s of list) {
    for (const a of s.alerts.filter((x) => x.level === "warning" || x.level === "danger")) {
      actions.push({
        shipmentId: s.id,
        ref: s.ref,
        goods: s.goods,
        kind: "alert",
        message: a.message,
      });
    }
    const pendingDocs = s.documents.filter((d) => d.status === "pending" || d.status === "requested");
    if (pendingDocs.length && s.tradeFlow === "export") {
      actions.push({
        shipmentId: s.id,
        ref: s.ref,
        goods: s.goods,
        kind: "documents",
        message: `Upload / share: ${pendingDocs.map((d) => d.name).join(", ")}`,
      });
    }
    if (s.charges.some((c) => c.status === "pending")) {
      actions.push({
        shipmentId: s.id,
        ref: s.ref,
        goods: s.goods,
        kind: "payment",
        message: "Duty / charge payment pending — Neo will share challan when ready.",
      });
    }
  }
  return actions.slice(0, 12);
}
