import { upsertPosts, loadBlogPosts, blogStats } from "./blog-store.js";
import { scrapeAllSources } from "./scrape.js";
import { summarizeToBlogPost } from "./summarize.js";
import type { SourceHealth } from "./types.js";

export type ScanResult = {
  scraped: number;
  newSummarized: number;
  added: number;
  updated: number;
  total: number;
  drafts: number;
  published: number;
  titles: string[];
  health: SourceHealth[];
  okChannels: number;
  totalChannels: number;
  minChannelsRequired: number;
  reliable: boolean;
};

function minChannelsRequired(): number {
  return Number(process.env.DIGEST_MIN_OK_CHANNELS ?? 2);
}

export async function runScan(maxNew = Number(process.env.DIGEST_MAX_NEW ?? 5)): Promise<ScanResult> {
  const minOk = minChannelsRequired();
  const bundle = await scrapeAllSources(15);

  if (bundle.okChannels < minOk) {
    throw new Error(
      `Reliability gate failed: only ${bundle.okChannels}/${bundle.totalChannels} channels OK (need ≥${minOk}). ` +
        bundle.health.map((h) => `${h.channel}:${h.ok ? h.count : h.error}`).join(" | ")
    );
  }

  const existing = new Set(loadBlogPosts().map((p) => p.id));
  const fresh = bundle.notices.filter((n) => !existing.has(n.id)).slice(0, maxNew);

  if (!fresh.length) {
    const stats = blogStats();
    return {
      scraped: bundle.notices.length,
      newSummarized: 0,
      added: 0,
      updated: 0,
      total: stats.total,
      drafts: stats.byStatus.draft,
      published: stats.byStatus.published,
      titles: [],
      health: bundle.health,
      okChannels: bundle.okChannels,
      totalChannels: bundle.totalChannels,
      minChannelsRequired: minOk,
      reliable: true,
    };
  }

  const posts = [];
  for (const n of fresh) {
    // Small pacing to reduce Gemini 429s
    posts.push(await summarizeToBlogPost(n));
  }

  // Drop very low-quality junk even as drafts
  const usable = posts.filter((p) => p.qualityScore >= Number(process.env.DIGEST_MIN_QUALITY ?? 35));
  const result = upsertPosts(usable);
  const stats = blogStats();

  return {
    scraped: bundle.notices.length,
    newSummarized: usable.length,
    added: result.added,
    updated: result.updated,
    total: result.total,
    drafts: stats.byStatus.draft,
    published: stats.byStatus.published,
    titles: usable.map((p) => `[${p.status}/${p.engine}/q${p.qualityScore}] ${p.title}`),
    health: bundle.health,
    okChannels: bundle.okChannels,
    totalChannels: bundle.totalChannels,
    minChannelsRequired: minOk,
    reliable: true,
  };
}
