import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { looksLikeNavigationGarbage } from "../assistant/guardrails.js";
import { config } from "../config.js";
import { getDb } from "../db/index.js";
import type { KbChunk, RetrievalResult } from "../types.js";

type FrontMatter = Record<string, string>;

function parseFrontMatter(raw: string): { meta: FrontMatter; body: string } {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, body: raw };
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).trim();
  const meta: FrontMatter = {};
  for (const line of fm.split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body };
}

function chunkMarkdown(body: string, maxChars = 1200): string[] {
  const parts = body.split(/\n(?=#{1,3}\s)/);
  const chunks: string[] = [];
  let buf = "";
  for (const part of parts) {
    if ((buf + "\n" + part).length > maxChars && buf) {
      chunks.push(buf.trim());
      buf = part;
    } else {
      buf = buf ? `${buf}\n${part}` : part;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.length ? chunks : [body];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s%-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

export const MIN_RELEVANCE_SCORE = 0.22;

function isLowQualityChunk(content: string): boolean {
  if (looksLikeNavigationGarbage(content)) return true;
  const trimmed = content.trim();
  if (trimmed.length < 80 && /auto-synced/i.test(trimmed)) return true;
  const navHits = (trimmed.toLowerCase().match(/\b(home|about us|industries|login)\b/g) || [])
    .length;
  if (navHits >= 5 && trimmed.length < 600) return true;
  return false;
}

export function loadKnowledgeFromDisk(): KbChunk[] {
  const root = config.knowledgeDir;
  if (!fs.existsSync(root)) return [];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith("_") || entry.name.toUpperCase() === "INTERNAL") continue;
        walk(full);
      } else if (entry.name.endsWith(".md") && entry.name.toUpperCase() !== "INTERNAL.MD") {
        files.push(full);
      }
    }
  };
  walk(root);

  const chunks: KbChunk[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const { meta, body } = parseFrontMatter(raw);
    const section =
      meta.section ||
      path.basename(path.dirname(file)) ||
      "general";
    const title = meta.title || path.basename(file, ".md");
    const docId = meta.id || path.relative(root, file).replace(/\\/g, "/");
    const pieces = chunkMarkdown(body);
    pieces.forEach((content, idx) => {
      chunks.push({
        id: `${docId}#${idx}`,
        docId,
        section,
        title: pieces.length > 1 ? `${title} (${idx + 1})` : title,
        source: meta.source,
        content,
        tokens: tokenize(content).length,
      });
    });
  }
  return chunks;
}

export function ingestKnowledge(): number {
  const database = getDb();
  const chunks = loadKnowledgeFromDisk();
  const wipe = database.prepare("DELETE FROM kb_chunks");
  const insert = database.prepare(`
    INSERT INTO kb_chunks (id, doc_id, section, title, source, content, tokens, embedding_json)
    VALUES (@id, @docId, @section, @title, @source, @content, @tokens, @embedding)
  `);
  const tx = database.transaction(() => {
    wipe.run();
    for (const c of chunks) {
      insert.run({
        id: c.id || nanoid(),
        docId: c.docId,
        section: c.section,
        title: c.title,
        source: c.source ?? null,
        content: c.content,
        tokens: c.tokens,
        embedding: c.embedding ? JSON.stringify(c.embedding) : null,
      });
    }
  });
  tx();
  return chunks.length;
}

export function getAllChunks(): KbChunk[] {
  const rows = getDb()
    .prepare(
      `SELECT id, doc_id as docId, section, title, source, content, tokens, embedding_json as embeddingJson FROM kb_chunks`
    )
    .all() as Array<KbChunk & { embeddingJson?: string | null; docId: string }>;

  if (!rows.length) {
    const loaded = loadKnowledgeFromDisk();
    if (loaded.length) ingestKnowledge();
    return loaded;
  }

  return rows.map((r) => ({
    id: r.id,
    docId: r.docId,
    section: r.section,
    title: r.title,
    source: r.source,
    content: r.content,
    tokens: r.tokens,
    embedding: r.embeddingJson ? (JSON.parse(r.embeddingJson) as number[]) : undefined,
  }));
}

function lexicalScore(query: string, chunk: KbChunk): number {
  const qTokens = tokenize(query);
  const q = new Set(qTokens);
  if (!q.size) return 0;
  const title = chunk.title.toLowerCase();
  const section = chunk.section.toLowerCase();
  const body = chunk.content.toLowerCase();
  const text = `${title} ${section} ${body}`;

  let hit = 0;
  let weight = 0;
  for (const term of q) {
    weight += 1;
    if (title.includes(term)) hit += 2.2;
    else if (section.includes(term)) hit += 1.4;
    else if (body.includes(term)) hit += 1;
  }

  const ql = query.toLowerCase();
  let boost = 0;
  if (/\b(service|services|offer|catalog|cha|broker)\b/.test(ql) && section === "services") {
    boost += 0.45;
  }
  if (/\b(aeo|a\.?e\.?o|certif|msme|mto|ffi)\b/.test(ql) && /aeo|certif|brochure|service/.test(`${section} ${title} ${body.slice(0, 400)}`)) {
    boost += 0.4;
  }
  if (/\b(cochin|kochi|chennai|port|willingdon|office)\b/.test(ql) && (section === "ports" || /cochin|chennai|port/.test(title))) {
    boost += 0.35;
  }
  if (/\b(about|who are you|neo logistics|neo group)\b/.test(ql) && section === "brochures") {
    boost += 0.3;
  }
  if (/\b(document|bill of entry|shipping bill|iec|gst|checklist)\b/.test(ql) && section === "rules") {
    boost += 0.25;
  }
  if (/\b(faq|how do i|what do i need|first.time|scenario)\b/.test(ql) && section === "faqs") {
    boost += 0.25;
  }
  if (/\b(steel|chemical|cashew|textile|mining|sanitary|agro)\b/.test(ql) && (section === "brochures" || /industry|playbook/.test(title))) {
    boost += 0.3;
  }
  if (/\b(incoterm|fob|cif|ddp|thc|demurrage|detention)\b/.test(ql) && section === "rules") {
    boost += 0.35;
  }
  if (/\b(first.time|first time|machinery|documents?\s+(do i|will i|need))\b/.test(ql) && (section === "faqs" || /documentation|matrix/.test(title))) {
    boost += 0.5;
  }
  if (/\b(cashew|agro|kernel|kernels)\b/.test(ql) && /cashew|agro|faq|playbook|industr/.test(`${title} ${body.slice(0, 500)}`)) {
    boost += 0.55;
  }
  if (/\b(track|tracking|status)\b/.test(ql) && section === "faqs") {
    boost += 0.2;
  }
  if (/\b(exporter|exporting|what does neo)\b/.test(ql) && (section === "services" || section === "brochures")) {
    boost += 0.35;
  }

  // Prefer denser topical matches over long FAQ dumps when scores tie
  const density = hit / Math.max(chunk.tokens, 1);
  return hit / weight + boost + Math.min(density, 0.15);
}

async function voyageEmbed(texts: string[]): Promise<number[][] | null> {
  if (!config.voyageApiKey) return null;
  try {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.voyageApiKey}`,
      },
      body: JSON.stringify({
        model: config.embeddingModel,
        input: texts,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data: Array<{ embedding: number[] }>;
    };
    return data.data.map((d) => d.embedding);
  } catch {
    return null;
  }
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function retrieveRelevantChunksWithScores(
  query: string,
  topK = 6
): Promise<RetrievalResult> {
  const chunks = getAllChunks().filter((c) => !isLowQualityChunk(c.content));
  if (!chunks.length) {
    return { chunks: [], topScore: 0, sufficient: false };
  }

  const lexical = chunks
    .map((c) => ({ c, score: lexicalScore(query, c) }))
    .sort((a, b) => b.score - a.score);

  const embeds = await voyageEmbed([query]);
  let ranked = lexical;

  if (embeds?.[0]) {
    const withVec = lexical.slice(0, 24);
    const need = withVec.filter((x) => !x.c.embedding);
    if (need.length) {
      const vecs = await voyageEmbed(need.map((x) => x.c.content.slice(0, 2000)));
      if (vecs) {
        need.forEach((item, i) => {
          item.c.embedding = vecs[i];
        });
      }
    }
    const qv = embeds[0];
    ranked = withVec
      .map(({ c, score }) => ({
        c,
        score: score * 0.45 + (c.embedding ? cosine(qv, c.embedding) : 0) * 0.55,
      }))
      .sort((a, b) => b.score - a.score);
  }

  const topScore = ranked[0]?.score ?? 0;
  const sufficient = topScore >= MIN_RELEVANCE_SCORE;
  const minScore = sufficient ? MIN_RELEVANCE_SCORE : 0.1;
  const selected = ranked.filter((x) => x.score >= minScore).slice(0, topK);

  return {
    chunks: selected.map((x) => x.c),
    topScore,
    sufficient,
  };
}

export async function retrieveRelevantChunks(
  query: string,
  topK = 6
): Promise<KbChunk[]> {
  const result = await retrieveRelevantChunksWithScores(query, topK);
  return result.sufficient ? result.chunks : [];
}

export function formatChunksForPrompt(chunks: KbChunk[]): string {
  if (!chunks.length) {
    return "NO_RELEVANT_KB_CHUNKS_FOUND";
  }
  return chunks
    .map((c, i) => {
      const src = c.source ? ` | source: ${c.source}` : "";
      return `[KB${i + 1} | section:${c.section} | title:${c.title}${src}]\n${c.content}`;
    })
    .join("\n\n");
}
