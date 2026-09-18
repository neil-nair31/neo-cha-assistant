import { PageShell, InfoCard, ProseBlock } from "../components/PageShell.tsx";
import { expertiseContent } from "../data/pages.ts";

export function Expertise() {
  return (
    <PageShell
      seoTitle="Our Expertise"
      seoDescription="Neo Logistics supply chain expertise — customs brokerage, warehousing, freight forwarding, vessel and stevedore agency."
      breadcrumb={[{ label: "Home", to: "/" }, { label: "Our Expertise" }]}
      title="Our Expertise"
      subtitle={expertiseContent.intro}
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {expertiseContent.services.map((s) => (
          <InfoCard key={s.title} title={s.title}>
            <p>{s.body}</p>
          </InfoCard>
        ))}
      </div>

      <ProseBlock className="mt-10">
        <h3>Modes of transportation</h3>
        <p>{expertiseContent.transportation}</p>
      </ProseBlock>
    </PageShell>
  );
}
