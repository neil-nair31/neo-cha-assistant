import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import {
  DISCLAIMER,
  blogStats,
  getBlogPost,
  listBlogPosts,
  loadBlogPosts,
  setPostStatus,
} from "./blog-store.js";
import { INDUSTRY_LABELS, NEO_INDUSTRIES } from "./industries.js";
import { sendDigestToSubscribers } from "./notify.js";
import { runScan } from "./scan-run.js";
import { getMachineState, runMachineNow } from "./scheduler.js";
import { listActiveSubscribers, subscribe, unsubscribe } from "./subscribers.js";
import type { NotificationItem, PostStatus } from "./types.js";

const router = Router();

router.use(
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Rate limit — please wait a moment." },
  })
);

const subscribeLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  message: { error: "Too many subscribe attempts — try later." },
});

function requireAdmin(req: { header(name: string): string | undefined }, res: {
  status(code: number): { json(body: unknown): void };
}): boolean {
  const token = process.env.DIGEST_ADMIN_TOKEN;
  if (!token) return true; // local/dev open
  if (req.header("x-digest-token") === token) return true;
  res.status(401).json({ error: "Unauthorized — set header x-digest-token" });
  return false;
}

function asNotifications(): NotificationItem[] {
  return listBlogPosts({ status: "published", limit: 100 }).map((p) => ({
    id: p.id,
    title: p.title,
    summary: p.excerpt,
    impact: p.impact,
    tags: [...p.tags, ...p.industries],
    source: p.source,
    publishedAt: p.publishedAt,
    sourceUrl: p.sourceUrl,
  }));
}

router.get("/health", (_req, res) => {
  const stats = blogStats();
  res.json({
    ok: true,
    product: "AI Customs Notifications Digest",
    feature: "notifications-digest",
    version: "4.0.0",
    market: "India",
    grade: "enterprise",
    surfaces: ["blog", "customs-notification", "email-digest", "ops-review", "content-machine"],
    publishMode: process.env.DIGEST_PUBLISH_MODE || "draft",
    contentMachine: {
      enabled: (process.env.DIGEST_AUTO_MACHINE ?? "true").toLowerCase() !== "false",
      intervalHours: Number(process.env.DIGEST_SCAN_INTERVAL_HOURS ?? 6),
      maxPublishPerDay: Number(process.env.DIGEST_MAX_PUBLISH_PER_DAY ?? 5),
      autoPublishMinQuality: Number(process.env.DIGEST_AUTO_PUBLISH_MIN_QUALITY ?? 70),
      state: getMachineState(),
    },
    disclaimer: DISCLAIMER,
    ...stats,
    industries: NEO_INDUSTRIES,
    smtpConfigured: Boolean(process.env.SMTP_HOST),
    subscribers: listActiveSubscribers().length,
    aiEnabled: Boolean(
      (process.env.OPENAI_API_KEY &&
        !process.env.OPENAI_API_KEY.includes("your-key") &&
        !process.env.OPENAI_API_KEY.includes("PASTE_")) ||
        ((process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) &&
          !(process.env.GEMINI_API_KEY || "").includes("your-key"))
    ),
    aiProvider: process.env.AI_PROVIDER || "gemini",
    aiModel: process.env.AI_MODEL || null,
    adminTokenRequired: Boolean(process.env.DIGEST_ADMIN_TOKEN),
  });
});

router.get("/blog-posts", (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const industry = String(req.query.industry ?? "").trim();
  const source = String(req.query.source ?? "").trim();
  const status = String(req.query.status ?? "published") as PostStatus | "all";
  const limit = Number(req.query.limit ?? 40) || 40;

  // Public default = published only. Drafts require admin token.
  if (status === "draft" || status === "all" || status === "rejected") {
    if (!requireAdmin(req, res)) return;
  }

  res.json({
    posts: listBlogPosts({
      q: q || undefined,
      industry: industry || undefined,
      source: source || undefined,
      status,
      limit,
    }),
    industries: NEO_INDUSTRIES.map((id) => ({ id, label: INDUSTRY_LABELS[id] })),
    disclaimer: DISCLAIMER,
  });
});

router.get("/blog-posts/:idOrSlug", (req, res) => {
  const post = getBlogPost(req.params.idOrSlug ?? "");
  if (!post) {
    res.status(404).json({ error: "Post not found", disclaimer: DISCLAIMER });
    return;
  }
  if (post.status !== "published") {
    if (!requireAdmin(req, res)) return;
  }
  res.json({ post, disclaimer: DISCLAIMER });
});

router.get("/drafts", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json({
    drafts: listBlogPosts({ status: "draft", limit: 100 }),
    disclaimer: DISCLAIMER,
  });
});

router.post("/blog-posts/:id/approve", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const reviewedBy = String(req.body?.reviewedBy ?? "ops");
  const post = setPostStatus(req.params.id ?? "", "published", reviewedBy);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json({ ok: true, post, message: "Published to Neo blog." });
});

router.post("/blog-posts/:id/reject", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const reviewedBy = String(req.body?.reviewedBy ?? "ops");
  const post = setPostStatus(req.params.id ?? "", "rejected", reviewedBy);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json({ ok: true, post, message: "Rejected — will not appear on public blog." });
});

router.post("/blog-posts/approve-all-drafts", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const reviewedBy = String(req.body?.reviewedBy ?? "ops");
  const minQ = Number(req.body?.minQuality ?? 50);
  const drafts = listBlogPosts({ status: "draft", limit: 200 }).filter(
    (p) => p.qualityScore >= minQ
  );
  const published = drafts.map((d) => setPostStatus(d.id, "published", reviewedBy)).filter(Boolean);
  res.json({
    ok: true,
    approved: published.length,
    skippedLowQuality: listBlogPosts({ status: "draft", limit: 200 }).length,
    message: `Approved ${published.length} draft(s) with quality ≥ ${minQ}.`,
  });
});

router.get("/notifications", (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const tag = String(req.query.tag ?? "").trim().toLowerCase();
  let items = asNotifications();
  if (q) {
    items = items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.tags.some((t) => t.includes(q))
    );
  }
  if (tag) items = items.filter((n) => n.tags.some((t) => t === tag));
  res.json({
    items: items.slice(0, 50),
    tags: [...new Set(items.flatMap((i) => i.tags))].sort(),
    disclaimer: DISCLAIMER,
  });
});

router.get("/notifications/:id", (req, res) => {
  const post = getBlogPost(req.params.id ?? "");
  if (!post || post.status !== "published") {
    res.status(404).json({ error: "Not found", disclaimer: DISCLAIMER });
    return;
  }
  res.json({
    item: asNotifications().find((n) => n.id === post.id),
    post,
    disclaimer: DISCLAIMER,
  });
});

router.get("/industries", (_req, res) => {
  res.json({
    industries: NEO_INDUSTRIES.map((id) => ({ id, label: INDUSTRY_LABELS[id] })),
  });
});

router.post("/subscribe", subscribeLimiter, (req, res) => {
  const schema = z.object({
    email: z.string().email().max(200),
    name: z.string().max(120).optional(),
    company: z.string().max(200).optional(),
    topics: z.array(z.string().max(40)).max(20).optional(),
    consent: z.literal(true),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email + consent required", details: parsed.error.flatten() });
    return;
  }
  const sub = subscribe(parsed.data);
  res.json({
    ok: true,
    id: sub.id,
    message: "Subscribed — digest emails go out after posts are approved to the Neo blog.",
    disclaimer: DISCLAIMER,
  });
});

router.post("/unsubscribe", subscribeLimiter, (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Valid email required" });
    return;
  }
  const ok = unsubscribe(parsed.data.email);
  res.json({ ok, message: ok ? "Unsubscribed." : "Email was not on the active list." });
});

router.post("/send-digest", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const posts = listBlogPosts({ status: "published", limit: Math.min(Number(req.body?.limit ?? 5) || 5, 10) });
  const items = posts.map((p) => ({
    id: p.id,
    title: p.title,
    summary: p.excerpt,
    impact: p.impact,
    tags: p.industries,
    source: p.source,
    publishedAt: p.publishedAt,
    sourceUrl: p.sourceUrl,
  }));
  const subs = listActiveSubscribers();
  if (!subs.length) {
    res.json({ ok: true, sent: 0, logged: 0, message: "No active subscribers" });
    return;
  }
  try {
    const result = await sendDigestToSubscribers(items, subs);
    res.json({ ok: true, ...result, itemCount: items.length, subscriberCount: subs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Digest send failed" });
  }
});

router.post("/scan", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    // Prefer content machine (need-based + auto-publish). Fall back to legacy scan if forced.
    if (req.body?.legacy === true) {
      const maxNew = Number(req.body?.maxNew ?? process.env.DIGEST_MAX_NEW ?? 5);
      const result = await runScan(maxNew);
      res.json({ ok: true, mode: "legacy-scan", ...result, disclaimer: DISCLAIMER });
      return;
    }
    const result = await runMachineNow();
    res.json({ ok: result.ok, mode: "content-machine", ...result, disclaimer: DISCLAIMER });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Scan failed",
      disclaimer: DISCLAIMER,
    });
  }
});

router.get("/machine/status", (_req, res) => {
  res.json({
    ok: true,
    enabled: (process.env.DIGEST_AUTO_MACHINE ?? "true").toLowerCase() !== "false",
    publishMode: process.env.DIGEST_PUBLISH_MODE || "draft",
    state: getMachineState(),
    blog: blogStats(),
  });
});

router.post("/machine/run", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const result = await runMachineNow();
    res.json({ ok: result.ok, ...result, state: getMachineState(), blog: blogStats() });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Content machine failed",
    });
  }
});

export default router;
