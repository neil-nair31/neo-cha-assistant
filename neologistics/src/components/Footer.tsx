import { assets } from "../data/assets.ts";
import { site } from "../data/site.ts";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-neo-950 text-neo-100">
      <div className="absolute inset-0 bg-grid-dark bg-grid opacity-15" />
      <div className="container-wide relative py-14">
        <div className="grid gap-10 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <img src={assets.logoFooter} alt="Neo Logistics" className="h-14 w-auto brightness-0 invert" width={160} height={56} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neo-200/80">
              The sustained success of Neo Logistics is largely attributable to the expertise of work force,
              customer satisfaction, knowledge on the dynamics of logistic functions and most importantly upholding standard business ethics.
            </p>
          </div>

          <div>
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-neo-blue-accent">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                { label: "Home", href: "/" },
                { label: "About", href: "/about-us" },
                { label: "Industries", href: "/core-industries" },
                { label: "Our Expertise", href: "/our-expertise" },
                { label: "Know your customer", href: "/know-your-customer" },
                { label: "News", href: "/news" },
                { label: "Blogs", href: "/blogs" },
                { label: "India HS / CTH Finder", href: "/hs-code-finder" },
                { label: "Client Portal", href: "/client-portal" },
                { label: "Contact us", href: "/contact-us" },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-neo-200 transition hover:text-white">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {site.offices.map((office) => (
            <div key={office.city}>
              <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-neo-blue-accent">{office.city}</h3>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-neo-300/70">{office.label}</p>
              <address className="mt-3 space-y-2 text-sm not-italic leading-relaxed text-neo-200/80">
                <p>{office.address}</p>
                <p><a href={`tel:${office.phone.replace(/\s/g, "")}`} className="hover:text-neo-blue-accent">{office.phone}</a></p>
                <p><a href={`mailto:${office.email}`} className="hover:text-neo-blue-accent">{office.email}</a></p>
              </address>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neo-800 pt-8 text-xs text-neo-300/70 sm:flex-row">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>Licensed Customs Broker · AEO–LO · Cochin &amp; Chennai</p>
        </div>
      </div>
    </footer>
  );
}
