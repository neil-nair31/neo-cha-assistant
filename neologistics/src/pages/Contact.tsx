import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { PageShell } from "../components/PageShell.tsx";
import { site } from "../data/site.ts";

export function Contact() {
  const [sent, setSent] = useState(false);
  const [params] = useSearchParams();

  const defaultMessage = useMemo(() => {
    const notice = params.get("notice")?.trim();
    const title = params.get("title")?.trim();
    if (!notice && !title) return "";
    return [
      notice ? `Re: ${notice}` : "Re: customs update",
      title ? title : "",
      "",
      "Please advise whether this affects our filings.",
    ]
      .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
      .join("\n");
  }, [params]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "");
    const email = String(fd.get("email") ?? "");
    const mobile = String(fd.get("mobile") ?? "");
    const message = String(fd.get("message") ?? "");
    window.location.href = `mailto:${site.offices[0].email}?subject=${encodeURIComponent(`Contact from ${name}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\nMobile: ${mobile}\n\n${message}`)}`;
    setSent(true);
  }

  return (
    <PageShell
      seoTitle="Contact Us"
      seoDescription="Contact Neo Logistics — Cochin and Chennai offices. Monday–Saturday 9:30 AM – 5:30 PM."
      breadcrumb={[{ label: "Home", to: "/" }, { label: "Contact us" }]}
      title="Write to us"
      subtitle="Where you'll usually find us — Monday - Saturday 9:30 AM - 5:30 PM"
    >
      <div className="grid gap-10 lg:grid-cols-2">
        {sent ? (
          <p className="rounded-xl border border-teal-200 bg-teal-50 p-6 text-teal-800 lg:col-span-2">
            Thank you — your email client should open shortly.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="form-card space-y-4">
            <div>
              <label className="field-label" htmlFor="name">Name *</label>
              <input id="name" name="name" required placeholder="Name" className="field-input" />
            </div>
            <div>
              <label className="field-label" htmlFor="email">Email *</label>
              <input id="email" name="email" type="email" required placeholder="Email" className="field-input" />
            </div>
            <div>
              <label className="field-label" htmlFor="mobile">Mobile Number *</label>
              <input id="mobile" name="mobile" type="tel" required placeholder="Mobile Number" className="field-input" />
            </div>
            <div>
              <label className="field-label" htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows={4}
                placeholder="Enter your message here.."
                className="field-input resize-y"
                defaultValue={defaultMessage}
                key={defaultMessage || "empty"}
              />
            </div>
            <button type="submit" className="btn-primary">Send Message</button>
          </form>
        )}

        <div className="space-y-6">
          {site.offices.map((office) => (
            <div key={office.city} className="rounded-2xl border border-neo-100 bg-white p-6 shadow-card">
              <p className="eyebrow-light">{office.city}</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-neo">{office.label}</h3>
              <address className="mt-4 space-y-2 text-sm not-italic leading-relaxed text-slate-600">
                <p>{office.address}</p>
                <p><a href={`tel:${office.phone.replace(/\s/g, "")}`} className="text-neo-red hover:underline">{office.phone}</a></p>
                <p><a href={`mailto:${office.email}`} className="text-neo-red hover:underline">{office.email}</a></p>
              </address>
            </div>
          ))}
          <div className="overflow-hidden rounded-2xl border border-neo-100 shadow-card">
            <iframe
              title="Neo Logistics Cochin location"
              src="https://maps.google.com/maps?q=Neo+Logistics+Willingdon+Island+Kochi&output=embed"
              className="h-64 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
