import type { ReactNode } from "react";
import { Seo } from "./Seo.tsx";
import { Breadcrumb } from "./Breadcrumb.tsx";
import { PageHeader } from "./ui.tsx";
import { ScrollReveal } from "./ScrollReveal.tsx";

export function PageShell({
  seoTitle,
  seoDescription,
  breadcrumb,
  kicker,
  title,
  subtitle,
  children,
}: {
  seoTitle: string;
  seoDescription: string;
  breadcrumb: { label: string; to?: string }[];
  kicker?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Seo title={seoTitle} description={seoDescription} />
      <PageHeader kicker={kicker} title={title} subtitle={subtitle} />
      <section className="page-content-section">
        <div className="container-page">
          <Breadcrumb items={breadcrumb} />
          {children}
        </div>
      </section>
    </>
  );
}

export function ProseBlock({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <ScrollReveal>
      <div className={`prose-neo ${className}`}>{children}</div>
    </ScrollReveal>
  );
}

export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ScrollReveal>
      <article className="rounded-2xl border border-neo-100 bg-white p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold text-neo">{title}</h3>
        <div className="mt-3 text-sm leading-relaxed text-slate-600">{children}</div>
      </article>
    </ScrollReveal>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <ScrollReveal>
      <div className="rounded-2xl border border-dashed border-neo-200 bg-neo-50/50 px-6 py-12 text-center">
        <p className="text-slate-600">{message}</p>
      </div>
    </ScrollReveal>
  );
}

export function LinkCard({ title, excerpt, href }: { title: string; excerpt?: string; href: string }) {
  return (
    <ScrollReveal>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-2xl border border-neo-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-neo-200 hover:shadow-neo"
      >
        <h3 className="font-display text-lg font-semibold text-neo group-hover:text-neo-red">{title}</h3>
        {excerpt && <p className="mt-2 text-sm text-slate-600">{excerpt}</p>}
        <span className="mt-4 inline-flex text-[11px] font-bold uppercase tracking-wider text-neo-red">View →</span>
      </a>
    </ScrollReveal>
  );
}
