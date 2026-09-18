import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { BrandLogo } from "./BrandLogo.tsx";
import { navLinks } from "../data/pages.ts";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass = (active?: boolean) =>
    `nav-link ${active ? "nav-link-active" : ""}`;

  return (
    <header className={`navbar-shell ${scrolled ? "navbar-scrolled" : ""}`}>
      <nav className="navbar-container navbar-inner" aria-label="Main">
        <BrandLogo />

        <div className="navbar-links hidden min-w-0 xl:flex">
          {navLinks.map((item) =>
            "children" in item ? (
              <div
                key={item.label}
                className="relative shrink-0"
                onMouseEnter={() => setDropdown(item.label)}
                onMouseLeave={() => setDropdown(null)}
              >
                <button
                  type="button"
                  className={linkClass()}
                  aria-expanded={dropdown === item.label}
                >
                  {item.label}
                  <svg className="nav-chevron" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                {dropdown === item.label && (
                  <div className="nav-dropdown">
                    {item.children.map((child) => (
                      <NavLink key={child.to} to={child.to} className="nav-dropdown-item">
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink key={item.to} to={item.to!} className={({ isActive }) => linkClass(isActive)}>
                {item.label}
              </NavLink>
            )
          )}
        </div>

        <div className="navbar-actions">
          <Link to="/contact-us" className="btn-primary btn-nav-cta hidden xl:inline-flex">
            Get a Callback
          </Link>
          <button
            type="button"
            className="navbar-toggle xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-neo-950 backdrop-blur-xl xl:hidden">
          <div className="navbar-container flex max-h-[75vh] flex-col gap-1 overflow-y-auto py-3">
            {navLinks.flatMap((item) =>
              "children" in item
                ? item.children.map((child) => (
                    <Link
                      key={child.to}
                      to={child.to}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm text-white/90 hover:bg-white/5"
                    >
                      {item.label} — {child.label}
                    </Link>
                  ))
                : [
                    <Link
                      key={item.to}
                      to={item.to!}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm text-white/90 hover:bg-white/5"
                    >
                      {item.label}
                    </Link>,
                  ]
            )}
            <Link
              to="/contact-us"
              onClick={() => setOpen(false)}
              className="btn-primary mx-3 mt-2 text-center text-[10px]"
            >
              Get a Callback
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
