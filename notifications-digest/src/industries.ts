import type { NeoIndustry } from "./types.js";

/** Canonical Neo industries for tagging AI output */
export const NEO_INDUSTRIES: NeoIndustry[] = [
  "cashew",
  "steel",
  "chemicals",
  "automobiles",
  "mining",
  "textiles",
  "agro",
  "seafood",
  "cement",
  "sanitary-wares",
  "industrial-raw-materials",
  "general-trade",
];

export const INDUSTRY_LABELS: Record<NeoIndustry, string> = {
  cashew: "Cashew",
  steel: "Steel",
  chemicals: "Chemicals",
  automobiles: "Automobiles",
  mining: "Mining",
  textiles: "Textiles",
  agro: "Agro products",
  seafood: "Seafood / aquatic",
  cement: "Cement",
  "sanitary-wares": "Sanitary wares",
  "industrial-raw-materials": "Industrial raw materials",
  "general-trade": "General trade / all clients",
};

const KEYWORD_MAP: Array<{ industry: NeoIndustry; re: RegExp }> = [
  { industry: "cashew", re: /\bcashew\b/i },
  { industry: "seafood", re: /\b(shrimp|prawn|seafood|aquatic|fish|marine\s+product)\b/i },
  {
    industry: "steel",
    re: /\b(steel|hrc|crc|iron\s+or\s+steel|flat.?rolled|billet|ferro|aluminium|aluminum|copper|chapter\s*7[24-6])\b/i,
  },
  { industry: "cement", re: /\b(cement|clinker)\b/i },
  {
    industry: "chemicals",
    re: /\b(chemical|polymer|plastic|resin|methanol|acid|pharma|drug|fertilizer)\b/i,
  },
  {
    industry: "automobiles",
    re: /\b(vehicle|automobile|motor\s+vehicle|LCV|EV|auto\s+part|tyre|tire)\b/i,
  },
  { industry: "mining", re: /\b(ore|mining|mineral|coal|bauxite|iron\s+ore)\b/i },
  { industry: "textiles", re: /\b(textile|cotton|apparel|garment|fabric|yarn|silk)\b/i },
  {
    industry: "agro",
    re: /\b(agro|agriculture|spice|pepper|coffee|tea|rubber|rice|wheat|pulse|edible\s+oil)\b/i,
  },
  { industry: "sanitary-wares", re: /\b(sanitary|ceramic\s+ware|wash\s+basin|toilet)\b/i },
  {
    industry: "industrial-raw-materials",
    re: /\b(raw\s+material|industrial\s+input|primary\s+form|gold|precious\s+metal|TRQ|epcg)\b/i,
  },
];

export function inferIndustriesFromText(text: string): NeoIndustry[] {
  const hits = new Set<NeoIndustry>();
  for (const { industry, re } of KEYWORD_MAP) {
    if (re.test(text)) hits.add(industry);
  }
  if (!hits.size) hits.add("general-trade");
  return [...hits];
}

export function normalizeIndustries(raw: string[]): NeoIndustry[] {
  const set = new Set<NeoIndustry>();
  for (const r of raw) {
    const key = r.toLowerCase().replace(/\s+/g, "-") as NeoIndustry;
    if (NEO_INDUSTRIES.includes(key)) set.add(key);
  }
  if (!set.size) set.add("general-trade");
  return [...set];
}
