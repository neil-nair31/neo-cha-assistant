import { PageShell, EmptyState } from "../components/PageShell.tsx";

export function News() {
  return (
    <PageShell
      seoTitle="News"
      seoDescription="Latest news from Neo Logistics — customs, logistics and port updates."
      breadcrumb={[{ label: "Home", to: "/" }, { label: "Media center", to: "/news" }, { label: "News" }]}
      title="News"
    >
      <EmptyState message="No news articles are published at this time. Check back soon for updates from Neo Logistics." />
    </PageShell>
  );
}
