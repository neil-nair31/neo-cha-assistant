import { PageShell, LinkCard, ProseBlock } from "../components/PageShell.tsx";
import { financialsContent } from "../data/pages.ts";

export function Financials() {
  return (
    <PageShell
      seoTitle="Financials"
      seoDescription="Neo Logistics financial reports and ITR presentations."
      breadcrumb={[{ label: "Home", to: "/" }, { label: "Financials" }]}
      title="Financials"
      subtitle={financialsContent.intro}
    >
      <div className="grid gap-5 sm:grid-cols-3">
        {financialsContent.reports.map((r) => (
          <LinkCard key={r.title} title={r.title} href={r.href} />
        ))}
      </div>
      <ProseBlock className="mt-8">
        <p>View detailed performance reports and presentations for each financial year.</p>
      </ProseBlock>
    </PageShell>
  );
}
