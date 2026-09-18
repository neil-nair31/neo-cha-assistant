import { assets } from "../data/assets.ts";
import { PageShell, ProseBlock, InfoCard } from "../components/PageShell.tsx";
import { aboutContent } from "../data/pages.ts";

export function About() {
  return (
    <PageShell
      seoTitle="About Us — Who We Are"
      seoDescription="Neo Logistics — licensed customs broker since 2007. Vision, mission, certifications and membership."
      breadcrumb={[{ label: "Home", to: "/" }, { label: "About us" }, { label: "Who we are" }]}
      kicker="About Neo Logistics"
      title="About us"
    >
      <ProseBlock>
        <h3>{aboutContent.sections[0].heading}</h3>
        {aboutContent.sections[0].paragraphs?.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
        <h3>{aboutContent.sections[1].heading}</h3>
        <p>{aboutContent.sections[1].body}</p>
        <h3>{aboutContent.sections[2].heading}</h3>
        <p>{aboutContent.sections[2].body}</p>
      </ProseBlock>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <InfoCard title="Certifications">
          <ul className="flex flex-wrap gap-2">
            {aboutContent.certifications.map((c) => (
              <li key={c} className="rounded-full bg-neo-50 px-3 py-1 text-xs font-semibold text-neo">{c}</li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {assets.certifications.map((cert) => (
              <img key={cert.alt} src={cert.src} alt={cert.alt} className="h-14 object-contain" />
            ))}
          </div>
        </InfoCard>
        <InfoCard title="Membership">
          <ul className="space-y-2">
            {aboutContent.membership.map((m) => (
              <li key={m} className="font-medium text-neo">{m}</li>
            ))}
          </ul>
        </InfoCard>
      </div>
    </PageShell>
  );
}
