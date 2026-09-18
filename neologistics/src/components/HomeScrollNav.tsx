import { useEffect, useState } from "react";

const sections = [
  { id: "top", label: "Home", color: "bg-neo-blue-accent" },
  { id: "industries", label: "Industries", color: "bg-neo-red" },
  { id: "about", label: "About", color: "bg-neo" },
  { id: "services", label: "Services", color: "bg-neo-blue-light" },
  { id: "why-us", label: "Why Us", color: "bg-neo-red-400" },
  { id: "testimonials", label: "Clients", color: "bg-neo-blue-accent" },
  { id: "how-to-ship", label: "Ship", color: "bg-white" },
];

export function HomeScrollNav() {
  const [active, setActive] = useState("top");

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: [0, 0.2, 0.5] }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Page sections"
      className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 xl:flex"
    >
      {sections.map((s) => {
        const isActive = active === s.id;
        return (
          <a key={s.id} href={`#${s.id}`} title={s.label} className="group flex items-center justify-end gap-2.5">
            <span
              className={`pointer-events-none rounded-full px-2 py-0.5 font-sans text-[9px] uppercase tracking-widest transition ${
                isActive ? "bg-white/10 text-white opacity-100 backdrop-blur-sm" : "text-white/70 opacity-0 group-hover:opacity-100"
              }`}
            >
              {s.label}
            </span>
            <span
              className={`block rounded-full transition-all duration-300 ${
                isActive ? `h-2.5 w-2.5 ${s.color} shadow-[0_0_12px_currentColor]` : "h-1.5 w-1.5 bg-white/30 group-hover:h-2 group-hover:w-2 group-hover:bg-white/55"
              }`}
            />
          </a>
        );
      })}
    </nav>
  );
}
