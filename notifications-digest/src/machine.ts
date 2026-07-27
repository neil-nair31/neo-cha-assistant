/**
 * Daily / on-demand content machine CLI.
 * Usage: npm run machine -w @neo-cha/notifications-digest
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { autoPromoteDrafts, runContentMachine } from "./content-machine.js";
import { blogStats } from "./blog-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

async function main() {
  console.log("=== Neo AI Customs Content Machine ===");
  console.log(`Publish mode: ${process.env.DIGEST_PUBLISH_MODE || "draft"}`);
  const promoted = autoPromoteDrafts();
  if (promoted) console.log(`Promoted ${promoted} existing high-quality draft(s)`);
  const result = await runContentMachine({ force: true });
  console.log(JSON.stringify(result, null, 2));
  console.log("Blog stats:", blogStats());
  if (!result.ok) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
