/**
 * Refresh India ITC-HS source JSON, then rebuild the searchable index.
 *
 * Default source: community-maintained India ITC-HS style dump (same lineage as india-itc-hs.json).
 * Override with INDIA_ITC_HS_URL if Neo IT points at a licensed / internal feed later.
 *
 * Usage:
 *   npm run refresh-india -w @neo-cha/hs-lookup
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const outPath = path.join(dataDir, "india-itc-hs.json");
const metaPath = path.join(dataDir, "india-itc-hs.meta.json");

const DEFAULT_URL =
  process.env.INDIA_ITC_HS_URL ||
  "https://raw.githubusercontent.com/AryanBV/hs-code-classifier/main/data/hs_codes_clean.json";

async function main() {
  console.log("Fetching India ITC-HS source…");
  console.log("URL:", DEFAULT_URL);

  const res = await fetch(DEFAULT_URL);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || data.length < 1000) {
    throw new Error("Downloaded JSON does not look like an ITC-HS array");
  }

  // Backup previous file
  if (fs.existsSync(outPath)) {
    const bak = path.join(dataDir, `india-itc-hs.backup-${Date.now()}.json`);
    fs.copyFileSync(outPath, bak);
    console.log("Backed up previous source →", bak);
  }

  fs.writeFileSync(outPath, JSON.stringify(data));
  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        sourceUrl: DEFAULT_URL,
        rowCount: data.length,
        note:
          "Export-policy tags and tariff lines should be spot-checked against DGFT / CBIC before relying on them in client work. Rebuild index after refresh.",
      },
      null,
      2
    )
  );

  console.log(`Wrote ${data.length} rows → ${outPath}`);
  console.log("Rebuilding index…");
  execSync("npx tsx src/build-index.ts", {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
  });
  console.log("Done. Run: npm run smoke:hs && npm run audit:hs");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
