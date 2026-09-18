import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell, EmptyState } from "../components/PageShell.tsx";
import { DigestSubscribe } from "../components/DigestSubscribe.tsx";
import { formatAssistReply } from "../components/assistant/formatReply.tsx";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  impact: string;
  industries: string[];
  source: string;
  publishedAt: string;
  sourceUrl: string;
  noticeNo: string;
};

type IndustryOpt = { id: string; label: string };

const INDUSTRY_FALLBACK: Record<string, string> = {
  cashew: "Cashew",
  steel: "Steel",
  chemicals: "Chemicals",
  automobiles: "Automobiles",
  mining: "Mining",
  textiles: "Textiles",
  agro: "Agro",
  seafood: "Seafood",
  cement: "Cement",
  "sanitary-wares": "Sanitary wares",
  "industrial-raw-materials": "Industrial raw materials",
  "general-trade": "General trade",
};

function labelFor(id: string, industries: IndustryOpt[]) {
  return industries.find((i) => i.id === id)?.label || INDUSTRY_FALLBACK[id] || id;
}

function formatDate(iso: string) {
  const d = Date.parse(iso);
  if (Number.isNaN(d)) return iso;
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function Blogs() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [industries, setIndustries] = useState<IndustryOpt[]>([]);
  const [industry, setIndustry] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  async function load(nextQ = q, nextIndustry = industry) {
    setError("");
    try {
      const params = new URLSearchParams();
      if (nextQ.trim()) params.set("q", nextQ.trim());
      if (nextIndustry) params.set("industry", nextIndustry);
      const res = await fetch(`/api/notifications/blog-posts?${params}`);
      if (!res.ok) throw new Error("offline");
      const data = await res.json();
      const list = (data.posts ?? []) as BlogPost[];
      setPosts(list);
      setIndustries(data.industries ?? []);
      setActiveId((prev) => prev ?? list[0]?.id ?? null);
    } catch {
      setPosts([]);
      setError(
        "Customs briefings are temporarily unavailable. Email customercare@neologistics.org and Neo’s desk will help."
      );
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const featured = useMemo(
    () => posts.find((p) => p.id === activeId) ?? posts[0] ?? null,
    [posts, activeId]
  );
  const rest = useMemo(
    () => posts.filter((p) => p.id !== featured?.id),
    [posts, featured?.id]
  );

  return (
    <>
      <PageShell
        seoTitle="Blogs — Customs & DGFT updates | Neo Logistics"
        seoDescription="Plain-English CBIC and DGFT blog updates for Neo Logistics clients in Cochin and Chennai. Subscribe to the email digest."
        breadcrumb={[
          { label: "Home", to: "/" },
          { label: "Media center", to: "/news" },
          { label: "Blogs" },
        ]}
        kicker="Neo Logistics · Cochin & Chennai"
        title="Blogs"
        subtitle="Desk briefings on what changed in Indian customs and trade policy — written so a busy importer can act. For a fast scan list, see Customs Notifications."
      >
        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 border-b border-neo-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setIndustry("");
                void load(q, "");
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                !industry
                  ? "bg-neo text-white"
                  : "border border-neo-100 bg-white text-neo-600 hover:border-neo-300"
              }`}
            >
              All
            </button>
            {industries
              .filter((i) => i.id !== "general-trade")
              .slice(0, 8)
              .map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => {
                    setIndustry(i.id);
                    void load(q, i.id);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                    industry === i.id
                      ? "bg-neo text-white"
                      : "border border-neo-100 bg-white text-neo-600 hover:border-neo-300"
                  }`}
                >
                  {i.label}
                </button>
              ))}
          </div>
          <div className="flex gap-2">
            <input
              className="field-input max-w-xs"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search blogs…"
              onKeyDown={(e) => {
                if (e.key === "Enter") void load();
              }}
            />
            <button type="button" className="btn-ghost-light" onClick={() => void load()}>
              Search
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}

        {!error && posts.length === 0 ? (
          <EmptyState message="No blog posts published yet. The content machine will post when CBIC/DGFT drops something Neo clients should see." />
        ) : featured ? (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)]">
            {/* Featured reading pane */}
            <article className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-neo-500">
                <span className="text-neo-red">{featured.source}</span>
                <span aria-hidden>·</span>
                <time dateTime={featured.publishedAt}>{formatDate(featured.publishedAt)}</time>
                <span aria-hidden>·</span>
                <span>{featured.noticeNo}</span>
              </div>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-neo sm:text-4xl">
                {featured.title}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-neo-700">{featured.excerpt}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {featured.industries
                  .filter((t) => t !== "general-trade" && !["auto-digest", "cbic", "dgft"].includes(t))
                  .map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-neo-100 bg-neo-50 px-3 py-1 text-xs font-medium text-neo-700"
                    >
                      {labelFor(t, industries)}
                    </span>
                  ))}
              </div>

              <div className="mt-8 border-t border-neo-100 pt-8">
                <div className="prose-neo max-w-none text-[1.05rem] leading-[1.75] text-neo-900">
                  {formatAssistReply(featured.body)}
                </div>
              </div>

              <aside className="mt-8 border-l-4 border-neo-red bg-neo-50/80 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neo-red">
                  Neo desk takeaway
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neo-800">{featured.impact}</p>
              </aside>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  className="btn-primary"
                  href={featured.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read official notice
                </a>
                <Link
                  to={`/contact-us?notice=${encodeURIComponent(featured.noticeNo)}&title=${encodeURIComponent(featured.title.slice(0, 120))}`}
                  className="text-sm font-semibold text-neo-blue hover:underline"
                >
                  Ask Neo CHA about this →
                </Link>
              </div>
            </article>

            {/* Side list */}
            <aside className="lg:border-l lg:border-neo-100 lg:pl-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neo-500">
                More posts
              </p>
              <ul className="mt-4 divide-y divide-neo-100">
                {rest.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(p.id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="w-full py-4 text-left transition hover:opacity-80"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-neo-400">
                        {p.source} · {formatDate(p.publishedAt)}
                      </p>
                      <p className="mt-1 font-display text-base font-semibold leading-snug text-neo">
                        {p.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-neo-600">{p.excerpt}</p>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-neo-600">
                Prefer a feed view?{" "}
                <Link to="/customs-notification" className="font-semibold text-neo-red hover:underline">
                  Customs Notifications
                </Link>
              </p>
            </aside>
          </div>
        ) : null}

        <p className="mt-12 text-xs leading-relaxed text-neo-500">
          Educational awareness only — not official CBIC/DGFT text, not a duty quote, not legal
          advice. Always open the official source and confirm with Neo’s licensed CHA before acting
          on a shipment.
        </p>
      </PageShell>

      {/* Full-bleed subscribe — outside cramped card layout */}
      <DigestSubscribe variant="band" />
    </>
  );
}
