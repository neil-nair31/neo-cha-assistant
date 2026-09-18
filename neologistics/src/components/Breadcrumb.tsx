import { Link } from "react-router-dom";

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8 text-sm text-neo-200/70">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-2">
            {i > 0 && <span className="text-neo-400">/</span>}
            {item.to ? (
              <Link to={item.to} className="transition hover:text-neo-blue-accent">
                {item.label}
              </Link>
            ) : (
              <span className="text-white/90">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
