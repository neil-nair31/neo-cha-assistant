import { useState, type FormEvent } from "react";
import { PageShell } from "../components/PageShell.tsx";
import { site } from "../data/site.ts";

export function KnowYourCustomer() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = [...fd.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
    window.location.href = `mailto:${site.offices[0].email}?subject=${encodeURIComponent("KYC Form Submission")}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  const fields = [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "Doe", label: "Date of Establishment", type: "date", required: true },
    { name: "Constitution", label: "Constitution", type: "select", options: ["", "Pvt.", "Ltd.", "LTD", "Partnership", "Proprietorship"] },
    { name: "customer_address", label: "Customer Address", type: "textarea", required: true },
    { name: "pan_no", label: "Permenant Account No. (PAN)", type: "text", required: true },
    { name: "gst_no", label: "GST Registration No.", type: "text", required: true },
    { name: "cha_mto_no", label: "CHA / MTO No (if CHA / Forwarder)", type: "text", required: true },
    { name: "ice_no", label: "IEC No.(if Consignee / Shipper)", type: "text", required: true },
    { name: "nature_business", label: "Nature of business", type: "text", required: true },
    { name: "name_address_director", label: "Name and Address of Directors / Partners with Mobile No, Tel. Nos and E-Mail id", type: "textarea", required: true },
    { name: "authorised_name", label: "Name of Authorised person", type: "text", required: true },
    { name: "authorised_phn", label: "Phone no. of Authorised person", type: "text", required: true },
    { name: "authorised_email", label: "Email of Authorised person", type: "email", required: true },
    { name: "authorised_tel", label: "Telephone no. of Authorised person", type: "text" },
    { name: "finance_name", label: "Name of Accounts / Finance Head", type: "text", required: true },
    { name: "finance_phn", label: "Phone No. of Accounts / Finance Head", type: "text", required: true },
    { name: "fianance_email", label: "Email of Accounts / Finance Head", type: "email", required: true },
    { name: "finance_tel", label: "Telephone No. of Accounts / Finance Head", type: "text" },
    { name: "bank_name_address", label: "Bank name & Address", type: "textarea", required: true },
    { name: "bank_account_no", label: "Bank Account no.", type: "text", required: true },
    { name: "bank_ifsc", label: "IFSC Code", type: "text", required: true },
  ];

  return (
    <PageShell
      seoTitle="Know Your Customer"
      seoDescription="Submit your KYC details to Neo Logistics — licensed customs broker Cochin and Chennai."
      breadcrumb={[{ label: "Home", to: "/" }, { label: "Know your customer" }]}
      title="Know Your Customer"
      subtitle="Please leave your details using the form below and we are at your service"
    >
      {sent ? (
        <p className="rounded-xl border border-teal-200 bg-teal-50 p-6 text-teal-800">Thank you — your email client should open with the form data.</p>
      ) : (
        <form onSubmit={handleSubmit} className="form-card space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                <label className="field-label" htmlFor={f.name}>{f.label}{f.required ? " *" : ""}</label>
                {f.type === "textarea" ? (
                  <textarea id={f.name} name={f.name} required={f.required} rows={3} className="field-input resize-y" />
                ) : f.type === "select" ? (
                  <select id={f.name} name={f.name} className="field-input">
                    {f.options?.map((o) => <option key={o} value={o}>{o || "Select"}</option>)}
                  </select>
                ) : (
                  <input id={f.name} name={f.name} type={f.type} required={f.required} className="field-input" />
                )}
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["upload_iec_copy", "Upload IEC Copy (Self Attested)"],
              ["upload_gst_card", "Upload GST Certificate"],
              ["upload_tel_electricity_bill", "Upload Telephone Bill / Electricity Bill (Latest)"],
              ["upload_pan_card", "Upload PAN Card"],
            ].map(([name, label]) => (
              <div key={name}>
                <label className="field-label" htmlFor={name}>{label}</label>
                <input id={name} name={name} type="file" className="field-input py-2" />
              </div>
            ))}
          </div>
          <label className="flex items-start gap-3 text-sm text-slate-600">
            <input name="is_active" type="checkbox" required className="mt-1" />
            I hereby declare the above information is true & correct. In case of any changes in the above details, we agree to keep your office informed and re-submit the relevant documents along with the revised KYC form.
          </label>
          <button type="submit" className="btn-primary">Submit</button>
        </form>
      )}
    </PageShell>
  );
}
