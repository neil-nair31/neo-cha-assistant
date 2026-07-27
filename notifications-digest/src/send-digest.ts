/**
 * CLI: email latest blog posts to subscribers.
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listBlogPosts } from "./blog-store.js";
import { sendDigestToSubscribers } from "./notify.js";
import { listActiveSubscribers } from "./subscribers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

async function main() {
  const posts = listBlogPosts({ limit: 5 });
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
  console.log(`Sending ${items.length} posts to ${subs.length} subscriber(s)…`);
  if (!subs.length) {
    console.log("No active subscribers.");
    process.exit(0);
  }
  console.log(await sendDigestToSubscribers(items, subs));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
