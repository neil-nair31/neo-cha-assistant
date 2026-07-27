import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import {
  addDeskRequest,
  addOpsAlert,
  allShipments,
  clientActionItems,
  completeMilestone,
  createClientSession,
  createStaffSession,
  destroySession,
  findClient,
  findClientByEmail,
  findShipment,
  findStaffByEmail,
  getDb,
  publicSafeShipment,
  recentAudits,
  resolveDeskRequest,
  sessionClient,
  sessionStaff,
  setDocumentStatus,
  shipmentsForClient,
  trackQuery,
  updateDispatch,
} from "./store.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts — try again shortly." },
});

function bearer(req: { headers: { authorization?: string } }) {
  const h = req.headers.authorization ?? "";
  if (h.startsWith("Bearer ")) return h.slice(7);
  return undefined;
}

function summaryCard(s: ReturnType<typeof allShipments>[number]) {
  return {
    id: s.id,
    ref: s.ref,
    clientId: s.clientId,
    clientName: findClient(s.clientId)?.company ?? "—",
    tradeFlow: s.tradeFlow,
    status: s.status,
    statusLabel: s.statusLabel,
    priority: s.priority,
    port: s.port,
    origin: s.origin,
    destination: s.destination,
    goods: s.goods,
    cthDotted: s.cthDotted,
    blNumber: s.blNumber,
    vessel: s.vessel,
    eta: s.eta,
    etd: s.etd,
    lastUpdate: s.lastUpdate,
    containerCount: s.containers.length,
    alertCount: s.alerts.length,
    nextMilestone: s.milestones.find((m) => !m.done)?.label ?? "Complete",
    progress: Math.round(
      (s.milestones.filter((m) => m.done).length / Math.max(s.milestones.length, 1)) * 100
    ),
  };
}

router.get("/health", (_req, res) => {
  const db = getDb();
  res.json({
    ok: true,
    product: "Neo Client Portal + Ops Console",
    version: "1.1.0",
    shipments: db.shipments.length,
    clients: db.clients.length,
    staff: db.staff.length,
    openDeskRequests: db.deskRequests.filter((r) => r.status !== "done").length,
    ports: ["COCHIN", "CHENNAI"],
    demoNote: "Phase A — Neo ops updates milestones; clients track live.",
  });
});

router.post("/auth/login", authLimiter, (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(4),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const client = findClientByEmail(parsed.data.email);
  if (!client || client.password !== parsed.data.password) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = createClientSession(client.id);
  res.json({
    role: "client",
    token,
    client: {
      id: client.id,
      company: client.company,
      email: client.email,
      contactName: client.contactName,
      phone: client.phone,
      ports: client.ports,
    },
  });
});

router.post("/ops/login", authLimiter, (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(4),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const staff = findStaffByEmail(parsed.data.email);
  if (!staff || staff.password !== parsed.data.password) {
    res.status(401).json({ error: "Invalid Neo staff credentials" });
    return;
  }
  const token = createStaffSession(staff.id);
  res.json({
    role: "staff",
    token,
    staff: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      port: staff.port,
    },
  });
});

router.post("/auth/logout", (req, res) => {
  destroySession(bearer(req));
  res.json({ ok: true });
});

router.get("/auth/me", (req, res) => {
  const token = bearer(req);
  const client = sessionClient(token);
  if (client) {
    res.json({
      role: "client",
      client: {
        id: client.id,
        company: client.company,
        email: client.email,
        contactName: client.contactName,
        phone: client.phone,
        ports: client.ports,
      },
    });
    return;
  }
  const staff = sessionStaff(token);
  if (staff) {
    res.json({
      role: "staff",
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        port: staff.port,
      },
    });
    return;
  }
  res.status(401).json({ error: "Not signed in" });
});

router.get("/track", (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 4) {
    res.status(400).json({
      error: "Enter a container no., BL, or Neo shipment ref (min 4 characters).",
    });
    return;
  }
  const hits = trackQuery(q).map(publicSafeShipment);
  res.json({
    query: q,
    count: hits.length,
    results: hits,
    disclaimer:
      "Live status as updated by Neo CHA desk (Cochin / Chennai). Not a carrier AIS feed — confirm critical ETAs with Neo ops.",
  });
});

router.get("/shipments", (req, res) => {
  const client = sessionClient(bearer(req));
  if (!client) {
    res.status(401).json({ error: "Sign in to view your shipments" });
    return;
  }
  const flow = req.query.flow === "import" || req.query.flow === "export" ? req.query.flow : undefined;
  const status = String(req.query.status ?? "").trim();
  let list = shipmentsForClient(client.id);
  if (flow) list = list.filter((s) => s.tradeFlow === flow);
  if (status) list = list.filter((s) => s.status === status);

  const alerts = list.flatMap((s) =>
    s.alerts.map((a) => ({
      ...a,
      shipmentId: s.id,
      ref: s.ref,
      goods: s.goods,
    }))
  );

  res.json({
    clientId: client.id,
    count: list.length,
    shipments: list.map(summaryCard),
    alerts: alerts.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12),
    actionItems: clientActionItems(client.id),
    summary: {
      active: list.filter((s) => s.status !== "delivered").length,
      import: list.filter((s) => s.tradeFlow === "import").length,
      export: list.filter((s) => s.tradeFlow === "export").length,
      needsAttention: list.filter(
        (s) => s.priority === "high" || s.alerts.some((a) => a.level === "warning" || a.level === "danger")
      ).length,
      pendingDocs: list.reduce(
        (n, s) => n + s.documents.filter((d) => d.status !== "available").length,
        0
      ),
    },
  });
});

router.get("/shipments/:id", (req, res) => {
  const client = sessionClient(bearer(req));
  if (!client) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  const s = findShipment(req.params.id ?? "");
  if (!s || s.clientId !== client.id) {
    res.status(404).json({ error: "Shipment not found" });
    return;
  }
  res.json({
    shipment: s,
    clientCompany: findClient(s.clientId)?.company,
    shareHint: `Track ${s.ref} / ${(s.containers[0]?.number || s.blNumber || s.ref)} on Neo Client Portal`,
  });
});

router.post("/desk-request", authLimiter, (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    company: z.string().max(200).optional(),
    shipmentRef: z.string().max(80).optional(),
    message: z.string().min(5).max(2500),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const client = sessionClient(bearer(req));
  const row = addDeskRequest({
    clientId: client?.id ?? null,
    ...parsed.data,
  });
  console.log("[portal] desk request", row.id, parsed.data.email, parsed.data.shipmentRef);
  res.json({
    ok: true,
    id: row.id,
    message: "Request logged for Neo CHA desk (Cochin / Chennai). We’ll follow up on your shipment.",
  });
});

/** ——— Neo Ops ——— */
router.get("/ops/board", (req, res) => {
  const staff = sessionStaff(bearer(req));
  if (!staff) {
    res.status(401).json({ error: "Neo staff sign-in required" });
    return;
  }
  let list = allShipments();
  if (staff.port !== "BOTH") list = list.filter((s) => s.port === staff.port);
  const flow = req.query.flow === "import" || req.query.flow === "export" ? req.query.flow : undefined;
  const q = String(req.query.q ?? "").trim().toLowerCase();
  if (flow) list = list.filter((s) => s.tradeFlow === flow);
  if (q) {
    list = list.filter(
      (s) =>
        s.ref.toLowerCase().includes(q) ||
        s.goods.toLowerCase().includes(q) ||
        (s.blNumber ?? "").toLowerCase().includes(q) ||
        s.containers.some((c) => c.number.toLowerCase().includes(q)) ||
        (findClient(s.clientId)?.company.toLowerCase().includes(q) ?? false)
    );
  }
  const openRequests = getDb()
    .deskRequests.filter((r) => r.status !== "done")
    .slice(0, 20);
  res.json({
    staff: { id: staff.id, name: staff.name, port: staff.port, role: staff.role },
    count: list.length,
    shipments: list.map(summaryCard),
    deskRequests: openRequests,
    audits: recentAudits(25),
    summary: {
      active: list.filter((s) => s.status !== "delivered").length,
      needsAttention: list.filter((s) => s.priority === "high").length,
      openClientMessages: openRequests.length,
    },
  });
});

router.get("/ops/shipments/:id", (req, res) => {
  const staff = sessionStaff(bearer(req));
  if (!staff) {
    res.status(401).json({ error: "Neo staff sign-in required" });
    return;
  }
  const s = findShipment(req.params.id ?? "");
  if (!s) {
    res.status(404).json({ error: "Shipment not found" });
    return;
  }
  if (staff.port !== "BOTH" && s.port !== staff.port) {
    res.status(403).json({ error: "Shipment is at another Neo port desk" });
    return;
  }
  res.json({
    shipment: s,
    client: findClient(s.clientId),
    scanCode: s.containers[0]?.number || s.blNumber || s.ref,
  });
});

router.post("/ops/shipments/:id/milestones/:mid/complete", (req, res) => {
  const staff = sessionStaff(bearer(req));
  if (!staff) {
    res.status(401).json({ error: "Neo staff sign-in required" });
    return;
  }
  const note = typeof req.body?.note === "string" ? req.body.note : undefined;
  const s = completeMilestone(req.params.id ?? "", req.params.mid ?? "", staff, note);
  if (!s) {
    res.status(404).json({ error: "Shipment or milestone not found" });
    return;
  }
  res.json({ ok: true, shipment: s });
});

router.post("/ops/shipments/:id/documents/:did", (req, res) => {
  const staff = sessionStaff(bearer(req));
  if (!staff) {
    res.status(401).json({ error: "Neo staff sign-in required" });
    return;
  }
  const status = req.body?.status;
  if (status !== "available" && status !== "pending" && status !== "requested") {
    res.status(400).json({ error: "status must be available | pending | requested" });
    return;
  }
  const s = setDocumentStatus(req.params.id ?? "", req.params.did ?? "", status, staff);
  if (!s) {
    res.status(404).json({ error: "Shipment or document not found" });
    return;
  }
  res.json({ ok: true, shipment: s });
});

router.post("/ops/shipments/:id/alert", (req, res) => {
  const staff = sessionStaff(bearer(req));
  if (!staff) {
    res.status(401).json({ error: "Neo staff sign-in required" });
    return;
  }
  const schema = z.object({
    level: z.enum(["info", "warning", "success", "danger"]),
    message: z.string().min(3).max(500),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "level + message required" });
    return;
  }
  const s = addOpsAlert(req.params.id ?? "", parsed.data.level, parsed.data.message, staff);
  if (!s) {
    res.status(404).json({ error: "Shipment not found" });
    return;
  }
  res.json({ ok: true, shipment: s });
});

router.post("/ops/shipments/:id/dispatch", (req, res) => {
  const staff = sessionStaff(bearer(req));
  if (!staff) {
    res.status(401).json({ error: "Neo staff sign-in required" });
    return;
  }
  const s = updateDispatch(req.params.id ?? "", req.body ?? {}, staff);
  if (!s) {
    res.status(404).json({ error: "Shipment not found" });
    return;
  }
  res.json({ ok: true, shipment: s });
});

router.post("/ops/scan", (req, res) => {
  const staff = sessionStaff(bearer(req));
  if (!staff) {
    res.status(401).json({ error: "Neo staff sign-in required" });
    return;
  }
  const code = String(req.body?.code ?? "").trim();
  if (code.length < 4) {
    res.status(400).json({ error: "Scan / enter container, BL, or Neo ref" });
    return;
  }
  const hits = trackQuery(code);
  const filtered =
    staff.port === "BOTH" ? hits : hits.filter((s) => s.port === staff.port);
  if (!filtered.length) {
    res.status(404).json({ error: "No shipment matched that scan code" });
    return;
  }
  const s = filtered[0]!;
  const next = s.milestones.find((m) => !m.done);
  res.json({
    shipment: summaryCard(s),
    nextMilestone: next ?? null,
    scanCode: code,
  });
});

router.post("/ops/scan/complete-next", (req, res) => {
  const staff = sessionStaff(bearer(req));
  if (!staff) {
    res.status(401).json({ error: "Neo staff sign-in required" });
    return;
  }
  const code = String(req.body?.code ?? "").trim();
  const note = typeof req.body?.note === "string" ? req.body.note : "Scanned at yard / desk";
  const hits = trackQuery(code);
  const s0 =
    (staff.port === "BOTH" ? hits : hits.filter((x) => x.port === staff.port))[0] ?? null;
  if (!s0) {
    res.status(404).json({ error: "No shipment matched that scan code" });
    return;
  }
  const next = s0.milestones.find((m) => !m.done);
  if (!next) {
    res.json({ ok: true, message: "All milestones already complete", shipment: s0 });
    return;
  }
  const s = completeMilestone(s0.id, next.id, staff, note);
  res.json({ ok: true, completed: next.label, shipment: s });
});

router.post("/ops/desk-requests/:id/resolve", (req, res) => {
  const staff = sessionStaff(bearer(req));
  if (!staff) {
    res.status(401).json({ error: "Neo staff sign-in required" });
    return;
  }
  const row = resolveDeskRequest(req.params.id ?? "", staff);
  if (!row) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  res.json({ ok: true, request: row });
});

router.get("/demo-accounts", (_req, res) => {
  res.json({
    clients: getDb().clients.map((c) => ({
      email: c.email,
      password: "neo-demo",
      company: c.company,
    })),
    staff: getDb().staff.map((s) => ({
      email: s.email,
      password: "neo-ops",
      name: s.name,
      port: s.port,
      role: s.role,
    })),
    sampleTrackQueries: ["MSCU7845123", "COSU2607088SHA", "NEO-IMP-2607-0088", "HLXU4456712"],
  });
});

export default router;
