import { INDIA_ALIASES, INDIA_CHAPTER_HINTS } from "./india-aliases.js";
import { DISCLAIMER, formatCode, getIndex } from "./catalog.js";
import { matchNeoDeskPrecedents } from "./neo-desk-precedents.js";
import type { HsEntry, HsHit, TradeFlow } from "./types.js";

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
  "into",
  "onto",
  "used",
  "made",
  "pure",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s%-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function confidence(score: number, rank: number, specific: boolean): HsHit["confidence"] {
  if (!specific && rank === 0) return score >= 4.5 ? "medium" : "low";
  if (rank === 0 && score >= 4.0) return "high";
  if (score >= 2.4) return "medium";
  return "low";
}

export function lookupByCode(raw: string): HsEntry | null {
  const code = raw.replace(/\D/g, "");
  if (code.length < 2) return null;
  const { entries, chapters } = getIndex();

  if (code.length === 2) {
    const ch = chapters.find((c) => c.code === code);
    if (!ch) return null;
    return {
      code: ch.code,
      dotted: ch.code,
      section: ch.section,
      chapter: ch.code,
      heading: ch.code,
      hs6: ch.code,
      description: ch.description,
      headingDescription: "",
      chapterDescription: ch.description,
      exportPolicy: "Unknown",
    };
  }

  const exact = entries.find((e) => e.code === code || e.code.startsWith(code));
  return exact ?? null;
}

function expandQuery(q: string): string[] {
  const base = tokenize(q);
  const extra: string[] = [];
  const ql = q.toLowerCase();
  for (const [k, vals] of Object.entries(INDIA_ALIASES)) {
    if (ql.includes(k) || base.includes(k)) {
      for (const v of vals) extra.push(...tokenize(v));
    }
  }
  return [...new Set([...base, ...extra])];
}

function queryIsSpecific(q: string, termCount: number): boolean {
  if (termCount >= 4) return true;
  if (/\b(kernel|vannamei|hrc|gi\b|portland|shelled|broken|whole|pickled|mm)\b/i.test(q)) {
    return true;
  }
  return termCount >= 3;
}

export function searchHs(query: string, limit = 12, tradeFlow?: TradeFlow): HsHit[] {
  const q = query.trim();
  if (!q) return [];

  if (/^[\d.\s]{2,}$/.test(q)) {
    const hit = lookupByCode(q);
    return hit ? [{ ...hit, score: 10, confidence: "high" }] : [];
  }

  const idx = getIndex();
  const terms = expandQuery(q);
  if (!terms.length) return [];
  const specific = queryIsSpecific(q, terms.length);
  const neoMatches = matchNeoDeskPrecedents(q, tradeFlow);

  const scores = new Map<number, number>();
  for (const term of terms) {
    const postings = idx.inverted[term];
    if (!postings) continue;
    const rarity = Math.min(2.4, 100 / Math.max(postings.length, 1));
    const weight = (term.length > 6 ? 1.4 : 1) * rarity;
    for (const i of postings) {
      scores.set(i, (scores.get(i) ?? 0) + weight);
    }
  }

  const ql = q.toLowerCase();

  for (let i = 0; i < idx.entries.length; i++) {
    if (!scores.has(i) && !INDIA_CHAPTER_HINTS.some((h) => h.re.test(ql))) continue;
    const e = idx.entries[i]!;
    const desc = e.description.toLowerCase();
    const heading = e.headingDescription.toLowerCase();
    const hay = `${desc} ${heading}`;
    let boost = 0;

    if (hay.includes(ql) && ql.length > 5) boost += 5;

    let termHits = 0;
    for (const t of terms) {
      if (desc.includes(t)) {
        boost += 1.9;
        termHits++;
      } else if (heading.includes(t)) {
        boost += 0.95;
        termHits++;
      }
    }
    boost += termHits * 0.4;

    for (const hint of INDIA_CHAPTER_HINTS) {
      if (!hint.re.test(ql)) continue;
      if (e.chapter === hint.chapter) boost += hint.bonus;
      if (hint.re.test(desc) || hint.re.test(heading)) boost += 2.5;
    }

    // India-specific disambiguators
    if (/\b(jewellery|jewelry)\b/.test(ql) && /\bgold\b/.test(ql) && e.code.startsWith("7113")) {
      boost += 8;
    }
    if (/\bfurniture\b/.test(ql) && /\bwood/.test(ql) && e.code.startsWith("9403")) {
      boost += 8;
    }
    if (/\bfurniture\b/.test(ql) && !/\bfurniture\b/.test(hay)) {
      boost -= 5;
    }
    if (/\bcoffee\b/.test(ql) && e.hs6.startsWith("0901")) boost += 8;
    if (/\bcoffee\b/.test(ql) && e.hs6.startsWith("1801")) boost -= 6;

    if (/\bcashew\b/.test(ql) || /\b(w180|w210|w240|w320|w450|sw320|rcn)\b/.test(ql)) {
      if (/\b(kernel|shelled|whole|w180|w210|w240|w320|w450|sw320)\b/.test(ql) && e.code.startsWith("080132")) {
        boost += 10;
      }
      if (/\b(broken|splits|pieces)\b/.test(ql) && /broken/i.test(desc)) boost += 8;
      if (/\b(in shell|raw|rcn)\b/.test(ql) && e.code.startsWith("080131")) boost += 10;
      if (/\b(kernel|shelled|w\d{3})\b/.test(ql) && e.code.startsWith("080131")) boost -= 6;
    }

    if (/\b(hrc|hot.?rolled)\b/.test(ql) && /\b(coil|coils)\b/.test(ql)) {
      if (e.hs6.startsWith("7208")) boost += 10;
      if (e.hs6.startsWith("7211")) boost -= 8;
    }
    if (/\b(over|above|≥|>=|>)\s*600|\b600\s*mm\b/.test(ql) && e.hs6.startsWith("7208")) {
      boost += 4;
    }

    if (
      /\b(lithium[\s-]?ion|li[\s-]?ion|rechargeable)\b/.test(ql) &&
      /\b(batter|accumulator|pack)/.test(ql)
    ) {
      if (e.hs6.startsWith("8507")) boost += 12;
      if (e.chapter === "28") boost -= 10;
    }

    if (/\b(electric\s+motor|induction\s+motor|ac\s+motor)\b/.test(ql)) {
      if (e.hs6.startsWith("8501")) boost += 12;
      if (e.hs6.startsWith("8514")) boost -= 10;
    }

    // Finished medicaments (tablets etc.) → 3004, not Chapter 29 intermediates
    if (/\b(paracetamol|acetaminophen|medicament|tablet|capsule)\b/.test(ql)) {
      if (e.hs6.startsWith("3004")) boost += 12;
      if (e.chapter === "29" && /\b(tablet|capsule|medicament|paracetamol|acetaminophen)\b/.test(ql)) {
        boost -= 8;
      }
    }

    if (/\b(vannamei)\b/.test(ql) && /vannamei/i.test(desc)) boost += 10;
    if (/\b(black\s+tiger)\b/.test(ql) && /black tiger/i.test(desc)) boost += 10;

    // Neo desk filing precedents (Cochin / Chennai workbook) — hard boost authentic codes
    for (const m of neoMatches) {
      if (e.code === m.precedent.code) {
        boost += 18 + Math.min(12, m.score);
      } else if (e.hs6 === m.precedent.code.slice(0, 6) && e.code !== m.precedent.code) {
        // Same HS-6 sibling — soft demote so Neo’s national break wins
        boost -= 3;
      }
    }

    if (/\bother\b/i.test(desc) && terms.length >= 2) boost -= 0.5;

    if (boost) scores.set(i, (scores.get(i) ?? 0) + boost);
  }

  // Ensure strong Neo desk codes appear even if lexical tokens missed the inverted index
  for (const m of neoMatches) {
    if (m.score < 8) continue;
    const i = idx.entries.findIndex((e) => e.code === m.precedent.code);
    if (i < 0) continue;
    const bump = 22 + Math.min(12, m.score);
    scores.set(i, Math.max(scores.get(i) ?? 0, bump));
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([i, score], rank) => {
      const e = idx.entries[i]!;
      return {
        ...e,
        dotted: formatCode(e.code),
        score: Math.round(score * 100) / 100,
        confidence: confidence(score, rank, specific),
      };
    });
}

export function listChapters() {
  return getIndex().chapters;
}

export function listByChapter(chapter: string) {
  const ch = chapter.replace(/\D/g, "").slice(0, 2);
  return getIndex().entries.filter((e) => e.chapter === ch).slice(0, 400);
}

export function childrenOf(parent: string) {
  const p = parent.replace(/\D/g, "");
  return getIndex().entries.filter((e) => e.code.startsWith(p) && e.code.length > p.length).slice(0, 200);
}

export { DISCLAIMER };
