import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { HsChapter, HsEntry } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, "../data/hs-index.json");

type IndexFile = {
  meta: {
    source: string;
    market?: string;
    generatedAt: string;
    totals: {
      all: number;
      chapters: number;
      headings: number;
      subheadings: number;
      hs6Parents?: number;
    };
    indiaNote: string;
  };
  chapters: HsChapter[];
  entries: HsEntry[];
  inverted: Record<string, number[]>;
};

let index: IndexFile | null = null;

export function getIndex(): IndexFile {
  if (index) return index;
  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `HS index missing at ${indexPath}. Run: npm run build-index -w @neo-cha/hs-lookup`
    );
  }
  index = JSON.parse(fs.readFileSync(indexPath, "utf8")) as IndexFile;
  return index;
}

/** Clear cached index (tests / rebuild). */
export function resetIndexCache(): void {
  index = null;
}

export function catalogStats() {
  const idx = getIndex();
  return {
    ...idx.meta.totals,
    source: idx.meta.source,
    market: idx.meta.market ?? "India",
    generatedAt: idx.meta.generatedAt,
    indiaNote: idx.meta.indiaNote,
    tokens: Object.keys(idx.inverted).length,
  };
}

export const DISCLAIMER =
  "Neo HS Finder returns an educational most-likely India CTH / ITC-HS (8-digit) recommendation only. " +
  "It is NOT a binding Customs classification, Bill of Entry / Shipping Bill determination, duty computation, or legal advice. " +
  "BCD, IGST, compensation cess, FTP/DGFT restrictions, and CBIC notifications change over time — verify on ICEGATE and with Neo Logistics’ licensed CHA (Cochin / Chennai) before filing. " +
  "Importer / exporter remains responsible under self-assessment.";

export const DUTY_NOTE =
  "This tool does not quote live Basic Customs Duty or IGST. Tariff rates require the current CBIC Customs Tariff + applicable notifications (and exemptions) as on the date of import/export.";

export function formatCode(code: string): string {
  const c = code.replace(/\D/g, "");
  if (c.length === 8) return `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6)}`;
  if (c.length === 6) return `${c.slice(0, 4)}.${c.slice(4)}`;
  if (c.length === 4) return c;
  return c;
}
