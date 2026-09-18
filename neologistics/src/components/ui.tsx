import type { ReactNode } from "react";
import { ScrollReveal } from "./ScrollReveal.tsx";

export function Section({
  children,
  className = "",
  id,
  dark,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  dark?: boolean;
}) {
  return (
    <section id={id} className={`${dark ? "page-content-section-dark" : "page-content-section"} ${className}`}>
      <ScrollReveal>
        <div className="container-page">{children}</div>
      </ScrollReveal>
    </section>
  );
}

export function SectionTitle({ children, center, light }: { children: ReactNode; center?: boolean; light?: boolean }) {
  return (
    <h2
      className={`font-display text-3xl font-bold tracking-tight sm:text-4xl ${
        light ? "text-white" : "text-neo-900"
      } ${center ? "text-center" : ""}`}
    >
      {children}
    </h2>
  );
}

export function CtaBand({
  title,
  subtitle,
  href,
  label,
}: {
  title: string;
  subtitle?: string;
  href: string;
  label: string;
}) {
  return (
    <section id="callback" className="relative overflow-hidden bg-neo">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(200,16,46,0.15)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-grid-dark bg-grid opacity-20" />
      <ScrollReveal>
        <div className="container-page relative flex flex-col items-center gap-6 py-16 text-center sm:flex-row sm:justify-between sm:text-left lg:py-20">
          <div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{title}</h2>
            {subtitle && <p className="mt-2 max-w-xl text-base text-white/80 sm:text-lg">{subtitle}</p>}
          </div>
          <a href={href} className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-neo shadow-card transition hover:scale-[1.03] hover:bg-neo-50 hover:text-neo-red">
            {label}
          </a>
        </div>
      </ScrollReveal>
    </section>
  );
}

export function StoryPanel({
  id,
  eyebrow,
  title,
  children,
  image,
  imageAlt,
  visual,
  reverse,
  tone = "light",
  index,
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  children: ReactNode;
  image?: string;
  imageAlt?: string;
  visual?: ReactNode;
  reverse?: boolean;
  tone?: "light" | "tint" | "dark";
  index?: number;
}) {
  const dark = tone === "dark";
  const tint = tone === "tint";
  const bg = dark ? "mesh-neo" : tint ? "bg-gradient-to-b from-neo-50/80 to-white text-ink" : "bg-white text-ink";
  const media = visual ?? (image ? (
    <img src={image} alt={imageAlt ?? ""} className="w-full rounded-2xl object-contain p-4" loading="lazy" width={640} height={480} />
  ) : null);

  return (
    <section id={id} className={`story-panel ${bg}`}>
      {dark && (
        <>
          <div className="glow-orb -left-40 top-1/4 h-80 w-80 animate-pulse-glow bg-neo-blue-accent/15" />
          <div className="glow-orb -right-32 bottom-0 h-72 w-72 animate-pulse-glow bg-neo-red/10" />
        </>
      )}

      <div className="container-wide relative grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <ScrollReveal className={reverse ? "lg:order-last" : ""}>
          {typeof index === "number" && (
            <span className={`mb-3 block font-display text-5xl font-bold leading-none ${dark ? "text-white/10" : "text-neo-100"}`}>
              {String(index).padStart(2, "0")}
            </span>
          )}
          {eyebrow && <p className={dark ? "eyebrow" : "eyebrow-light"}>{eyebrow}</p>}
          <h2 className={`mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem] ${dark ? "text-white" : "text-neo-900"}`}>
            {title}
          </h2>
          <div className={`mt-5 max-w-xl text-base leading-relaxed sm:text-lg ${dark ? "text-neo-100/90" : "text-slate-600"}`}>
            {children}
          </div>
        </ScrollReveal>

        {media && (
          <ScrollReveal delay={2} className={reverse ? "lg:order-first" : ""}>
            <div className={`overflow-hidden rounded-2xl ${dark ? "glass-panel" : "glass-panel-light shadow-neo"}`}>
              {media}
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}

export function CardGrid({ items, dark }: { items: { title: string; body: string }[]; dark?: boolean }) {
  return (
    <div className="container-page grid gap-5 sm:grid-cols-2">
      {items.map((it, i) => (
        <ScrollReveal key={it.title} delay={(i % 4) as 0 | 1 | 2 | 3}>
          <div className={`relative z-10 h-full ${dark ? "protocol-card-dark" : "protocol-card-light"}`}>
            <span className={`mb-3 block font-display text-2xl font-bold ${dark ? "text-neo-blue-accent" : "text-neo-red"}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className={`font-display text-lg font-semibold ${dark ? "text-white" : "text-neo-900"}`}>{it.title}</h3>
            <p className={`mt-2 text-sm leading-relaxed ${dark ? "text-neo-100/80" : "text-slate-600"}`}>{it.body}</p>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}

export function FormCard({ children }: { children: ReactNode }) {
  return (
    <ScrollReveal>
      <div className="form-card">{children}</div>
    </ScrollReveal>
  );
}

export function PageHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-neo pt-16 text-white">
      <div className="absolute inset-0 bg-grid-dark bg-grid opacity-30" />
      <div className="container-page relative py-14 text-center lg:py-20">
        <ScrollReveal className="mx-auto max-w-3xl">
          {kicker && <p className="eyebrow">{kicker}</p>}
          <h1 className="hero-headline mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
          {subtitle && <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-neo-100 sm:text-lg">{subtitle}</p>}
        </ScrollReveal>
      </div>
      <div className="h-1 bg-gradient-to-b from-neo to-white" />
    </section>
  );
}
