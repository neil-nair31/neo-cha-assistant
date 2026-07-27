/**
 * Approve all draft posts above a quality threshold.
 * Usage: npm run approve -w @neo-cha/notifications-digest
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listBlogPosts, setPostStatus, blogStats } from "./blog-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

async function main() {
  const minQ = Number(process.env.DIGEST_APPROVE_MIN_QUALITY ?? 45);
  const drafts = listBlogPosts({ status: "draft", limit: 200 });
  const eligible = drafts.filter((d) => d.qualityScore >= minQ);
  console.log(`Drafts: ${drafts.length} · eligible (q≥${minQ}): ${eligible.length}`);
  for (const d of eligible) {
    setPostStatus(d.id, "published", "cli-approve");
    console.log(`APPROVED  q${d.qualityScore}  ${d.title.slice(0, 90)}`);
  }
  console.log(blogStats());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
