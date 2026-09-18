import { useEffect, useState } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal.ts";

function parseStat(value: string): { num: number; suffix: string; raw: boolean } {
  if (value.includes("/") || value.endsWith("+")) {
    return { num: 0, suffix: value, raw: true };
  }
  const match = value.match(/^(\d+)(.*)$/);
  if (match) return { num: parseInt(match[1], 10), suffix: match[2], raw: false };
  return { num: 0, suffix: value, raw: true };
}

function StatItem({
  value,
  label,
  dark,
  hero,
  animate,
}: {
  value: string;
  label: string;
  dark?: boolean;
  hero?: boolean;
  animate: boolean;
}) {
  const { num, suffix, raw } = parseStat(value);
  const [display, setDisplay] = useState(raw || num === 0 ? 0 : num);

  useEffect(() => {
    if (raw || !animate || num === 0) {
      return;
    }
    let frame = 0;
    const steps = 28;
    const id = window.setInterval(() => {
      frame += 1;
      setDisplay(Math.round((num * frame) / steps));
      if (frame >= steps) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [animate, num, raw]);

  const showRaw = raw || num === 0;

  return (
    <div className={hero ? "stat-card-hero" : dark ? "stat-card-dark" : "stat-card"}>
      <dt className={`font-display text-2xl font-bold sm:text-3xl ${dark || hero ? "text-neo-blue-accent" : "text-neo"}`}>
        {showRaw ? value : `${display}${suffix}`}
      </dt>
      <dd className={`mt-1 text-[10px] font-medium uppercase leading-snug tracking-wider ${dark || hero ? "text-white/65" : "text-slate-500"}`}>
        {label}
      </dd>
    </div>
  );
}

export function AnimatedStatGrid({
  stats,
  dark,
  hero,
}: {
  stats: { value: string; label: string }[];
  dark?: boolean;
  hero?: boolean;
}) {
  const { ref, visible } = useScrollReveal<HTMLDListElement>(0.3);

  return (
    <dl ref={ref} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {stats.map((s) => (
        <StatItem key={s.label} {...s} dark={dark} hero={hero} animate={visible} />
      ))}
    </dl>
  );
}
