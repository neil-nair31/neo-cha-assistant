import { industries } from "../data/assets.ts";
import { ScrollReveal } from "./ScrollReveal.tsx";

export function IndustryStrip() {
  return (
    <section id="industries" className="relative bg-neo py-8 sm:py-10">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:48px_48px] opacity-40" />
      <div className="container-wide relative">
        <ScrollReveal>
          <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">
            Industries we serve across India
          </p>
        </ScrollReveal>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          {industries.map((ind, i) => (
            <ScrollReveal key={ind.label} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <div className="industry-tile group">
                <img
                  src={ind.image}
                  alt={ind.label}
                  className="h-14 w-14 object-contain transition duration-300 group-hover:scale-110 sm:h-16 sm:w-16"
                  loading="lazy"
                  width={64}
                  height={64}
                />
                <span className="text-center font-display text-xs font-semibold uppercase tracking-wider text-white sm:text-sm">
                  {ind.label}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
