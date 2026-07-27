import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NeoDigest/3.0";

/**
 * Pull plain text from an official notice page for richer AI posts.
 * Soft-fails — empty string if fetch/parse fails.
 */
export async function fetchNoticeBodyText(url: string, maxChars = 4500): Promise<string> {
  if (!url || !/^https?:\/\//i.test(url)) return "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return "";
    const ct = res.headers.get("content-type") || "";
    if (/pdf/i.test(ct) || /\.pdf(\?|$)/i.test(url)) {
      // Skip binary PDFs — subject + title still used
      return "";
    }
    const html = await res.text();
    if (html.length < 200) return "";
    const $ = cheerio.load(html);
    $("script, style, nav, header, footer, noscript, iframe").remove();
    const text = $("main, article, .content, #content, body")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, maxChars);
  } catch {
    return "";
  }
}
