/**
 * Build India-first ITC-HS / CTH index (8-digit national lines).
 * Source: data/india-itc-hs.json (India tariff lines + export policy tags).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExportPolicy, HsEntry } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const indiaPath = path.join(dataDir, "india-itc-hs.json");
const outPath = path.join(dataDir, "hs-index.json");

type RawRow = {
  hs_code: string;
  description: string;
  chapter?: string;
  heading?: string;
  subheading?: string;
  keywords?: string[];
  common_products?: string[];
  synonyms?: string[];
  export_policy?: string;
};

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "other",
  "than",
  "not",
  "whether",
  "including",
  "excluding",
  "thereof",
  "herein",
  "into",
  "onto",
  "used",
  "made",
]);

function digits(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

function formatIndia(code: string): string {
  const c = digits(code);
  if (c.length === 8) return `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6)}`;
  if (c.length === 6) return `${c.slice(0, 4)}.${c.slice(4)}`;
  return c;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s%-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function toPolicy(p?: string): ExportPolicy {
  if (p === "Free" || p === "Restricted" || p === "Prohibited") return p;
  return "Unknown";
}

function main() {
  if (!fs.existsSync(indiaPath)) {
    console.error("Missing India ITC-HS source:", indiaPath);
    process.exit(1);
  }

  const rows = JSON.parse(fs.readFileSync(indiaPath, "utf8")) as RawRow[];
  const byDigits = new Map<string, RawRow>();
  for (const r of rows) {
    const d = digits(r.hs_code);
    if (!d) continue;
    byDigits.set(d, r);
  }

  const chapters = [...byDigits.entries()]
    .filter(([d]) => d.length === 2)
    .map(([d, r]) => ({
      code: d,
      section: "",
      description: r.description,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  // Prefer genuine chapter rows; if missing (rare), synthesize from first line
  if (chapters.length < 90) {
    const seen = new Set(chapters.map((c) => c.code));
    for (const [d, r] of byDigits) {
      if (d.length < 2) continue;
      const ch = d.slice(0, 2);
      if (seen.has(ch)) continue;
      chapters.push({
        code: ch,
        section: "",
        description: r.chapter ? `Chapter ${ch}` : r.description.slice(0, 80),
      });
      seen.add(ch);
    }
    chapters.sort((a, b) => a.code.localeCompare(b.code));
  }

  const chapterDesc = new Map(chapters.map((c) => [c.code, c.description]));

  const eightDigit = [...byDigits.entries()]
    .filter(([d]) => d.length === 8)
    .sort(([a], [b]) => a.localeCompare(b));

  const indexed = eightDigit.map(([code, r]) => {
    const hs6 = code.slice(0, 6);
    const heading4 = code.slice(0, 4);
    const parent6 = byDigits.get(hs6);
    const parent4 = byDigits.get(heading4);
    const ch = code.slice(0, 2);
    const headingDescription = parent6?.description ?? parent4?.description ?? "";
    const chapterDescription = chapterDesc.get(ch) ?? "";
    const entry: HsEntry = {
      code,
      dotted: formatIndia(code),
      section: "",
      chapter: ch,
      heading: heading4,
      hs6,
      description: r.description,
      headingDescription,
      chapterDescription,
      exportPolicy: toPolicy(r.export_policy),
    };
    const searchBlob = [
      r.description,
      ...(r.keywords ?? []),
      ...(r.common_products ?? []),
      ...(r.synonyms ?? []),
      headingDescription,
      chapterDescription,
    ].join(" ");
    return { entry, searchBlob };
  });

  const inv: Record<string, string[]> = {};
  for (const { entry, searchBlob } of indexed) {
    const tokens = new Set(tokenize(searchBlob));
    for (const t of tokens) {
      if (!inv[t]) inv[t] = [];
      inv[t]!.push(entry.code);
    }
  }

  const finalEntries = indexed.map((x) => x.entry);
  const codeToIdx = new Map(finalEntries.map((e, i) => [e.code, i]));
  const inverted: Record<string, number[]> = {};
  for (const [token, codes] of Object.entries(inv)) {
    const idxs = [
      ...new Set(codes.map((c) => codeToIdx.get(c)!).filter((i) => i !== undefined)),
    ];
    if (idxs.length && idxs.length < 1200) inverted[token] = idxs;
  }

  const payload = {
    meta: {
      source: "India ITC-HS / CTH 8-digit tariff lines (vendored india-itc-hs.json)",
      market: "India",
      generatedAt: new Date().toISOString(),
      totals: {
        all: rows.length,
        chapters: chapters.length,
        headings: [...byDigits.keys()].filter((d) => d.length === 4).length,
        subheadings: finalEntries.length,
        hs6Parents: [...byDigits.keys()].filter((d) => d.length === 6).length,
      },
      indiaNote:
        "Results are India Customs Tariff (CTH) / ITC-HS style most-likely 8-digit recommendations for educational use. " +
        "Basic Customs Duty, IGST, cess, notifications, and DGFT import/export policy change frequently — " +
        "confirm on ICEGATE / CBIC / DGFT and with Neo’s licensed CHA before filing a Bill of Entry or Shipping Bill.",
    },
    chapters,
    entries: finalEntries,
    inverted,
  };

  fs.writeFileSync(outPath, JSON.stringify(payload));
  console.log(
    `India index: ${finalEntries.length} CTH-8 lines · ${chapters.length} chapters · ${Object.keys(inverted).length} tokens`
  );
  console.log(`→ ${outPath} (${(fs.statSync(outPath).size / 1024 / 1024).toFixed(2)} MB)`);
}

main();
