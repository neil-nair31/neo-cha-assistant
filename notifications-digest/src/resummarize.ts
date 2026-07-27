/**
 * Re-write published posts with the editorial Trade Briefing voice.
 * Usage: npm run resummarize -w @neo-cha/notifications-digest
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { loadBlogPosts, saveBlogPosts, blogStats } from "./blog-store.js";
import { fetchNoticeBodyText } from "./enrich-notice.js";
import { summarizeToBlogPost } from "./summarize.js";
import type { RawNotice } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

async function main() {
  const limit = Number(process.env.DIGEST_RESUMMARIZE_LIMIT ?? 21);
  const all = loadBlogPosts();
  const posts = all.slice(0, limit);
  console.log(`Re-writing ${posts.length} posts in Trade Briefing voice…`);

  const upgraded = [];
  for (const p of posts) {
    const bodyText = await fetchNoticeBodyText(p.sourceUrl);
    const notice: RawNotice = {
      id: p.id,
      source: p.source,
      noticeNo: p.noticeNo,
      title: p.title,
      publishedAt: p.publishedAt,
      sourceUrl: p.sourceUrl,
      rawSubject: p.excerpt || p.title,
      channel: p.channel || p.source,
      bodyText: bodyText || undefined,
    };
    try {
      const next = await summarizeToBlogPost(notice);
      if (next.engine !== "ai" || next.qualityScore < 55) {
        console.warn(`  KEEP old  q${next.qualityScore}  ${p.title.slice(0, 60)}`);
        upgraded.push(p);
        continue;
      }
      upgraded.push({
        ...next,
        status: "published" as const,
        reviewedAt: new Date().toISOString(),
        reviewedBy: "editorial-rewrite",
      });
      console.log(`  OK  [q${next.qualityScore}] ${next.title.slice(0, 80)}`);
    } catch (err) {
      console.warn(`  FAIL ${p.id}`, err instanceof Error ? err.message : err);
      upgraded.push(p);
    }
  }

  const byId = new Map(loadBlogPosts().map((x) => [x.id, x]));
  for (const p of upgraded) byId.set(p.id, p);
  saveBlogPosts([...byId.values()]);

  const stats = blogStats();
  console.log(
    `Done. published=${stats.byStatus.published} ai=${stats.byEngine.ai} avgQ=${stats.avgQuality}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
