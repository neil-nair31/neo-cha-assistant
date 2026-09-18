import { useState } from "react";
import type { Testimonial } from "../data/testimonials.ts";
import { ScrollReveal } from "./ScrollReveal.tsx";

export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const [active, setActive] = useState(0);
  const t = items[active];

  return (
    <div>
      <ScrollReveal>
        <article className="testimonial-card mx-auto max-w-3xl">
          <blockquote className="relative z-10 flex-1 pt-4 text-base leading-relaxed text-slate-700 sm:text-lg">
            {t.quote}
          </blockquote>
          <footer className="relative z-10 mt-8 border-t border-navy-100 pt-6">
            <cite className="not-italic">
              <p className="font-display font-semibold text-neo-900">{t.name}</p>
              <p className="mt-1 text-sm text-slate-500">{t.role}</p>
              <p className="text-sm font-medium text-neo-red">{t.company}</p>
            </cite>
          </footer>
        </article>
      </ScrollReveal>

      <div className="mt-8 flex items-center justify-center gap-3">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`View testimonial ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? "w-8 bg-neo-red" : "w-2 bg-neo-200 hover:bg-neo-300"
            }`}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          aria-label="Previous testimonial"
          onClick={() => setActive((a) => (a === 0 ? items.length - 1 : a - 1))}
          className="rounded-full border border-neo-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-neo transition hover:border-neo-red hover:text-neo-red"
        >
          Prev
        </button>
        <button
          type="button"
          aria-label="Next testimonial"
          onClick={() => setActive((a) => (a === items.length - 1 ? 0 : a + 1))}
          className="rounded-full border border-neo-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-neo transition hover:border-neo-red hover:text-neo-red"
        >
          Next
        </button>
      </div>
    </div>
  );
}
