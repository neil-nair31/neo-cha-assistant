import { PageShell, EmptyState } from "../components/PageShell.tsx";

export function Careers() {
  return (
    <PageShell
      seoTitle="Career"
      seoDescription="Career opportunities at Neo Logistics — licensed customs broker Cochin and Chennai."
      breadcrumb={[{ label: "Home", to: "/" }, { label: "Career" }]}
      title="Career"
    >
      <EmptyState message="There are no open positions listed at this time. Send your résumé to customercare@neologistics.org to be considered for future roles." />
    </PageShell>
  );
}
