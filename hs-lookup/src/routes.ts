import { randomUUID } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { DISCLAIMER, DUTY_NOTE, catalogStats, getIndex } from "./catalog.js";
import { classifyGoods, explainCoverage } from "./classify.js";
import { listNeoDeskCargo } from "./client-pack.js";
import { getNeoDeskPrecedents } from "./neo-desk-precedents.js";
import { notifyChaHandoff } from "./notify.js";
import {
  childrenOf,
  listByChapter,
  listChapters,
  lookupByCode,
  searchHs,
} from "./search.js";

const router = Router();

router.use(
  rateLimit({
    windowMs: 60_000,
    max: 90,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Rate limit — please wait a moment and try again." },
  })
);

const handoffLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many CHA handoff requests — please try again later." },
});

router.get("/health", (_req, res) => {
  try {
    const stats = catalogStats();
    res.json({
      ok: true,
      product: "Neo HS Finder",
      feature: "hs-lookup",
      version: "3.3.0",
      standalone: true,
      disclaimer: DISCLAIMER,
      dutyNote: DUTY_NOTE,
      coverage: explainCoverage(),
      ...stats,
      cth8: stats.subheadings,
      neoDeskPrecedents: getNeoDeskPrecedents().length,
      aiEnabled: Boolean(
        ((process.env.OPENAI_API_KEY &&
          !process.env.OPENAI_API_KEY.includes("your-key") &&
          !process.env.OPENAI_API_KEY.includes("PASTE_")) ||
          ((process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) &&
            !(process.env.GEMINI_API_KEY || "").includes("your-key")))
      ),
      aiProvider: process.env.AI_PROVIDER || "gemini",
      hsModel: process.env.HS_AI_MODEL || process.env.AI_MODEL || null,
      smtpConfigured: Boolean(process.env.SMTP_HOST),
    });
  } catch (err) {
    res.status(503).json({
      ok: false,
      error: err instanceof Error ? err.message : "index unavailable",
    });
  }
});

router.get("/neo-desk", (req, res) => {
  const tradeFlow = req.query.flow === "import" || req.query.flow === "export" ? req.query.flow : undefined;
  const q = String(req.query.q ?? "").trim() || undefined;
  const lines = listNeoDeskCargo({ tradeFlow, q });
  res.json({
    source: "Neo Logistics CHA desk HS workbook (Cochin / Chennai)",
    count: lines.length,
    total: getNeoDeskPrecedents().length,
    lines,
    note: "These are Neo’s filed goods → India CTH pairs. Educational tool — CHA still confirms before filing.",
    disclaimer: DISCLAIMER,
  });
});

router.get("/chapters", (_req, res) => {
  res.json({ chapters: listChapters(), market: "India", disclaimer: DISCLAIMER });
});

router.get("/chapter/:code", (req, res) => {
  const entries = listByChapter(req.params.code ?? "");
  res.json({
    chapter: req.params.code,
    count: entries.length,
    entries,
    market: "India",
    disclaimer: DISCLAIMER,
  });
});

router.get("/tree/:code", (req, res) => {
  res.json({
    parent: req.params.code,
    children: childrenOf(req.params.code ?? ""),
    market: "India",
    disclaimer: DISCLAIMER,
  });
});

router.get("/code/:code", (req, res) => {
  const hit = lookupByCode(req.params.code ?? "");
  if (!hit) {
    res.status(404).json({ error: "Code not found in India CTH index", disclaimer: DISCLAIMER });
    return;
  }
  res.json({
    entry: hit,
    disclaimer: DISCLAIMER,
    dutyNote: DUTY_NOTE,
    indiaNote: getIndex().meta.indiaNote,
  });
});

router.get("/search", (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2) {
    res.status(400).json({ error: "Provide ?q= with at least 2 characters" });
    return;
  }
  const limit = Math.min(Number(req.query.limit ?? 12) || 12, 40);
  res.json({
    query: q,
    market: "India",
    results: searchHs(q, limit),
    disclaimer: DISCLAIMER,
    dutyNote: DUTY_NOTE,
    coverage: explainCoverage(),
  });
});

router.post("/classify", async (req, res) => {
  const schema = z.object({
    description: z.string().min(2).max(2500),
    material: z.string().max(500).optional(),
    form: z.string().max(500).optional(),
    endUse: z.string().max(500).optional(),
    originHint: z.string().max(500).optional(),
    tradeFlow: z.enum(["import", "export", "either"]).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  try {
    const result = await classifyGoods(parsed.data);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Classification failed", disclaimer: DISCLAIMER });
  }
});

router.post("/cha-handoff", handoffLimiter, async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().max(200),
    phone: z.string().max(40).optional(),
    company: z.string().max(200).optional(),
    tradeFlow: z.enum(["import", "export", "either"]).optional(),
    description: z.string().min(2).max(2500),
    notes: z.string().max(2500).optional(),
    candidates: z
      .array(
        z.object({
          code: z.string().min(4).max(16),
          dotted: z.string().max(24).optional(),
          description: z.string().max(500),
        })
      )
      .max(8),
    consent: z.literal(true),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid handoff — name, email, description, consent, and shortlist required",
      details: parsed.error.flatten(),
    });
    return;
  }
  try {
    const leadId = randomUUID();
    const notify = await notifyChaHandoff(parsed.data, leadId);
    res.json({
      ok: true,
      leadId,
      message: notify.emailed
        ? "Shortlist sent to Neo’s CHA desk. We’ll confirm before you file."
        : "Request logged. Neo’s CHA desk will receive it when SMTP is configured (or check server console in dev).",
      emailed: notify.emailed,
      disclaimer: DISCLAIMER,
    });
  } catch (err) {
    console.error("[cha-handoff]", err);
    res.status(500).json({ error: "Could not submit CHA handoff", disclaimer: DISCLAIMER });
  }
});

export default router;
