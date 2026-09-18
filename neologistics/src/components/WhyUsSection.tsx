import { ScrollReveal } from "./ScrollReveal.tsx";
import { ValueIconDark } from "./ValueIcon.tsx";
import { whyChooseUs } from "../data/whyChooseUs.ts";

export function WhyUsSection() {
  return (
    <section id="why-us" className="page-content-section-dark">
      <div className="glow-orb -left-32 top-0 h-80 w-80 animate-pulse-glow bg-neo-blue-accent/10" />
      <div className="glow-orb -right-24 bottom-0 h-72 w-72 animate-pulse-glow bg-neo-red/10" />

      <div className="container-page relative">
        <ScrollReveal>
          <div className="max-w-3xl">
            <p className="eyebrow">Why choose us</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
              This is what we can do for your business
            </h2>
            <p className="mt-4 text-base leading-relaxed text-neo-100/85 sm:text-lg">
              15+ years of experience and going on. For real service, sincerity and integrity are nuances
              which cannot be bought or measured with money.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {whyChooseUs.map((item, i) => (
            <ScrollReveal key={item.title} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <article className="value-card">
                <div className="flex items-start gap-4">
                  <ValueIconDark icon={item.icon} />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neo-red-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-1 font-display text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-neo-100/80">{item.body}</p>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
