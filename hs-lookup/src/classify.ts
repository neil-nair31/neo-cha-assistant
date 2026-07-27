import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildClientActionPack } from "./client-pack.js";
import { DISCLAIMER, DUTY_NOTE, catalogStats, formatCode, getIndex } from "./catalog.js";
import {
  formatNeoDeskPromptBlock,
  neoDeskWhy,
  strongNeoDeskMatch,
  type NeoDeskMatch,
} from "./neo-desk-precedents.js";
import { openAiChat } from "./openrouter.js";
import { searchHs } from "./search.js";
import type {
  AmbiguityInfo,
  ClassifyRequest,
  ClassifyResult,
  CompareLine,
  HsHit,
  NeoDeskPrecedentInfo,
  PrimaryRecommendation,
  RuledOutLine,
  DeskVerdict,
} from "./types.js";

function env(key: string): string {
  return process.env[key] ?? "";
}

function buildQuery(req: ClassifyRequest): string {
  return [req.description, req.material, req.form, req.endUse, req.originHint, req.tradeFlow]
    .filter(Boolean)
    .join(" · ");
}

function tokenizeCount(text: string): number {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2).length;
}

function nextQuestions(req: ClassifyRequest, hits: HsHit[]): string[] {
  const q: string[] = [];
  if (!req.material) q.push("What is the primary material / composition (% if mixed)?");
  if (!req.form) q.push("What form is it in (raw, powder, liquid, finished article, machine, part)?");
  if (!req.endUse) q.push("Import or export? What is the main function / end-use in India?");
  if (!req.tradeFlow || req.tradeFlow === "either") {
    q.push("Confirm trade flow: India import (Bill of Entry) or India export (Shipping Bill)?");
  }
  if (hits.some((h) => /steel|iron|alloy|hot-rolled|flat-rolled/i.test(h.description))) {
    q.push("For metals: coated/uncoated, alloyed, coil/plate/bar, width (≥600 mm?), and thickness?");
  }
  if (hits.some((h) => /textile|cotton|fabric|apparel|knitted/i.test(h.description))) {
    q.push("For textiles: fibre %, knit vs woven, GSM, garment vs fabric?");
  }
  if (hits.some((h) => /shrimp|prawn|cashew/i.test(h.description))) {
    q.push("For agri/aqua: species / grade (e.g. vannamei, cashew W180 whole vs broken), fresh/frozen/dried?");
  }
  if (hits.some((h) => /chemical|acid|polymer|alcohol/i.test(h.description))) {
    q.push("For chemicals: CAS / SDS commercial name and purity %?");
  }
  q.push(
    "Share invoice + tech specs with Neo’s licensed CHA (Cochin / Chennai) for final India CTH confirmation before filing."
  );
  return q.slice(0, 6);
}

function assessAmbiguity(
  req: ClassifyRequest,
  hits: HsHit[],
  neoMatch: NeoDeskMatch | null
): AmbiguityInfo {
  const reasons: string[] = [];
  const softReasons: string[] = [];
  const vague = tokenizeCount(req.description) < 3 && !req.material && !req.form;

  // Strong Neo desk precedent → treat as coherent desk pick (still CHA-confirm)
  if (neoMatch && hits[0]?.code === neoMatch.precedent.code) {
    return {
      ambiguous: false,
      requireClarify: false,
      reasons: [
        `Matches Neo Cochin/Chennai desk filing precedent for “${neoMatch.precedent.goods}”.`,
      ],
      message:
        "Neo desk precedent aligned. Still confirm invoice specs with Neo CHA before filing — not a binding classification.",
    };
  }

  if (vague) reasons.push("Description is too short / generic for a confident India CTH pick.");

  const a = hits[0];
  const b = hits[1];
  if (a && a.confidence === "low") {
    reasons.push("Top match confidence is low — more product detail is needed.");
  }
  if (a && b) {
    const gap = (a.score ?? 0) - (b.score ?? 0);
    const close = gap < 1.25 || (a.score > 0 && gap / a.score < 0.12);
    if (close && a.hs6 !== b.hs6) {
      reasons.push(
        `Top lines sit under different HS-6 parents (${a.dotted} vs ${b.dotted}) — essential character must be confirmed.`
      );
    } else if (close && a.code !== b.code) {
      // Same HS-6 national break choice is normal desk work when form/grade is given
      if (req.material && req.form) {
        softReasons.push(
          `Nearby national break ${b.dotted} was considered; Neo desk prefers ${a.dotted} on the form/grade described.`
        );
      } else {
        reasons.push(
          `Several national tariff lines are close (${a.dotted} vs ${b.dotted}) — confirm grade/form to lock CTH.`
        );
      }
    }
  }
  if (hits.length >= 2) {
    const chapters = new Set(hits.slice(0, 3).map((h) => h.chapter));
    if (chapters.size >= 2) {
      reasons.push("Candidates span more than one chapter — clarify material and function.");
    }
  }

  const ambiguous = reasons.length > 0;
  return {
    ambiguous,
    requireClarify: ambiguous,
    reasons: [...reasons, ...softReasons],
    message: ambiguous
      ? "Do not file Bill of Entry / Shipping Bill on this code alone — Neo desk needs clarifying answers first."
      : "Desk recommendation is coherent for Neo CHA review. Still confirm before filing — not a binding classification.",
  };
}

function tariffPathFor(h: HsHit): string {
  const ch = h.chapter || h.code.slice(0, 2);
  const heading = h.code.slice(0, 4);
  const hs6 = h.hs6 || h.code.slice(0, 6);
  const hs6Dotted = `${hs6.slice(0, 4)}.${hs6.slice(4)}`;
  return `Ch.${ch} › ${heading} › ${hs6Dotted} › ${h.dotted}`;
}

function whyFits(h: HsHit, req: ClassifyRequest): string {
  const material = req.material?.trim();
  const form = req.form?.trim();
  const endUse = req.endUse?.trim();
  const bits: string[] = [];
  if (material) bits.push(`composition/material noted as ${material}`);
  if (form) bits.push(`form/packing noted as ${form}`);
  if (endUse) bits.push(`function/end-use noted as ${endUse}`);
  if (req.tradeFlow && req.tradeFlow !== "either") {
    bits.push(`India ${req.tradeFlow} filing context`);
  }
  if (h.exportPolicy === "Restricted" || h.exportPolicy === "Prohibited") {
    bits.push(`DGFT export policy tag on this line: ${h.exportPolicy} (verify before Shipping Bill)`);
  }
  const base =
    bits.length > 0
      ? `Aligned to India CTH ${h.dotted} (${h.description}) on ${bits.join("; ")}.`
      : `Aligned to India CTH ${h.dotted} (${h.description}) on the commercial description provided.`;
  return `${base} Confirm exact invoice wording and physical goods with Neo’s CHA before filing.`;
}

function howDiffers(h: HsHit, others: HsHit[]): string {
  const peer = others.find((o) => o.code !== h.code);
  if (!peer) return "No close competing India CTH line in this desk pass.";
  if (h.hs6 !== peer.hs6) {
    return `Different HS-6 parent than ${peer.dotted} — product identity / essential character decides.`;
  }
  if (h.code.slice(6) !== peer.code.slice(6)) {
    return `Same HS-6 as ${peer.dotted}, different India national break (.${h.code.slice(6)} vs .${peer.code.slice(6)}) — grade, species, or form usually decides.`;
  }
  return `Close to ${peer.dotted}: commercial invoice wording and specs decide.`;
}

function onlyIfHint(h: HsHit, primary: HsHit): string {
  if (h.hs6 !== primary.hs6) {
    return `Only if the goods’ essential character matches “${h.description}” rather than “${primary.description}”.`;
  }
  if (h.code.slice(6) !== primary.code.slice(6)) {
    return `Only if grade / species / form matches the ${h.dotted} national break, not ${primary.dotted}.`;
  }
  return `Only if commercial invoice wording clearly prefers “${h.description}” over the primary line.`;
}

function buildCompare(req: ClassifyRequest, hits: HsHit[]): CompareLine[] {
  const top = hits.slice(0, 3);
  return top.map((h) => ({
    code: h.code,
    dotted: h.dotted,
    hs6: h.hs6,
    description: h.description,
    confidence: h.confidence,
    exportPolicy: h.exportPolicy,
    whyItMightFit: whyFits(h, req),
    howItDiffers: howDiffers(h, top),
  }));
}

function chaQuestions(req: ClassifyRequest, hits: HsHit[], ambiguity: AmbiguityInfo): string[] {
  const q = [
    ...nextQuestions(req, hits).slice(0, 4),
    "Please share commercial invoice description + packing list / technical specs for CTH confirmation.",
  ];
  if (ambiguity.ambiguous && hits[0] && hits[1]) {
    q.unshift(
      `Between ${hits[0].dotted} and ${hits[1].dotted}, which matches the invoice wording and physical goods?`
    );
  }
  return [...new Set(q)].slice(0, 6);
}

function applyAmbiguityToConfidence(hits: HsHit[], ambiguity: AmbiguityInfo): HsHit[] {
  if (!ambiguity.ambiguous) return hits;
  return hits.map((h, i) => ({
    ...h,
    confidence:
      i === 0 && h.confidence === "high"
        ? "medium"
        : h.confidence === "high"
          ? "medium"
          : h.confidence,
  }));
}

function deskVerdictFor(
  ambiguity: AmbiguityInfo,
  engine: ClassifyResult["engine"],
  hasAiWhy: boolean,
  req: ClassifyRequest,
  neoMatch: NeoDeskMatch | null
): { verdict: DeskVerdict; label: string } {
  if (ambiguity.requireClarify || (ambiguity.ambiguous && !neoMatch)) {
    return {
      verdict: "needs_clarification",
      label: "Do not file — Neo desk needs clarifying answers first",
    };
  }
  if (neoMatch) {
    return {
      verdict: "recommend",
      label: "Neo desk filing precedent — confirm with CHA before BoE / Shipping Bill",
    };
  }
  if (engine === "hybrid-ai" && hasAiWhy && req.material && req.form) {
    return {
      verdict: "recommend",
      label: "Neo desk recommendation — send to CHA to lock for BoE / Shipping Bill",
    };
  }
  if (engine === "hybrid-ai" && hasAiWhy) {
    return {
      verdict: "recommend_with_caveat",
      label: "Strong desk pick — confirm composition/form with Neo CHA before filing",
    };
  }
  return {
    verdict: "recommend_with_caveat",
    label: "Provisional desk pick — confirm material / form with Neo CHA before filing",
  };
}

function pinNeoDesk(
  candidates: HsHit[],
  neoMatch: NeoDeskMatch | null
): HsHit[] {
  if (!neoMatch) return candidates;
  const code = neoMatch.precedent.code;
  const fromPool = candidates.find((c) => c.code === code);
  let pinned: HsHit | undefined = fromPool
    ? { ...fromPool, score: Math.max(fromPool.score, 40), confidence: "high" }
    : undefined;
  if (!pinned) {
    const hit = searchHs(code, 1)[0];
    if (hit) pinned = { ...hit, score: 40, confidence: "high" };
  }
  if (!pinned) return candidates;
  return [pinned, ...candidates.filter((c) => c.code !== code)];
}

function neoInfo(match: NeoDeskMatch | null): NeoDeskPrecedentInfo | null {
  if (!match) return null;
  const p = match.precedent;
  return {
    goods: p.goods,
    tradeFlow: p.tradeFlow,
    ports: p.ports,
    code: p.code,
    dotted: formatCode(p.code),
    matchScore: match.score,
  };
}

function buildRuledOut(
  primary: HsHit,
  alternates: HsHit[],
  aiRuledOut?: Array<{ code: string; because: string; onlyIf?: string }>
): RuledOutLine[] {
  const byCode = new Map(alternates.map((a) => [a.code, a]));
  const fromAi = (aiRuledOut ?? [])
    .map((r) => {
      const code = r.code.replace(/\D/g, "");
      const hit = byCode.get(code) || alternates.find((a) => a.code === code);
      if (!hit) return null;
      return {
        code: hit.code,
        dotted: hit.dotted,
        description: hit.description,
        because: r.because,
        onlyIf: r.onlyIf || onlyIfHint(hit, primary),
      } satisfies RuledOutLine;
    })
    .filter(Boolean) as RuledOutLine[];

  if (fromAi.length) return fromAi.slice(0, 2);

  return alternates.slice(0, 2).map((h) => ({
    code: h.code,
    dotted: h.dotted,
    description: h.description,
    because: howDiffers(h, [primary, h]),
    onlyIf: onlyIfHint(h, primary),
  }));
}

function buildPrimary(
  req: ClassifyRequest,
  candidates: HsHit[],
  ambiguity: AmbiguityInfo,
  neoMatch: NeoDeskMatch | null,
  aiExtra?: {
    whyPrimary?: string;
    whatWouldChange?: string[];
  }
): PrimaryRecommendation | null {
  const top = candidates[0];
  if (!top) return null;

  const neoAligned = Boolean(neoMatch && top.code === neoMatch.precedent.code);
  const why =
    (neoAligned && neoMatch ? neoDeskWhy(neoMatch) : "") ||
    aiExtra?.whyPrimary?.trim() ||
    (ambiguity.ambiguous
      ? `Leading India CTH among close competing lines. ${whyFits(top, req)}`
      : whyFits(top, req));

  const whatWouldChange =
    aiExtra?.whatWouldChange?.filter(Boolean).slice(0, 4) ??
    nextQuestions(req, candidates).slice(0, 3);

  return {
    code: top.code,
    dotted: top.dotted,
    hs6: top.hs6,
    description: top.description,
    confidence: ambiguity.requireClarify
      ? top.confidence === "high"
        ? "medium"
        : top.confidence
      : neoAligned
        ? "high"
        : top.confidence,
    exportPolicy: top.exportPolicy,
    tariffPath: tariffPathFor(top),
    why,
    whatWouldChange:
      whatWouldChange.length > 0
        ? whatWouldChange
        : ["Share commercial invoice wording and technical specs with Neo’s CHA desk."],
    filingReady: false,
    filingStatus: "educational_pending_cha",
    label: neoAligned ? "Neo desk filing precedent" : "Neo desk recommendation",
  };
}

function enrich(
  req: ClassifyRequest,
  base: ClassifyResult,
  aiExtra?: {
    whyPrimary?: string;
    whatWouldChange?: string[];
    ruledOut?: Array<{ code: string; because: string; onlyIf?: string }>;
  }
): ClassifyResult {
  const query = buildQuery(req);
  const neoMatch = strongNeoDeskMatch(query, req.tradeFlow);
  const pinned = pinNeoDesk(base.candidates, neoMatch);
  const ambiguity = assessAmbiguity(req, pinned, neoMatch);
  const candidates = applyAmbiguityToConfidence(pinned, ambiguity);
  const compare = buildCompare(req, candidates);
  const primary = buildPrimary(req, candidates, ambiguity, neoMatch, aiExtra);
  const alternates = candidates.slice(1, 3);
  const ruledOut = primary
    ? buildRuledOut(
        { ...candidates[0]! },
        alternates,
        aiExtra?.ruledOut
      )
    : [];
  const engine: ClassifyResult["engine"] =
    neoMatch && candidates[0]?.code === neoMatch.precedent.code
      ? base.engine === "hybrid-ai"
        ? "hybrid-ai"
        : "neo-desk"
      : base.engine;
  const { verdict, label } = deskVerdictFor(
    ambiguity,
    engine,
    Boolean(aiExtra?.whyPrimary?.trim()) || Boolean(neoMatch),
    req,
    neoMatch && candidates[0]?.code === neoMatch.precedent.code ? neoMatch : null
  );
  const reasoning =
    neoMatch && candidates[0]?.code === neoMatch.precedent.code
      ? `Neo desk filing precedent: ${neoMatch.precedent.goods} → ${formatCode(neoMatch.precedent.code)} (${neoMatch.precedent.tradeFlow} · ${neoMatch.precedent.ports.join("/")}).`
      : ambiguity.ambiguous
        ? `${base.reasoning} ${ambiguity.message}`
        : base.reasoning;

  const alignedNeo =
    neoMatch && candidates[0]?.code === neoMatch.precedent.code ? neoMatch : null;

  return {
    ...base,
    engine,
    deskVerdict: verdict,
    deskVerdictLabel: label,
    primary,
    neoDeskPrecedent: alignedNeo ? neoInfo(alignedNeo) : null,
    clientPack: buildClientActionPack(req, candidates[0] ?? null, alignedNeo, engine),
    ruledOut,
    alternates,
    candidates,
    compare,
    ambiguity,
    chaQuestions: chaQuestions(req, candidates, ambiguity),
    reasoning,
    nextQuestions: nextQuestions(req, candidates),
  };
}

function lexicalClassify(req: ClassifyRequest): ClassifyResult {
  const query = buildQuery(req);
  const neoMatch = strongNeoDeskMatch(query, req.tradeFlow);
  const candidates = pinNeoDesk(searchHs(query, 10, req.tradeFlow), neoMatch);
  const vague =
    tokenizeCount(req.description) < 3 && !req.material && !req.form && !neoMatch;

  const base: ClassifyResult = {
    query,
    market: "India",
    disclaimer: DISCLAIMER,
    indiaNote: getIndex().meta.indiaNote,
    dutyNote: DUTY_NOTE,
    deskVerdict: "recommend_with_caveat",
    deskVerdictLabel: "Provisional desk pick — confirm with Neo CHA before filing",
    primary: null,
    neoDeskPrecedent: null,
    clientPack: null,
    ruledOut: [],
    alternates: [],
    candidates: vague
      ? candidates.map((c, i) => ({
          ...c,
          confidence: i === 0 && c.confidence === "high" ? "medium" : c.confidence,
        }))
      : candidates,
    compare: [],
    ambiguity: {
      ambiguous: false,
      requireClarify: false,
      reasons: [],
      message: "",
    },
    chaQuestions: [],
    reasoning:
      candidates.length > 0
        ? `Neo desk selected a leading India CTH from ${candidates.length} matching tariff lines for CHA confirmation before Bill of Entry / Shipping Bill filing.`
        : "No confident India tariff-line match yet. Add composition, form, species/grade, and import vs export.",
    nextQuestions: nextQuestions(req, candidates),
    engine: neoMatch ? "neo-desk" : "lexical",
    catalogSize: catalogStats().subheadings,
  };

  return enrich(req, base);
}

function parseRerankJson(
  text: string,
  pool: HsHit[]
): {
  order: string[];
  reasoning: string;
  whyPrimary?: string;
  whatWouldChange?: string[];
  ruledOut?: Array<{ code: string; because: string; onlyIf?: string }>;
} | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  const parsed = JSON.parse(text.slice(start, end + 1)) as {
    rankedCodes?: string[];
    primaryCode?: string;
    reasoning?: string;
    whyPrimary?: string;
    whatWouldChange?: string[];
    ruledOut?: Array<{ code?: string; because?: string; onlyIf?: string }>;
  };
  const rawCodes = [
    ...(parsed.primaryCode ? [parsed.primaryCode] : []),
    ...(parsed.rankedCodes ?? []),
  ];
  const order = rawCodes
    .map((c) => c.replace(/\D/g, ""))
    .filter((c) => (c.length === 8 || c.length === 6) && pool.some((p) => p.code === c || p.hs6 === c))
    .map((c) => {
      if (c.length === 8) return c;
      return pool.find((p) => p.hs6 === c)?.code ?? c;
    })
    .filter((c) => c.length === 8 && pool.some((p) => p.code === c));
  const seen = new Set<string>();
  const unique = order.filter((c) => (seen.has(c) ? false : (seen.add(c), true)));
  if (!unique.length) return null;
  const ruledOut = (parsed.ruledOut ?? [])
    .map((r) => {
      const code = (r.code ?? "").replace(/\D/g, "");
      if (!code || !r.because) return null;
      const hit = pool.find((p) => p.code === code || p.hs6 === code);
      if (!hit) return null;
      return { code: hit.code, because: r.because, onlyIf: r.onlyIf };
    })
    .filter(Boolean) as Array<{ code: string; because: string; onlyIf?: string }>;
  return {
    order: unique,
    reasoning: parsed.reasoning ?? "",
    whyPrimary: parsed.whyPrimary,
    whatWouldChange: parsed.whatWouldChange,
    ruledOut,
  };
}

function buildRerankPrompt(req: ClassifyRequest, pool: HsHit[]): string {
  const catalog = pool
    .map(
      (h, i) =>
        `${i + 1}. ${h.code} (${h.dotted}) | HS6 ${h.hs6} | Ch.${h.chapter} | policy:${h.exportPolicy} | ${h.description}`
    )
    .join("\n");

  return `You are a senior licensed CHA classifier at Neo Logistics (Cochin & Chennai). Write a DEFINITIVE India CTH desk memo — not a Google-style search shortlist.

VOICE:
- Sound like a customs desk note to an importer/exporter.
- Be decisive. Pick ONE primary CTH and stand behind it.
- Never say "matches wording", "ranked", "search", or "possible codes include".
- Use GRI / essential character / material / form / species / grade language.

RULES:
- ONLY choose 8-digit codes from CANDIDATES. Never invent a code.
- primaryCode = the single India CTH Neo desk would put first for Bill of Entry / Shipping Bill prep.
- rankedCodes = [primary, alt1?, alt2?] max 3.
- whyPrimary = 2–4 sentences: why THIS line wins on material/form/end-use/species (CHA tone).
- ruledOut = up to 2 close lines with because + onlyIf (when would that alternate apply).
- whatWouldChange = 1–3 invoice/spec facts that would flip the primary.
- reasoning = one short desk summary sentence.
- Do NOT quote duty rates. Do NOT claim filing-ready without CHA sign-off.
- Prefer specific India national breaks over residuals when justified.
- When a NEO DESK FILING PRECEDENT clearly matches the goods AND that code is in CANDIDATES, use it as primaryCode and say so in whyPrimary.

Return JSON only:
{"primaryCode":"########","rankedCodes":["########"],"whyPrimary":"...","ruledOut":[{"code":"########","because":"...","onlyIf":"..."}],"whatWouldChange":["..."],"reasoning":"..."}

GOODS (India context):
Description: ${req.description}
Material: ${req.material ?? "(not given)"}
Form: ${req.form ?? "(not given)"}
End-use: ${req.endUse ?? "(not given)"}
Trade flow: ${req.tradeFlow ?? "either"}

${formatNeoDeskPromptBlock(buildQuery(req), req.tradeFlow)}

CANDIDATES:
${catalog}`;
}

async function aiRerank(req: ClassifyRequest, pool: HsHit[]): Promise<{
  order: string[];
  reasoning: string;
  whyPrimary?: string;
  whatWouldChange?: string[];
  ruledOut?: Array<{ code: string; because: string; onlyIf?: string }>;
} | null> {
  if (pool.length < 2) return null;
  const prompt = buildRerankPrompt(req, pool);
  const provider = (env("AI_PROVIDER") || "gemini").toLowerCase();

  if (provider === "openai" || env("OPENAI_API_KEY")) {
    try {
      const model = env("HS_AI_MODEL") || env("AI_MODEL") || "openai/gpt-4o";
      const text = await openAiChat({
        system:
          "You are Neo Logistics’ senior India Customs (CHA) tariff desk. Return decisive CTH recommendations as JSON only.",
        user: prompt,
        model,
        temperature: 0.05,
        maxTokens: 1100,
        json: true,
      });
      if (text) {
        const parsed = parseRerankJson(text, pool);
        if (parsed) return parsed;
      }
    } catch (err) {
      console.error("[hs-classify] OpenRouter/OpenAI rerank failed", err);
    }
  }

  const key = env("GEMINI_API_KEY") || env("GOOGLE_AI_API_KEY");
  if (!key || key.includes("your-key")) return null;

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: env("AI_MODEL") || "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.05,
        maxOutputTokens: 1100,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text()?.trim() ?? "";
    return parseRerankJson(text, pool);
  } catch (err) {
    console.error("[hs-classify] AI rerank failed", err);
    return null;
  }
}

export async function classifyGoods(req: ClassifyRequest): Promise<ClassifyResult> {
  const base = lexicalClassify(req);
  if (!base.candidates.length) return base;

  // Strong Neo desk workbook match — skip AI re-rank; pin authentic filing code
  if (base.engine === "neo-desk" && base.neoDeskPrecedent) {
    return base;
  }

  const pool = pinNeoDesk(searchHs(buildQuery(req), 40, req.tradeFlow), strongNeoDeskMatch(buildQuery(req), req.tradeFlow));
  const ai = await aiRerank(req, pool);
  if (!ai) return base;

  const byCode = new Map(pool.map((p) => [p.code, p]));
  const reranked: HsHit[] = [];
  for (const code of ai.order) {
    const hit = byCode.get(code);
    if (hit) reranked.push({ ...hit, confidence: reranked.length === 0 ? "high" : "medium" });
  }
  for (const hit of base.candidates) {
    if (!reranked.some((r) => r.code === hit.code)) reranked.push(hit);
  }

  const focused = reranked.slice(0, 8);
  return enrich(
    req,
    {
      ...base,
      candidates: focused,
      reasoning:
        ai.reasoning ||
        "Neo desk recommendation selected for CHA confirmation before filing.",
      engine: "hybrid-ai",
      nextQuestions: nextQuestions(req, focused),
    },
    {
      whyPrimary: ai.whyPrimary,
      whatWouldChange: ai.whatWouldChange,
      ruledOut: ai.ruledOut,
    }
  );
}

export function explainCoverage(): string {
  const s = catalogStats();
  return `India CTH / ITC-HS index: ${s.subheadings.toLocaleString()} eight-digit tariff lines, ${s.chapters} chapters. Source: ${s.source}.`;
}
