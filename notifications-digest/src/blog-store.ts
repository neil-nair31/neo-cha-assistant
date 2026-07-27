import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BlogPost, PostStatus } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const blogPath = path.join(dataDir, "blog-posts.json");

let cache: BlogPost[] | null = null;

export const DISCLAIMER =
  "AI-generated customs awareness posts for Neo Logistics clients. " +
  "Summaries are educational only — not official CBIC/DGFT text, not duty quotes, not legal advice. " +
  "Always open the official source link and confirm with Neo’s licensed CHA before acting on a shipment.";

export function loadBlogPosts(): BlogPost[] {
  if (cache) return cache;
  if (!fs.existsSync(blogPath)) {
    cache = [];
    return cache;
  }
  const raw = JSON.parse(fs.readFileSync(blogPath, "utf8")) as BlogPost[];
  // Migrate older posts missing new fields
  cache = raw.map((p) => ({
    ...p,
    status: (p.status as PostStatus) || "published",
    engine: p.engine || "fallback",
    qualityScore: typeof p.qualityScore === "number" ? p.qualityScore : 50,
  }));
  return cache;
}

export function resetBlogCache(): void {
  cache = null;
}

function publishedOnly(posts: BlogPost[]): BlogPost[] {
  return posts.filter((p) => p.status === "published");
}

export function saveBlogPosts(posts: BlogPost[]): void {
  fs.mkdirSync(dataDir, { recursive: true });
  const sorted = [...posts].sort((a, b) => {
    const d = b.publishedAt.localeCompare(a.publishedAt);
    if (d !== 0) return d;
    return b.generatedAt.localeCompare(a.generatedAt);
  });
  fs.writeFileSync(blogPath, JSON.stringify(sorted, null, 2));
  cache = sorted;

  // Site sync: published posts only (never leak drafts to public blog)
  const syncPath =
    process.env.NEO_BLOG_SYNC_PATH ||
    path.resolve(__dirname, "../../../connectosWebsite1/neologistics/src/data/blog-posts.json");
  try {
    fs.mkdirSync(path.dirname(syncPath), { recursive: true });
    fs.writeFileSync(syncPath, JSON.stringify(publishedOnly(sorted), null, 2));
    console.log(`[blog] synced published → ${syncPath}`);
  } catch (err) {
    console.warn("[blog] site sync skipped", err);
  }
}

export function upsertPosts(incoming: BlogPost[]): { added: number; updated: number; total: number } {
  const existing = loadBlogPosts();
  const byId = new Map(existing.map((p) => [p.id, p]));
  let added = 0;
  let updated = 0;
  for (const p of incoming) {
    if (!byId.has(p.id)) added++;
    else updated++;
    // Never overwrite a human-reviewed published/rejected post with a fresh draft of same id
    const prev = byId.get(p.id);
    if (prev && (prev.status === "published" || prev.status === "rejected") && prev.reviewedAt) {
      continue;
    }
    byId.set(p.id, p);
  }
  const merged = [...byId.values()];
  saveBlogPosts(merged);
  return { added, updated, total: merged.length };
}

export function listBlogPosts(opts?: {
  q?: string;
  industry?: string;
  source?: string;
  status?: PostStatus | "all";
  limit?: number;
}): BlogPost[] {
  const status = opts?.status ?? "published";
  let items = loadBlogPosts();
  if (status !== "all") items = items.filter((p) => p.status === status);

  const q = opts?.q?.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.industries.some((i) => i.includes(q)) ||
        p.tags.some((t) => t.includes(q)) ||
        p.noticeNo.toLowerCase().includes(q)
    );
  }
  if (opts?.industry) {
    const ind = opts.industry.toLowerCase();
    items = items.filter((p) => p.industries.includes(ind as BlogPost["industries"][number]));
  }
  if (opts?.source) items = items.filter((p) => p.source === opts.source);
  return items.slice(0, Math.min(opts?.limit ?? 50, 200));
}

export function getBlogPost(idOrSlug: string): BlogPost | null {
  return loadBlogPosts().find((p) => p.id === idOrSlug || p.slug === idOrSlug) ?? null;
}

export function setPostStatus(
  id: string,
  status: PostStatus,
  reviewedBy = "ops"
): BlogPost | null {
  const all = loadBlogPosts();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const next = {
    ...all[idx]!,
    status,
    reviewedAt: new Date().toISOString(),
    reviewedBy,
  };
  all[idx] = next;
  saveBlogPosts(all);
  return next;
}

export function blogStats() {
  const posts = loadBlogPosts();
  const byStatus = { draft: 0, published: 0, rejected: 0 };
  const bySource: Record<string, number> = {};
  const byEngine = { ai: 0, fallback: 0 };
  for (const p of posts) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    bySource[p.source] = (bySource[p.source] ?? 0) + 1;
    byEngine[p.engine] = (byEngine[p.engine] ?? 0) + 1;
  }
  return {
    total: posts.length,
    byStatus,
    bySource,
    byEngine,
    avgQuality:
      posts.length === 0
        ? 0
        : Math.round(posts.reduce((s, p) => s + (p.qualityScore || 0), 0) / posts.length),
  };
}
