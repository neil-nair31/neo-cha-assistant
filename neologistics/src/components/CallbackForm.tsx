import { useState, type FormEvent } from "react";
import { site } from "../data/site.ts";

export function CallbackForm({ compact }: { compact?: boolean }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", message: "" });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Callback request — ${form.company || form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nCompany: ${form.company}\nPhone: ${form.phone}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.location.href = `mailto:${site.offices[0].email}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-6 text-center">
        <p className="font-display text-lg font-semibold text-teal-800">Thank you — your email client should open shortly.</p>
        <p className="mt-2 text-sm text-teal-700">Our team will respond within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-4" : "space-y-5"}>
      <div className={compact ? "grid gap-4 sm:grid-cols-2" : "grid gap-5 sm:grid-cols-2"}>
        <div>
          <label className="field-label" htmlFor="cb-name">Full name</label>
          <input id="cb-name" required className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="field-label" htmlFor="cb-company">Company</label>
          <input id="cb-company" className="field-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </div>
        <div>
          <label className="field-label" htmlFor="cb-phone">Phone</label>
          <input id="cb-phone" required type="tel" className="field-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="field-label" htmlFor="cb-email">Email</label>
          <input id="cb-email" required type="email" className="field-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </div>
      {!compact && (
        <div>
          <label className="field-label" htmlFor="cb-message">Shipment details / message</label>
          <textarea id="cb-message" rows={4} className="field-input resize-y" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
      )}
      <button type="submit" className="btn-primary w-full sm:w-auto">
        Request a callback
      </button>
    </form>
  );
}
