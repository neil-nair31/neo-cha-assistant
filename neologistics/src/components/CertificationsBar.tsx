import { assets } from "../data/assets.ts";
import { ScrollReveal } from "./ScrollReveal.tsx";

export function CertificationsBar() {
  return (
    <section className="border-y border-neo-100 bg-neo-50/60 py-10">
      <div className="container-page">
        <ScrollReveal>
          <p className="mb-8 text-center text-[11px] font-bold uppercase tracking-[0.28em] text-neo">
            Accreditations &amp; Registrations
          </p>
        </ScrollReveal>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {assets.certifications.map((cert, i) => (
            <ScrollReveal key={cert.alt} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <div className="cert-badge">
                <img src={cert.src} alt={cert.alt} className="max-h-14 w-auto object-contain" loading="lazy" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
