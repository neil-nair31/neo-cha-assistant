/**
 * Re-score published posts with current filler penalties.
 * Drafts posts that still look ChatGPT-y (score < 55) so they leave the public feed.
 * Usage: npx tsx src/rescore-filler.ts
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { loadBlogPosts, saveBlogPosts, blogStats } from "./blog-store.js";
import type { BlogPost } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function scorePost(post: Omit<BlogPost, "qualityScore">): number {
  let score = 35;
  if (post.title.length >= 28 && post.title.length <= 110) score += 12;
  if (post.excerpt.length >= 60 && post.excerpt.length <= 220) score += 10;
  if (post.body.length >= 320) score += 12;
  if (post.body.length >= 500) score += 8;
  if (post.impact.length >= 50) score += 10;
  if (post.industries.length >= 1 && !post.industries.includes("general-trade")) score += 10;
  if (post.engine === "ai") score += 12;
  if (/^(new|important|latest)\b/i.test(post.title)) score -= 20;
  if (/\b(new dgft|new cbic|important update|what you need to know)\b/i.test(post.title)) score -= 25;
  if (/download|type\s*:\s*pdf/i.test(post.title)) score -= 40;
  if (!/##\s+/m.test(post.body)) score -= 8;
  const blob = `${post.title}\n${post.excerpt}\n${post.body}\n${post.impact}`;
  const filler =
    /\b(learn about|streamline|aren't fully detailed|it's advisable|in today's (?:dynamic )?trade landscape|it is important to note|stakeholders|leverage|delve|comprehensive|robust|stay ahead|navigate the complexities|game.?changer|unlock the potential)\b/i;
  if (filler.test(blob)) score -= 28;
  if (/\b(as an ai|as a language model|hope this helps)\b/i.test(blob)) score -= 40;
  return Math.max(0, Math.min(100, score));
}

const posts = loadBlogPosts();
let drafted = 0;
const next = posts.map((p) => {
  const { qualityScore: _q, ...rest } = p;
  const qualityScore = scorePost(rest);
  if (p.status === "published" && qualityScore < 55) {
    drafted += 1;
    return {
      ...p,
      qualityScore,
      status: "draft" as const,
      reviewedAt: new Date().toISOString(),
      reviewedBy: "filler-rescore",
    };
  }
  return { ...p, qualityScore };
});

saveBlogPosts(next);
const stats = blogStats();
console.log(`Rescored. draftedFiller=${drafted} published=${stats.byStatus.published} avgQ=${stats.avgQuality}`);
