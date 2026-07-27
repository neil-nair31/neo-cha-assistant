/**
 * Neo Logistics CHA desk filing precedents (Cochin / Chennai).
 * Sourced from Neo’s HR/HS codes workbook — used to pin authentic CTH picks.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { TradeFlow } from "./types.js";

export type NeoDeskPrecedent = {
  sl: number;
  tradeFlow: "import" | "export";
  goods: string;
  code: string;
  ports: string[];
  /** Lowercase phrases that identify this desk line in a query */
  matchTerms: string[];
};

type JsonFile = {
  source: string;
  rows: Array<{
    sl: number;
    tradeFlow: "import" | "export";
    goods: string;
    code: string;
    ports: string[];
  }>;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.resolve(__dirname, "../data/neo-desk-hs-codes.json");

/** Extra match phrases beyond the goods label (trade slang → Neo desk line). */
const EXTRA_TERMS: Record<string, string[]> = {
  "25231000": ["white cement clinker", "cement clinker", "clinker"],
  "28291100": ["sodium chlorate"],
  "47010000": ["hydrafiber", "hydra fiber", "mechanical wood pulp"],
  "25221000": ["quick lime", "quicklime"],
  "25202010": ["gypsum plaster", "plaster of paris", "calcined gypsum"],
  "39052100": [
    "vae dispersion",
    "vae polymer",
    "vinyl acetate copolymer",
    "vinyl acetate dispersion",
    "vae for paint",
  ],
  "32061110": ["titanium dioxide", "tio2", "ti02"],
  "08013100": ["dried raw cashew", "raw cashew nuts", "cashew in shell", "rcn"],
  "69101000": ["ceramic wash basin", "porcelain wash basin", "china wash basin"],
  "39222000": ["toilet seat cover", "lavatory seat", "plastic toilet seat"],
  "47032100": ["bleached softwood kraft", "bleached kraft pulp", "bleached coniferous pulp"],
  "47031100": ["unbleached softwood kraft", "unbleached kraft pulp", "unbleached coniferous pulp"],
  "48025790": ["wood free printing paper", "woodfree printing paper", "printing paper in sheets"],
  "57033100": ["artificial grass", "artificial turf", "synthetic turf"],
  "70099100": ["unframed glass mirror", "unframed mirror", "glass mirror"],
  "94037000": ["bathroom cabinet", "plastic bathroom cabinet"],
  "39211200": ["pvc foam board", "pvc foam sheet", "cellular pvc board"],
  "25232100": ["white portland cement", "white cement"],
  "08013220": ["cashew kernels", "cashew kernel", "shelled cashew", "w320", "w240", "w180"],
  "53050040": ["coco peat", "coir pith", "cocopeat"],
  "52061200": ["cotton yarn"],
  "31010099": ["vermi compost", "vermicompost", "vermi-compost"],
  "73030030": ["spun pipes", "cast iron spun pipe", "ci spun pipe"],
  "40169340": ["gasket", "rubber gasket"],
  "34039900": ["lubricant for pipe gasket", "pipe gasket lubricant", "gasket lubricant"],
};

function goodsTerms(goods: string): string[] {
  const cleaned = goods
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = cleaned.split(" ").filter((t) => t.length > 2);
  const phrases: string[] = [cleaned];
  if (parts.length >= 2) phrases.push(parts.slice(0, 2).join(" "));
  if (parts.length >= 3) phrases.push(parts.slice(0, 3).join(" "));
  return [...new Set(phrases)];
}

let cached: NeoDeskPrecedent[] | null = null;

export function getNeoDeskPrecedents(): NeoDeskPrecedent[] {
  if (cached) return cached;
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as JsonFile;
  cached = raw.rows.map((r) => {
    const code = r.code.replace(/\D/g, "").slice(0, 8);
    return {
      sl: r.sl,
      tradeFlow: r.tradeFlow,
      goods: r.goods.trim(),
      code,
      ports: r.ports,
      matchTerms: [...new Set([...goodsTerms(r.goods), ...(EXTRA_TERMS[code] ?? [])])],
    };
  });
  return cached;
}

export type NeoDeskMatch = {
  precedent: NeoDeskPrecedent;
  score: number;
};

function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s%-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Score Neo desk precedents against a goods query.
 * Strong matches (≥8) are treated as authentic desk pins.
 */
export function matchNeoDeskPrecedents(
  query: string,
  tradeFlow?: TradeFlow
): NeoDeskMatch[] {
  const ql = normalizeQuery(query);
  if (!ql) return [];

  const out: NeoDeskMatch[] = [];
  for (const p of getNeoDeskPrecedents()) {
    let score = 0;
    for (const term of p.matchTerms) {
      if (!term || term.length < 3) continue;
      if (ql.includes(term)) {
        // Longer, more specific phrases win harder
        score += Math.min(14, 4 + Math.floor(term.length / 3));
      }
    }

    // Prefer matching import/export when caller stated it
    if (tradeFlow && tradeFlow !== "either") {
      if (tradeFlow === p.tradeFlow) score += 2;
      else score -= 1;
    }

    // Avoid white cement vs white cement clinker confusion
    if (p.code === "25232100" && /\bclinker\b/.test(ql)) score -= 8;
    if (p.code === "25231000" && /\bclinker\b/.test(ql)) score += 6;
    if (p.code === "25232100" && /\bwhite\b/.test(ql) && /\bcement\b/.test(ql) && !/\bclinker\b/.test(ql)) {
      score += 4;
    }

    // Cashew: kernels vs in-shell
    if (p.code === "08013220" && /\b(in\s+shell|raw\s+cashew|rcn)\b/.test(ql) && !/\bkernel/.test(ql)) {
      score -= 10;
    }
    if (p.code === "08013100" && /\b(kernel|shelled|w\d{3})\b/.test(ql)) {
      score -= 10;
    }

    // Kraft pulp bleached vs unbleached
    if (p.code === "47032100" && /\bunbleached\b/.test(ql)) score -= 8;
    if (p.code === "47031100" && /\bbleached\b/.test(ql) && !/\bunbleached\b/.test(ql)) score -= 8;

    if (score >= 5) out.push({ precedent: p, score });
  }

  return out.sort((a, b) => b.score - a.score);
}

/** Strong enough to pin as Neo desk primary (not just a soft boost). */
export function strongNeoDeskMatch(
  query: string,
  tradeFlow?: TradeFlow
): NeoDeskMatch | null {
  const matches = matchNeoDeskPrecedents(query, tradeFlow);
  const top = matches[0];
  if (!top || top.score < 8) return null;
  const second = matches[1];
  if (second && top.score - second.score < 2 && top.precedent.code !== second.precedent.code) {
    // Ambiguous between two Neo lines — don't hard-pin
    return null;
  }
  return top;
}

export function formatNeoDeskPromptBlock(
  query: string,
  tradeFlow?: TradeFlow
): string {
  const matches = matchNeoDeskPrecedents(query, tradeFlow).slice(0, 5);
  if (!matches.length) {
    return `NEO DESK FILING PRECEDENTS: none of the ${getNeoDeskPrecedents().length} Neo Cochin/Chennai desk lines strongly match this goods description. Classify from candidates using GRI only.`;
  }
  const lines = matches.map(
    (m) =>
      `- ${m.precedent.code} | ${m.precedent.tradeFlow.toUpperCase()} | ${m.precedent.goods} | ports: ${m.precedent.ports.join(", ")} | matchScore=${m.score}`
  );
  return `NEO DESK FILING PRECEDENTS (authoritative — Neo has filed these goods under these India CTHs at Cochin/Chennai):
${lines.join("\n")}
If a precedent clearly matches the goods, prefer that 8-digit code as primaryCode when it appears in CANDIDATES. Cite that it aligns with Neo desk filing practice.`;
}

export function neoDeskWhy(match: NeoDeskMatch): string {
  const p = match.precedent;
  const ports = p.ports.join(" / ");
  return (
    `Aligned with Neo Logistics CHA desk filing precedent for “${p.goods}” ` +
    `(${p.tradeFlow.toUpperCase()} at ${ports}) under India CTH ${p.code.slice(0, 4)}.${p.code.slice(4, 6)}.${p.code.slice(6)}. ` +
    `Confirm invoice wording and specs with Neo before Bill of Entry / Shipping Bill.`
  );
}
