import * as cheerio from "cheerio";
import { createHash } from "node:crypto";
import type { RawNotice, SourceHealth } from "./types.js";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NeoDigest/3.0";

function hashId(source: string, noticeNo: string, url: string): string {
  return createHash("sha1")
    .update(`${source}|${noticeNo}|${url}`)
    .digest("hex")
    .slice(0, 16);
}

function absUrl(base: string, href: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

export function parseDate(raw: string): string {
  const t = raw.trim();
  const m = t.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (m) {
    const dd = m[1]!.padStart(2, "0");
    const mm = m[2]!.padStart(2, "0");
    let yyyy = m[3]!;
    if (yyyy.length === 2) yyyy = `20${yyyy}`;
    return `${yyyy}-${mm}-${dd}`;
  }
  const iso = Date.parse(t);
  if (!Number.isNaN(iso)) return new Date(iso).toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function isJunkTitle(title: string): boolean {
  const t = title.trim();
  if (t.length < 12) return true;
  if (/^download\b/i.test(t)) return true;
  if (/type\s*:\s*pdf/i.test(t)) return true;
  if (/^view\s*link$/i.test(t)) return true;
  if (/^attachment$/i.test(t)) return true;
  return false;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-IN,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const text = await res.text();
  if (text.length < 400) throw new Error(`Response too small (${text.length}b) for ${url}`);
  return text;
}

async function timedChannel(
  channel: string,
  source: SourceHealth["source"],
  fn: () => Promise<RawNotice[]>
): Promise<{ notices: RawNotice[]; health: SourceHealth }> {
  const t0 = Date.now();
  try {
    const notices = await fn();
    return {
      notices,
      health: {
        channel,
        source,
        ok: notices.length > 0,
        count: notices.length,
        latencyMs: Date.now() - t0,
        error: notices.length ? undefined : "0 rows parsed",
      },
    };
  } catch (err) {
    return {
      notices: [],
      health: {
        channel,
        source,
        ok: false,
        count: 0,
        latencyMs: Date.now() - t0,
        error: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

/** CBIC ECCS courier notifications — reliable HTML table */
export async function scrapeCbicEccsNotifications(limit = 20): Promise<RawNotice[]> {
  const url = "https://courier.cbic.gov.in/notification.jsp";
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const out: RawNotice[] = [];

  $("#notification_table tbody tr, table.notification tbody tr").each((_, tr) => {
    if (out.length >= limit) return;
    const tds = $(tr).find("td");
    if (tds.length < 5) return;
    const noticeNo = $(tds[1]).text().replace(/\s+/g, " ").trim();
    const date = $(tds[2]).text().replace(/\s+/g, " ").trim();
    const subject = $(tds[4]).text().replace(/\s+/g, " ").trim();
    const link =
      $(tds[tds.length - 1]).find("a[href]").first().attr("href") ||
      $(tr).find("a[href]").first().attr("href") ||
      url;
    if (!noticeNo || isJunkTitle(subject)) return;
    const sourceUrl = absUrl(url, link);
    out.push({
      id: hashId("cbic-eccs-n", noticeNo, sourceUrl),
      source: "cbic",
      noticeNo,
      title: subject,
      publishedAt: parseDate(date),
      sourceUrl,
      rawSubject: `${noticeNo}. ${subject}`,
      channel: "cbic-eccs-notifications",
    });
  });

  if (!out.length) throw new Error("CBIC ECCS notifications table empty / markup changed");
  return out;
}

export async function scrapeCbicEccsCirculars(limit = 15): Promise<RawNotice[]> {
  const url = "https://courier.cbic.gov.in/circular.jsp";
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const out: RawNotice[] = [];

  $("table tbody tr").each((_, tr) => {
    if (out.length >= limit) return;
    const tds = $(tr).find("td");
    if (tds.length < 5) return;
    const noticeNo = $(tds[1]).text().replace(/\s+/g, " ").trim();
    const date = $(tds[2]).text().replace(/\s+/g, " ").trim();
    const subject = $(tds[4]).text().replace(/\s+/g, " ").trim();
    const link =
      $(tds[tds.length - 1]).find("a[href]").first().attr("href") ||
      $(tr).find("a[href]").first().attr("href") ||
      url;
    if (!noticeNo || isJunkTitle(subject)) return;
    const sourceUrl = absUrl(url, link);
    out.push({
      id: hashId("cbic-eccs-c", noticeNo, sourceUrl),
      source: "cbic",
      noticeNo,
      title: subject,
      publishedAt: parseDate(date),
      sourceUrl,
      rawSubject: `${noticeNo}. ${subject}`,
      channel: "cbic-eccs-circulars",
    });
  });

  if (!out.length) throw new Error("CBIC ECCS circulars table empty / markup changed");
  return out;
}

/**
 * DGFT CMS metadata tables (server-rendered via webHP).
 * catId: 1=Notification, 2=Public Notice, 4=Trade Notice
 */
export async function scrapeDgftCategory(
  catId: 1 | 2 | 4,
  channel: string,
  limit = 15
): Promise<RawNotice[]> {
  const url = `https://www.dgft.gov.in/CP/webHP?requestType=ApplicationRH&actionVal=serachMetadata&screenId=90000734&catId=${catId}`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const out: RawNotice[] = [];

  $("#metaTable tbody tr, table#metaTable tr").each((_, tr) => {
    if (out.length >= limit) return;
    const tds = $(tr).find("td");
    if (tds.length < 5) return;
    const noticeNo = $(tds[1]).text().replace(/\s+/g, " ").trim();
    const subject = $(tds[3]).text().replace(/\s+/g, " ").trim();
    const date = $(tds[4]).text().replace(/\s+/g, " ").trim();
    const link = $(tr).find("a.attachmentBtn[href], a[href*='content.dgft'], a[href*='.pdf']").first().attr("href") || url;
    const cleanSubject = subject.replace(/^[\s:–—-]+/, "").trim();
    if (!noticeNo || isJunkTitle(cleanSubject)) return;
    const sourceUrl = absUrl("https://www.dgft.gov.in/", link);
    const label =
      catId === 1 ? "Notification" : catId === 2 ? "Public Notice" : "Trade Notice";
    out.push({
      id: hashId(`dgft-${catId}`, noticeNo, sourceUrl),
      source: "dgft",
      noticeNo: `${label} ${noticeNo}`,
      title: cleanSubject,
      publishedAt: parseDate(date),
      sourceUrl,
      rawSubject: `${label} ${noticeNo} dated ${date}. ${cleanSubject}`,
      channel,
    });
  });

  // Fallback: any rows in page tables with 5+ cells
  if (!out.length) {
    $("table tr").each((_, tr) => {
      if (out.length >= limit) return;
      const tds = $(tr).find("td");
      if (tds.length < 5) return;
      const noticeNo = $(tds[1]).text().replace(/\s+/g, " ").trim();
      const subject = $(tds[3]).text().replace(/\s+/g, " ").trim().replace(/^[\s:–—-]+/, "");
      const date = $(tds[4]).text().replace(/\s+/g, " ").trim();
      const link = $(tr).find("a[href]").first().attr("href");
      if (!noticeNo || !subject || isJunkTitle(subject) || !link) return;
      if (!/\d/.test(noticeNo)) return;
      const sourceUrl = absUrl("https://content.dgft.gov.in/", link);
      out.push({
        id: hashId(`dgft-${catId}`, noticeNo, sourceUrl),
        source: "dgft",
        noticeNo,
        title: subject,
        publishedAt: parseDate(date),
        sourceUrl,
        rawSubject: `${noticeNo}. ${subject}`,
        channel,
      });
    });
  }

  if (!out.length) throw new Error(`DGFT catId=${catId} returned 0 parseable rows`);
  return out;
}

export type ScrapeBundle = {
  notices: RawNotice[];
  health: SourceHealth[];
  okChannels: number;
  totalChannels: number;
};

export async function scrapeAllSources(limitPerSource = 15): Promise<ScrapeBundle> {
  const jobs = await Promise.all([
    timedChannel("cbic-eccs-notifications", "cbic", () =>
      scrapeCbicEccsNotifications(limitPerSource)
    ),
    timedChannel("cbic-eccs-circulars", "cbic", () =>
      scrapeCbicEccsCirculars(Math.min(12, limitPerSource))
    ),
    timedChannel("dgft-notifications", "dgft", () =>
      scrapeDgftCategory(1, "dgft-notifications", limitPerSource)
    ),
    timedChannel("dgft-public-notices", "dgft", () =>
      scrapeDgftCategory(2, "dgft-public-notices", Math.min(12, limitPerSource))
    ),
    timedChannel("dgft-trade-notices", "dgft", () =>
      scrapeDgftCategory(4, "dgft-trade-notices", Math.min(12, limitPerSource))
    ),
  ]);

  const health = jobs.map((j) => j.health);
  const seen = new Set<string>();
  const merged: RawNotice[] = [];
  for (const job of jobs) {
    for (const n of job.notices) {
      if (seen.has(n.id) || isJunkTitle(n.title)) continue;
      seen.add(n.id);
      merged.push(n);
    }
  }

  merged.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const okChannels = health.filter((h) => h.ok).length;
  if (okChannels === 0) {
    throw new Error(
      `All scrape channels failed: ${health.map((h) => `${h.channel}=${h.error}`).join("; ")}`
    );
  }

  return {
    notices: merged,
    health,
    okChannels,
    totalChannels: health.length,
  };
}
