import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  INDUSTRY_LABELS,
  NEO_INDUSTRIES,
  inferIndustriesFromText,
  normalizeIndustries,
} from "./industries.js";
import { openAiChat } from "./openrouter.js";
import type { BlogPost, PostStatus, RawNotice } from "./types.js";

function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function defaultStatus(): PostStatus {
  const mode = env("DIGEST_PUBLISH_MODE", "draft").toLowerCase();
  return mode === "auto" || mode === "published" ? "published" : "draft";
}

function scorePost(post: Omit<BlogPost, "qualityScore">): number {
  let score = 35;
  if (post.title.length >= 28 && post.title.length <= 110) score += 12;
  if (post.excerpt.length >= 60 && post.excerpt.length <= 220) score += 10;
  if (post.body.length >= 320) score += 12;
  if (post.body.length >= 500) score += 8;
  if (post.impact.length >= 50) score += 10;
  if (post.industries.length >= 1 && !post.industries.includes("general-trade")) score += 10;
  if (post.engine === "ai") score += 12;
  // Penalize template / robotic titles
  if (/^(new|important|latest)\b/i.test(post.title)) score -= 20;
  if (/\b(new dgft|new cbic|important update|what you need to know)\b/i.test(post.title)) score -= 25;
  if (/download|type\s*:\s*pdf/i.test(post.title)) score -= 40;
  if (!/##\s+/m.test(post.body)) score -= 8;
  // Penalize ChatGPT filler in body / excerpt / impact
  const blob = `${post.title}\n${post.excerpt}\n${post.body}\n${post.impact}`;
  const filler =
    /\b(learn about|streamline|aren't fully detailed|it's advisable|in today's (?:dynamic )?trade landscape|it is important to note|stakeholders|leverage|delve|comprehensive|robust|stay ahead|navigate the complexities|game.?changer|unlock the potential)\b/i;
  if (filler.test(blob)) score -= 28;
  if (/\b(as an ai|as a language model|hope this helps)\b/i.test(blob)) score -= 40;
  return Math.max(0, Math.min(100, score));
}

function cleanTitle(raw: string): string {
  return raw.replace(/^[\s:–—-]+/, "").replace(/\s+/g, " ").trim();
}

function enrichFallback(notice: RawNotice): BlogPost {
  const title = cleanTitle(notice.title);
  const industries = inferIndustriesFromText(`${title} ${notice.rawSubject}`);
  const industryLabel = industries
    .filter((i) => i !== "general-trade")
    .map((i) => INDUSTRY_LABELS[i])
    .filter(Boolean)
    .join(", ");

  const who =
    notice.source === "dgft" ? "DGFT (Directorate General of Foreign Trade)" : "CBIC / Customs";

  const base = {
    id: notice.id,
    slug: slugify(`${notice.noticeNo}-${title}`) || notice.id,
    title: title.slice(0, 140),
    excerpt: `${notice.source.toUpperCase()} update (${notice.noticeNo}): ${title}`.slice(0, 280),
    body: [
      `## What changed`,
      ``,
      `${who} issued **${notice.noticeNo}** on **${notice.publishedAt}**.`,
      ``,
      title,
      ``,
      `## Why Neo clients should care`,
      ``,
      industryLabel
        ? `This update may matter for Neo Logistics clients in **${industryLabel}** (and related trades).`
        : `This update may affect Indian import/export compliance for Neo Logistics clients.`,
      ``,
      `Read the official text before changing any Bill of Entry / Shipping Bill practice.`,
      ``,
      `## Official reference`,
      ``,
      `- Source: ${notice.source.toUpperCase()}`,
      `- Notice: ${notice.noticeNo}`,
      `- Date: ${notice.publishedAt}`,
      `- Link: ${notice.sourceUrl}`,
      ``,
      `## Disclaimer`,
      ``,
      `Educational awareness post only. Not legal advice. Not a duty quote. Confirm with Neo’s licensed CHA (Cochin / Chennai) before filing.`,
    ].join("\n"),
    impact:
      "Open the official PDF/link, check whether your CTH / import policy / procedure is mentioned, then ask Neo’s CHA desk to confirm before the next filing.",
    industries,
    tags: [notice.source, "auto-digest", notice.channel, ...industries].filter(Boolean) as string[],
    source: notice.source,
    noticeNo: notice.noticeNo,
    publishedAt: notice.publishedAt,
    sourceUrl: notice.sourceUrl,
    generatedAt: new Date().toISOString(),
    status: defaultStatus(),
    engine: "fallback" as const,
    channel: notice.channel,
  };

  return { ...base, qualityScore: scorePost(base) };
}

async function tryGemini(
  notice: RawNotice,
  modelName: string
): Promise<BlogPost | null> {
  const key = env("GEMINI_API_KEY") || env("GOOGLE_AI_API_KEY");
  if (!key || key.includes("your-key")) return null;

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1400,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(buildDigestPrompt(notice));
  const text = result.response.text()?.trim() ?? "";
  return parseDigestJson(notice, text);
}

function buildDigestPrompt(notice: RawNotice): string {
  const industryList = NEO_INDUSTRIES.map((i) => `${i} (${INDUSTRY_LABELS[i]})`).join(", ");
  const bodyBlock = notice.bodyText
    ? `\nOFFICIAL TEXT EXCERPT (ground every fact here; do not invent beyond it):\n${notice.bodyText.slice(0, 4200)}\n`
    : "\n(No full official text fetched — write carefully from the subject. Be honest about what is confirmed vs what Neo’s CHA must verify.)\n";

  return `You write for Neo Logistics' "Trade Briefing" — a desk note busy Indian importers/exporters actually open (Cochin & Chennai CHA clients).

Sound like a sharp ops manager briefing a client over chai — not ChatGPT, not a government rewrite, not SEO spam.

VOICE
- Specific. Named goods / processes when the notice allows it.
- Calm confidence. Short paragraphs. One idea per paragraph.
- Ban filler: "In today's dynamic trade landscape", "It is important to note", "stakeholders", "leverage", "delve", "comprehensive", "robust", "stay ahead", "Learn about", "streamline", "aren't fully detailed", "It's advisable", "navigate the complexities", "game-changer".
- Ban title starters: "New…", "Important…", "Latest…", "What You Need to Know".
- Title = business headline a CFO would open (max ~90 chars).

STRUCTURE (markdown body, 220–380 words)
## What changed
2–4 sentences: what CBIC/DGFT actually did, plain English.

## Why it matters for shipments
Concrete filing / docs / timing angle. Name Neo trades only when justified (cashew, steel, chemicals, etc.). If unclear, say so.

## What to do next
Exactly 3 bullets:
1) Open the official notice
2) Check whether your CTH / docs / policy line is touched
3) Ask Neo’s CHA before changing Bill of Entry / Shipping Bill practice

RULES
- Do NOT invent duty %, prices, deadlines, or legal conclusions.
- Do NOT pretend every Neo client is affected.
- Tag ONLY from: ${industryList}
- If unsure: "general-trade".
- excerpt: one hook sentence (max 180 chars) that makes someone open the email.
- impact: 1–2 sentences — who should care + the single next action.

Return JSON only:
{"title":"...","excerpt":"...","body":"markdown","impact":"...","industries":["..."],"tags":["..."]}

OFFICIAL NOTICE
Source: ${notice.source}
Channel: ${notice.channel}
Notice no: ${notice.noticeNo}
Date: ${notice.publishedAt}
Subject: ${notice.rawSubject}
URL: ${notice.sourceUrl}
${bodyBlock}`;
}

function parseDigestJson(notice: RawNotice, text: string): BlogPost | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;

  const parsed = JSON.parse(text.slice(start, end + 1)) as {
    title?: string;
    excerpt?: string;
    body?: string;
    impact?: string;
    industries?: string[];
    tags?: string[];
  };

  const title = cleanTitle(parsed.title || notice.title);
  if (!title || /download|type\s*:\s*pdf/i.test(title)) return null;
  if (/^(new|important|latest)\b/i.test(title)) return null;
  if (/\bwhat you need to know\b/i.test(title)) return null;

  const body = (parsed.body || "").trim();
  if (body.length < 220) return null;

  const industries = normalizeIndustries([
    ...(parsed.industries ?? []),
    ...inferIndustriesFromText(`${parsed.body ?? ""} ${notice.rawSubject}`),
  ]);

  const base = {
    id: notice.id,
    slug: slugify(title) || notice.id,
    title: title.slice(0, 120),
    excerpt: (parsed.excerpt || notice.rawSubject).slice(0, 200),
    body,
    impact: (parsed.impact || "").trim(),
    industries,
    tags: [
      notice.source,
      "auto-digest",
      notice.channel,
      ...((parsed.tags ?? []).map((t) => t.toLowerCase()).slice(0, 8)),
      ...industries,
    ],
    source: notice.source,
    noticeNo: notice.noticeNo,
    publishedAt: notice.publishedAt,
    sourceUrl: notice.sourceUrl,
    generatedAt: new Date().toISOString(),
    status: defaultStatus(),
    engine: "ai" as const,
    channel: notice.channel,
  };

  if (base.body.length < 220 || base.impact.length < 40) return null;
  return { ...base, qualityScore: scorePost(base) };
}

async function tryOpenAi(notice: RawNotice, modelName: string): Promise<BlogPost | null> {
  const text = await openAiChat({
    system:
      "You are Neo Logistics’ Trade Briefing editor. Return only valid JSON for a customs desk note clients will actually read.",
    user: buildDigestPrompt(notice),
    model: modelName,
    temperature: 0.35,
    maxTokens: 1800,
    json: true,
  });
  if (!text) return null;
  return parseDigestJson(notice, text);
}

/**
 * Enterprise summarizer: model cascade + retries + structured fallback.
 * Never throws — always returns a post.
 */
export async function summarizeToBlogPost(notice: RawNotice): Promise<BlogPost> {
  const provider = env("AI_PROVIDER", "gemini").toLowerCase();

  if (provider === "openai" || env("OPENAI_API_KEY")) {
    const models = [
      env("DIGEST_AI_MODEL") || env("AI_MODEL", "openai/gpt-4o-mini"),
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const modelName of models) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const post = await tryOpenAi(notice, modelName);
          if (post) {
            console.log(`[summarize] AI ok · ${modelName} · q=${post.qualityScore} · ${notice.noticeNo}`);
            return post;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[summarize] ${modelName} attempt ${attempt} failed: ${msg.slice(0, 160)}`);
          if (/429|quota|rate/i.test(msg)) await sleep(2000 * attempt);
          else await sleep(400 * attempt);
        }
      }
    }
  }

  const models = [
    env("AI_MODEL", "gemini-2.0-flash"),
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
  ].filter((v, i, a) => v && a.indexOf(v) === i && !v.startsWith("openai/"));

  let lastErr: unknown;
  let quotaHit = false;
  for (const modelName of models) {
    if (quotaHit) break;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const post = await tryGemini(notice, modelName);
        if (post) {
          console.log(`[summarize] AI ok · ${modelName} · q=${post.qualityScore} · ${notice.noticeNo}`);
          return post;
        }
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[summarize] ${modelName} attempt ${attempt} failed: ${msg.slice(0, 160)}`);
        if (/404|not found|not supported/i.test(msg)) break;
        if (/429|quota|rate/i.test(msg)) {
          quotaHit = true;
          await sleep(2000 * attempt);
          break;
        }
        await sleep(400 * attempt);
      }
    }
  }

  if (lastErr) console.warn("[summarize] using structured fallback after AI failures");
  return enrichFallback(notice);
}
