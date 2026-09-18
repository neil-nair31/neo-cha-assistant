import { Seo } from "../components/Seo.tsx";
import { HeroVideo } from "../components/HeroVideo.tsx";
import { IndustryStrip } from "../components/IndustryStrip.tsx";
import { CertificationsBar } from "../components/CertificationsBar.tsx";
import { HomeScrollNav } from "../components/HomeScrollNav.tsx";
import { MarqueeStrip } from "../components/MarqueeStrip.tsx";
import { ScrollReveal } from "../components/ScrollReveal.tsx";
import { TestimonialCarousel } from "../components/TestimonialCarousel.tsx";
import { WhyUsSection } from "../components/WhyUsSection.tsx";
import { assets } from "../data/assets.ts";
import { CtaBand, Section, SectionTitle, StoryPanel } from "../components/ui.tsx";
import { site } from "../data/site.ts";
import { services, shippingSteps } from "../data/services.ts";
import { testimonials } from "../data/testimonials.ts";

const HOME_SEO =
  "Neo Logistics — licensed customs broker, AEO–LO authorized freight forwarding, warehousing and multimodal transport. Cochin & Chennai. 15+ years, 24/7 operations.";

export function Home() {
  return (
    <article className="story-scroll">
      <Seo title="Licensed Customs Broker & Supply Chain Partner" description={HOME_SEO} />
      <HomeScrollNav />

      <HeroVideo />
      <IndustryStrip />
      <MarqueeStrip />

      {/* About / Neo Group */}
      <StoryPanel
        id="about"
        index={1}
        tone="tint"
        eyebrow="Neo Group"
        title={<>Turnover exceeding <span className="text-neo-red">INR 100 cr</span></>}
        image={assets.aboutImage}
        imageAlt="Logistics services in Kochi Kerala"
      >
        <p className="font-semibold text-neo">Neo Group has turnover of over INR 100 cr.</p>
        <p className="mt-4">
          Neo Logistics (est. 2007) is the flagship of Neo Group — a licensed customs broker specialising in
          transportation, warehousing, and mining logistics across India's major ports.
        </p>
        <ul className="mt-6 space-y-4">
          {site.groupCompanies.map((co) => (
            <li key={co.name} className="rounded-xl border border-neo-100 bg-white p-4 shadow-sm transition hover:border-neo-200 hover:shadow-neo">
              <p className="font-display font-semibold text-neo">
                {co.name} <span className="text-neo-red">· {co.year}</span>
              </p>
              <p className="mt-1 text-sm text-slate-600">{co.description}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 font-display font-bold text-neo">Neo Logistics is the Flagship Company of Neo Group.</p>
      </StoryPanel>

      {/* Services */}
      <Section id="services" className="mesh-light !py-16">
        <ScrollReveal>
          <div className="text-center">
            <p className="eyebrow-light">Our services</p>
            <SectionTitle center>
              Full-spectrum logistics from <span className="gradient-text">port to destination</span>
            </SectionTitle>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Licensed customs brokerage, AEO–LO benefits, freight forwarding, steamer and stevedore agency,
              warehousing, and multimodal transport — under one accountable partner.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {services.map((svc, i) => (
            <ScrollReveal key={svc.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <article className="service-card group text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neo-50 ring-1 ring-neo-100 transition group-hover:bg-neo-100 group-hover:ring-neo-200">
                  <img src={svc.iconSrc} alt="" className="h-10 w-10 object-contain" loading="lazy" width={40} height={40} aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-sm font-bold leading-snug text-neo sm:text-base">{svc.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-600 sm:text-sm">{svc.description}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      <CertificationsBar />

      <WhyUsSection />

      <MarqueeStrip dark={false} />

      {/* Testimonials */}
      <Section id="testimonials">
        <ScrollReveal>
          <div className="text-center">
            <p className="eyebrow-light">Client trust</p>
            <SectionTitle center>What clients say about us</SectionTitle>
            <p className="mx-auto mt-4 max-w-xl text-slate-600">
              Trusted by JSW Steel, NGS White Cement, Solange Chemicals, CFC Cashews, and Himatsingka Seide.
            </p>
          </div>
        </ScrollReveal>
        <div className="mt-10">
          <TestimonialCarousel items={testimonials} />
        </div>
      </Section>

      {/* How to ship */}
      <Section id="how-to-ship" dark className="!pb-20">
        <ScrollReveal>
          <div className="text-center">
            <p className="eyebrow">How to ship</p>
            <SectionTitle light center>
              Three steps to <span className="gradient-text">start shipping</span>
            </SectionTitle>
            <p className="mx-auto mt-4 max-w-xl text-neo-100/85">
              Follow an easy three-step process to ship with Neo Logistics.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {shippingSteps.map((step, i) => (
            <ScrollReveal key={step.step} delay={(i % 3) as 0 | 1 | 2}>
              <div className="step-card">
                <img src={step.image} alt="" className="mx-auto h-24 w-24 object-contain" loading="lazy" width={96} height={96} aria-hidden />
                <span className="mt-4 block font-display text-sm font-bold text-neo-blue-accent">{step.step}</span>
                <h3 className="mt-2 font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neo-100/75">{step.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      <CtaBand
        title="24/7 Operations, Satisfaction Forever"
        subtitle="Experience the quality of our service — sincerity and integrity you can trust."
        href="/contact-us"
        label="Get a Callback"
      />
    </article>
  );
}
