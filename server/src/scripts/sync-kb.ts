import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ingestKnowledge } from "../rag/retrieve.js";
import { getDb } from "../db/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../../");
const manifestPath = path.join(root, "knowledge/sync/manifest.json");
const outDir = path.join(root, "knowledge/synced");

type Source = {
  id: string;
  url: string;
  section: string;
  title: string;
  schedule?: string;
};

function htmlToText(html: string): string {
  const withoutNoise = html
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const raw = withoutNoise
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleanSyncedLines(raw);
}

const NAV_LINE_RE =
  /^(home|about us|industries|our expertise|know your customer|media center|financials|contact us|login|search)$/i;

function isNavOrBreadcrumb(line: string): boolean {
  const l = line.trim();
  if (!l || l.length < 3) return true;
  if (NAV_LINE_RE.test(l)) return true;
  if (/\(current\)/i.test(l) && l.length < 80) return true;
  if (/^home\s*>/i.test(l)) return true;
  if (/^(home|about us|industries|our expertise)(\s*\(current\))?(\s*>\s*)+/i.test(l)) {
    return true;
  }
  return false;
}

function cleanSyncedLines(text: string): string {
  const lines = text
    .split(/\n|\.(?=\s+[A-Z])/)
    .map((l) => l.trim())
    .filter((l) => l.length > 3)
    .filter((l) => !isNavOrBreadcrumb(l));

  const deduped: string[] = [];
  for (const line of lines) {
    if (deduped[deduped.length - 1] === line) continue;
    deduped.push(line);
  }

  return deduped.join("\n\n");
}

async function fetchSource(src: Source): Promise<string> {
  const res = await fetch(src.url, {
    headers: { "User-Agent": "NeoAssist-KB-Sync/1.0 (+https://www.neologistics.org)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${src.url}`);
  const html = await res.text();
  return htmlToText(html);
}

async function main() {
  if (!fs.existsSync(manifestPath)) {
    console.error("Missing manifest:", manifestPath);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    sources: Source[];
  };
  fs.mkdirSync(outDir, { recursive: true });

  const log: string[] = [];
  for (const src of manifest.sources) {
    try {
      const body = await fetchSource(src);
      const md = `---
id: synced-${src.id}
section: ${src.section}
title: ${src.title}
source: ${src.url}
synced_at: ${new Date().toISOString()}
auto_sync: true
---

# ${src.title}

> Auto-synced from Neo's website. Review if layout changes break formatting.

${body.slice(0, 12000)}
`;
      const file = path.join(outDir, `${src.id}.md`);
      fs.writeFileSync(file, md, "utf8");
      log.push(`OK  ${src.id}`);
      console.log(`Synced ${src.url} → ${file}`);
    } catch (err) {
      log.push(`FAIL ${src.id}: ${err instanceof Error ? err.message : err}`);
      console.warn(`Failed ${src.url}:`, err);
    }
  }

  fs.writeFileSync(
    path.join(outDir, "_last-sync.log"),
    `${new Date().toISOString()}\n${log.join("\n")}\n`,
    "utf8"
  );

  getDb();
  const n = ingestKnowledge();
  console.log(`Re-ingested ${n} KB chunks.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
