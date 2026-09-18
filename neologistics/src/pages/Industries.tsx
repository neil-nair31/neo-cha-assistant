import { PageShell, InfoCard } from "../components/PageShell.tsx";
import { industriesContent } from "../data/pages.ts";

export function Industries() {
  return (
    <PageShell
      seoTitle="Industries"
      seoDescription="Neo Logistics industry expertise — chemicals, automobiles, mining, textiles, agro products and more."
      breadcrumb={[{ label: "Home", to: "/" }, { label: "Industries" }]}
      title="Industries"
      subtitle={industriesContent.intro}
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {industriesContent.items.map((item) => (
            <InfoCard key={item.title} title={item.title}>
              <p>{item.body}</p>
            </InfoCard>
          ))}
      </div>
    </PageShell>
  );
}
