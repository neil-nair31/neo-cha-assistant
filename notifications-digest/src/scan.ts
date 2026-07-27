/**
 * Daily AI Customs Notifications Digest — enterprise scan CLI.
 * Usage: npm run scan -w @neo-cha/notifications-digest
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runScan } from "./scan-run.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

async function main() {
  console.log("=== Neo AI Customs Digest — enterprise scan ===");
  console.log(`Publish mode: ${process.env.DIGEST_PUBLISH_MODE || "draft"}`);
  const result = await runScan();
  console.log(JSON.stringify(result, null, 2));
  if (!result.reliable) {
    console.error("Scan completed but reliability gate failed.");
    process.exit(1);
  }
  if (!result.newSummarized) {
    console.log("Nothing new.");
  } else {
    console.log(
      `Created ${result.added} item(s). Drafts pending review: ${result.drafts}. Published: ${result.published}.`
    );
    console.log("Approve drafts: POST /api/blog-posts/:id/approve (x-digest-token) or npm run approve:notifications");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
