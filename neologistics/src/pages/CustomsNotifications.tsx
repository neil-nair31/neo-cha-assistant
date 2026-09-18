import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell.tsx";
import { DigestSubscribe } from "../components/DigestSubscribe.tsx";

type Notif = {
  id: string;
  title: string;
  summary: string;
  impact: string;
  tags: string[];
  source: string;
  publishedAt: string;
  sourceUrl: string;
  neoUrl?: string;
};

function formatDate(iso: string) {
  const d = Date.parse(iso);
  if (Number.isNaN(d)) return iso;
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CustomsNotifications() {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [items, setItems] = useState<Notif[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function load(nextQ = q, nextTag = tag) {
    setError("");
    try {
      const params = new URLSearchParams();
      if (nextQ.trim()) params.set("q", nextQ.trim());
      if (nextTag) params.set("tag", nextTag);
      const res = await fetch(`/api/notifications/notifications?${params}`);
      if (!res.ok) throw new Error("offline");
      const data = await res.json();
      setItems(data.items ?? []);
      setTags((data.tags ?? []).filter((t: string) => !["auto-digest", "cbic", "dgft"].includes(t)));
    } catch {
      setItems([]);
      setError(
        "Customs briefings are temporarily unavailable. Email customercare@neologistics.org and Neo’s desk will help."
      );
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageShell
        seoTitle="Customs Notifications Digest"
        seoDescription="Curated India customs and trade blog updates from Neo Logistics. Subscribe by email. Verify official CBIC/DGFT text with our CHA desk."
        breadcrumb={[
          { label: "Home", to: "/" },
          { label: "Media center", to: "/news" },
          { label: "Customs Notifications" },
        ]}
        kicker="Neo Logistics · Cochin & Chennai"
        title="Customs Notifications"
        subtitle="The same customs blog feed in list form — scan updates fast, then open a post on Blogs for the full desk briefing."
      >
        <div className="mb-8 flex flex-wrap gap-2">
          <input
            className="field-input max-w-md"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search COO, fumigation, AEO…"
            onKeyDown={(e) => {
              if (e.key === "Enter") void load();
            }}
          />
          <select
            className="field-input w-auto"
            value={tag}
            onChange={(e) => {
              setTag(e.target.value);
              void load(q, e.target.value);
            }}
          >
            <option value="">All topics</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button type="button" className="btn-ghost-light" onClick={() => void load()}>
            Search
          </button>
        </div>

        {error && (
          <p className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="divide-y divide-neo-100 border-y border-neo-100">
          {items.map((n) => (
            <article key={n.id} className="py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neo-400">
                {n.source} · {formatDate(n.publishedAt)}
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-neo">
                {n.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neo-800">{n.summary}</p>
              <p className="mt-3 text-sm text-neo-700">
                <span className="font-semibold text-neo">Desk takeaway: </span>
                {n.impact}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <a
                  className="font-semibold text-neo-red hover:underline"
                  href={n.neoUrl || n.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Official source →
                </a>
                <Link to="/blogs" className="font-semibold text-neo-blue hover:underline">
                  Open in Blogs →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-xs leading-relaxed text-neo-500">
          Educational awareness only. Confirm official CBIC/DGFT text with Neo’s licensed CHA before
          filing.
        </p>
      </PageShell>

      <DigestSubscribe variant="band" />
    </>
  );
}
