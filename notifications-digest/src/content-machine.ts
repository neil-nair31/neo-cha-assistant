/**
 * Neo AI Customs Content Machine
 * Scrape → filter by Neo relevance → enrich → AI draft → auto-publish when quality is high.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  blogStats,
  listBlogPosts,
  loadBlogPosts,
  setPostStatus,
  upsertPosts,
} from "./blog-store.js";
import { fetchNoticeBodyText } from "./enrich-notice.js";
import { inferIndustriesFromText } from "./industries.js";
import { scrapeAllSources } from "./scrape.js";
import { summarizeToBlogPost } from "./summarize.js";
import type { BlogPost, RawNotice, SourceHealth } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.resolve(__dirname, "../data/content-machine-state.json");

export type MachineState = {
  lastRunAt: string | null;
  lastOkAt: string | null;
  lastError: string | null;
  lastPublishedIds: string[];
  lastTitles: string[];
  runsToday: number;
  publishedToday: number;
  dayKey: string;
  totalRuns: number;
  totalPublished: number;
};

export type MachineRunResult = {
  ok: boolean;
  scraped: number;
  candidates: number;
  summarized: number;
  published: number;
  skippedLowValue: number;
  skippedLowQuality: number;
  titles: string[];
  health: SourceHealth[];
  reason?: string;
  nextHint: string;
};

function envNum(key: string, fallback: number): number {
  const n = Number(process.env[key]);
  return Number.isFinite(n) ? n : fallback;
}

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function loadState(): MachineState {
  const today = dayKey();
  const blank: MachineState = {
    lastRunAt: null,
    lastOkAt: null,
    lastError: null,
    lastPublishedIds: [],
    lastTitles: [],
    runsToday: 0,
    publishedToday: 0,
    dayKey: today,
    totalRuns: 0,
    totalPublished: 0,
  };
  try {
    if (!fs.existsSync(statePath)) return blank;
    const s = JSON.parse(fs.readFileSync(statePath, "utf8")) as MachineState;
    if (s.dayKey !== today) {
      return { ...s, dayKey: today, runsToday: 0, publishedToday: 0 };
    }
    return { ...blank, ...s };
  } catch {
    return blank;
  }
}

function saveState(s: MachineState): void {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

export function getMachineState(): MachineState {
  return loadState();
}

function isJunkNotice(n: RawNotice): boolean {
  const t = `${n.title} ${n.rawSubject}`.trim();
  if (t.length < 18) return true;
  if (/^download\b/i.test(t)) return true;
  if (/type\s*:\s*pdf/i.test(t)) return true;
  if (/view\s*link/i.test(t)) return true;
  if (/click here/i.test(t)) return true;
  return false;
}

/** Score how useful this notice is for Neo’s clients / SEO blog. */
export function noticeNeedScore(n: RawNotice): number {
  if (isJunkNotice(n)) return 0;
  let score = 20;
  const blob = `${n.title} ${n.rawSubject}`.toLowerCase();
  const industries = inferIndustriesFromText(blob);
  const neoSpecific = industries.filter((i) => i !== "general-trade");
  score += neoSpecific.length * 18;
  if (neoSpecific.length === 0) score += 5; // general trade still ok, lower priority

  // High-intent customs keywords importers actually search
  const boosters = [
    /\b(duty|igst|bcd|exemption|notification|circular|ftp|dgft|aeo|icegate|bill of entry|shipping bill|fumigation|phytosanitary|anti[- ]dumping|safeguard|coo|certificate of origin|trq|cepa|import policy|export policy)\b/i,
  ];
  for (const re of boosters) {
    if (re.test(blob)) score += 15;
  }

  // Prefer fresher notices
  const ageDays = Math.max(
    0,
    (Date.now() - Date.parse(n.publishedAt || "")) / (1000 * 60 * 60 * 24)
  );
  if (Number.isFinite(ageDays)) {
    if (ageDays <= 7) score += 20;
    else if (ageDays <= 30) score += 10;
    else if (ageDays <= 90) score += 3;
    else score -= 15;
  }

  if (n.source === "dgft" || n.source === "cbic") score += 8;
  return score;
}

function titleTooSimilar(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3);
  const A = new Set(norm(a));
  const B = norm(b);
  if (!A.size || !B.length) return false;
  const overlap = B.filter((w) => A.has(w)).length;
  return overlap / Math.max(A.size, B.length) >= 0.72;
}

function alreadyCovered(notice: RawNotice, existing: BlogPost[]): boolean {
  if (existing.some((p) => p.id === notice.id)) return true;
  return existing.some(
    (p) =>
      titleTooSimilar(p.title, notice.title) ||
      titleTooSimilar(p.title, notice.rawSubject) ||
      (p.noticeNo && notice.noticeNo && p.noticeNo === notice.noticeNo)
  );
}

function autoPublishEnabled(): boolean {
  const mode = (process.env.DIGEST_PUBLISH_MODE || "draft").toLowerCase();
  return mode === "auto" || mode === "published" || process.env.DIGEST_AUTO_MACHINE === "true";
}

async function maybeNotifyPublished(posts: BlogPost[]): Promise<void> {
  if (!posts.length) return;
  const to = process.env.LEAD_NOTIFY_EMAIL || process.env.DIGEST_NOTIFY_EMAIL || "";
  if (!to || !process.env.SMTP_HOST) {
    console.log(
      `[content-machine] published ${posts.length} post(s) (email skipped — no SMTP). Titles:\n` +
        posts.map((p) => `  • ${p.title}`).join("\n")
    );
    return;
  }
  try {
    const { default: nodemailer } = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "Neo Digest <noreply@neologistics.org>",
      to,
      subject: `Neo blog auto-published ${posts.length} customs update(s)`,
      text: posts
        .map(
          (p) =>
            `${p.title}\n${p.excerpt}\nIndustries: ${p.industries.join(", ")}\nOfficial: ${p.sourceUrl}\n`
        )
        .join("\n---\n"),
    });
  } catch (err) {
    console.warn("[content-machine] notify failed", err);
  }
}

/**
 * One full content-machine cycle.
 */
export async function runContentMachine(opts?: {
  maxNew?: number;
  force?: boolean;
}): Promise<MachineRunResult> {
  const state = loadState();
  const maxNew = opts?.maxNew ?? envNum("DIGEST_MAX_NEW", 5);
  const maxPerDay = envNum("DIGEST_MAX_PUBLISH_PER_DAY", 5);
  const minNeed = envNum("DIGEST_MIN_NEED_SCORE", 45);
  const minQuality = envNum(
    "DIGEST_AUTO_PUBLISH_MIN_QUALITY",
    envNum("DIGEST_APPROVE_MIN_QUALITY", 70)
  );
  const minChannels = envNum("DIGEST_MIN_OK_CHANNELS", 2);
  const doAuto = autoPublishEnabled();

  state.lastRunAt = new Date().toISOString();
  state.totalRuns += 1;
  state.runsToday += 1;

  if (!opts?.force && state.publishedToday >= maxPerDay) {
    const result: MachineRunResult = {
      ok: true,
      scraped: 0,
      candidates: 0,
      summarized: 0,
      published: 0,
      skippedLowValue: 0,
      skippedLowQuality: 0,
      titles: [],
      health: [],
      reason: `Daily publish cap reached (${maxPerDay}). Will resume tomorrow.`,
      nextHint: "Content machine paces posts so the blog stays useful, not spammy.",
    };
    state.lastError = null;
    saveState(state);
    return result;
  }

  const bundle = await scrapeAllSources(18);
  if (bundle.okChannels < minChannels) {
    const msg = `Reliability gate: ${bundle.okChannels}/${bundle.totalChannels} channels OK (need ≥${minChannels})`;
    state.lastError = msg;
    saveState(state);
    return {
      ok: false,
      scraped: bundle.notices.length,
      candidates: 0,
      summarized: 0,
      published: 0,
      skippedLowValue: 0,
      skippedLowQuality: 0,
      titles: [],
      health: bundle.health,
      reason: msg,
      nextHint: "Check CBIC/DGFT site availability; machine will retry next cycle.",
    };
  }

  const existing = loadBlogPosts();
  const scored = bundle.notices
    .map((n) => ({ n, need: noticeNeedScore(n) }))
    .filter(({ n, need }) => need >= minNeed && !alreadyCovered(n, existing))
    .sort((a, b) => b.need - a.need);

  const skippedLowValue = bundle.notices.length - scored.length;
  const room = Math.max(0, maxPerDay - state.publishedToday);
  const pick = scored.slice(0, Math.min(maxNew, room || maxNew));

  if (!pick.length) {
    state.lastOkAt = new Date().toISOString();
    state.lastError = null;
    state.lastTitles = [];
    saveState(state);
    return {
      ok: true,
      scraped: bundle.notices.length,
      candidates: 0,
      summarized: 0,
      published: 0,
      skippedLowValue,
      skippedLowQuality: 0,
      titles: [],
      health: bundle.health,
      reason: "No high-value new notices to post right now (working as designed).",
      nextHint: "Machine only posts when CBIC/DGFT drops something Neo clients should care about.",
    };
  }

  const drafted: BlogPost[] = [];
  let skippedLowQuality = 0;

  for (const { n, need } of pick) {
    const bodyText = await fetchNoticeBodyText(n.sourceUrl);
    const enriched: RawNotice = { ...n, bodyText: bodyText || undefined };
    console.log(
      `[content-machine] drafting need=${need} · ${n.source} · ${n.noticeNo} · body=${bodyText ? bodyText.length : 0}c`
    );
    const post = await summarizeToBlogPost(enriched);

    // Prefer Neo-relevant industries for auto-publish
    const neoHit = post.industries.some((i) => i !== "general-trade");
    const publishFloor = neoHit ? minQuality : minQuality + 10;

    if (post.engine !== "ai" || post.qualityScore < publishFloor) {
      skippedLowQuality += 1;
      // Keep as draft for ops if not auto, or if weak AI
      if (!doAuto || post.qualityScore >= 40) {
        drafted.push({
          ...post,
          status: "draft",
          reviewedBy: undefined,
          reviewedAt: undefined,
        });
      }
      continue;
    }

    if (doAuto) {
      drafted.push({
        ...post,
        status: "published",
        reviewedAt: new Date().toISOString(),
        reviewedBy: "content-machine",
      });
    } else {
      drafted.push({ ...post, status: "draft" });
    }
  }

  upsertPosts(drafted);
  const publishedNow = drafted.filter((p) => p.status === "published");
  state.publishedToday += publishedNow.length;
  state.totalPublished += publishedNow.length;
  state.lastPublishedIds = publishedNow.map((p) => p.id);
  state.lastTitles = publishedNow.map((p) => p.title);
  state.lastOkAt = new Date().toISOString();
  state.lastError = null;
  saveState(state);

  await maybeNotifyPublished(publishedNow);

  const stats = blogStats();
  return {
    ok: true,
    scraped: bundle.notices.length,
    candidates: pick.length,
    summarized: drafted.length,
    published: publishedNow.length,
    skippedLowValue,
    skippedLowQuality,
    titles: drafted.map(
      (p) => `[${p.status}/${p.engine}/q${p.qualityScore}] ${p.title}`
    ),
    health: bundle.health,
    nextHint: `Blog now has ${stats.byStatus.published} published posts. Machine posts only when value is clear.`,
  };
}

/** Publish any leftover high-quality drafts (one-time catch-up). */
export function autoPromoteDrafts(): number {
  if (!autoPublishEnabled()) return 0;
  const minQ = envNum("DIGEST_AUTO_PUBLISH_MIN_QUALITY", 70);
  const drafts = listBlogPosts({ status: "draft", limit: 100 });
  let n = 0;
  for (const d of drafts) {
    if (d.engine === "ai" && d.qualityScore >= minQ) {
      setPostStatus(d.id, "published", "content-machine");
      n += 1;
    }
  }
  return n;
}
