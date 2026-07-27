"""Generate Pragma Flow billing schema PDF for Neo Logistics."""
from pathlib import Path
from fpdf import FPDF

OUT = Path(r"C:\Users\neila\Projects\neo-cha-assistant\docs\Pragma-Flow-Billing-Schema-Neo-Logistics.pdf")


class PDF(FPDF):
    def footer(self):
        self.set_y(-14)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, f"Pragma | Neo Logistics - Pragma Flow | Page {self.page_no()}/{{nb}}", align="C")


def section(pdf: PDF, title: str):
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(15, 40, 80)
    pdf.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(200, 40, 40)
    pdf.set_line_width(0.4)
    y = pdf.get_y()
    pdf.line(pdf.l_margin, y, pdf.w - pdf.r_margin, y)
    pdf.ln(3)
    pdf.set_text_color(30, 30, 30)


def body(pdf: PDF, text: str, size=10):
    pdf.set_font("Helvetica", "", size)
    pdf.multi_cell(0, 5.2, text)
    pdf.ln(1)


def bullet(pdf: PDF, text: str):
    pdf.set_font("Helvetica", "", 10)
    pdf.set_x(pdf.l_margin + 2)
    pdf.multi_cell(0, 5.2, f"-  {text}")


def money_row(pdf: PDF, label: str, amount: str, note: str = ""):
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(95, 7, label, border=0)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(40, 7, amount, border=0, align="R")
    pdf.ln(6)
    if note:
        pdf.set_font("Helvetica", "I", 8)
        pdf.set_text_color(90, 90, 90)
        pdf.multi_cell(0, 4.5, note)
        pdf.set_text_color(30, 30, 30)
        pdf.ln(1)


def main():
    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(15, 40, 80)
    pdf.cell(0, 9, "Pragma Flow - Commercial Proposal", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 6, "Prepared for: Neo Logistics (neologistics.org)", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "From: Pragma  |  Package: 3 website AI features", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "Currency: INR  |  AI API usage billed separately", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    section(pdf, "1. What Neo gets")
    body(
        pdf,
        "Three production tools built for a licensed Indian CHA / freight forwarder - "
        "not a generic chatbot SaaS.",
    )
    bullet(pdf, "Feature 1 - Neo Assist: site chatbot grounded in Neo's services + customs education, with DPDP consent and lead alerts for serious enquiries.")
    bullet(pdf, "Feature 2 - Neo HS Finder: India CTH / ITC-HS 8-digit shortlist tool (12,000+ lines) for Bill of Entry / Shipping Bill prep. CHA confirms before filing.")
    bullet(pdf, "Feature 3 - AI Customs Digest: daily CBIC/DGFT scan -> plain-English summary -> industry tags -> Neo blog (human approve before publish).")

    section(pdf, "2. How this benefits Neo as a company")
    body(pdf, "Concrete business outcomes - not vanity tech:")
    bullet(pdf, "More qualified website leads: Assist captures serious / high-volume enquiries (with consent) and flags them to customercare - instead of visitors bouncing without contacting you.")
    bullet(pdf, "Faster pre-clearance conversations: HS Finder lets importers/exporters arrive with a shortlist already prepared - Neo's CHA team spends less time on first-pass education.")
    bullet(pdf, "Authority and retention content: Digest keeps /blogs alive with India-relevant customs/DGFT updates tagged to Neo industries (cashew, steel, chemicals, agro, seafood, etc.) - without a full-time content writer.")
    bullet(pdf, "Differentiation vs other Kochi/Chennai CHAs: most competitors have a static brochure site. Neo gets three working tools that prove domain competence.")
    bullet(pdf, "Controlled risk: no invented duty percentages, no binding classification claims - designed to protect Neo's licence reputation while still helping clients.")
    pdf.ln(1)
    body(
        pdf,
        "Rough ROI framing: one incremental freight / clearance engagement recovered through the chatbot "
        "typically outweighs this entire build fee. The tools are lead + trust infrastructure.",
        size=9,
    )

    section(pdf, "3. Recommended pricing (best-value for this scope)")
    body(
        pdf,
        "Market context: a single custom RAG chatbot in India commonly quotes Rs 1.5L-5L. "
        "This proposal covers three features at a fair studio rate - not agency enterprise markup.",
        size=9,
    )
    pdf.ln(1)
    money_row(pdf, "A. AI go-live setup (Gemini credits + wiring)", "Rs 5,000", "One-time. Launch credits + key setup + verify all 3 features on live AI.")
    money_row(pdf, "B. Pragma Flow build (Features 1 + 2 + 3)", "Rs 2,25,000", "One-time. Build, staging demo, IT handoff pack, one CHA content review round, go-live support.")
    money_row(pdf, "C. Monthly ops retainer (optional, recommended)", "Rs 20,000 / month", "Digest review/approve, KB tweaks, health checks, minor fixes. Cancel with 30 days notice after 3 months.")
    money_row(pdf, "D. Ongoing Gemini / AI usage", "At actual cost", "Pass-through to Neo (typically a few hundred to a few thousand Rs/month at pilot traffic). Not bundled into B or C.")

    pdf.ln(2)
    pdf.set_fill_color(245, 248, 252)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 9, "  Recommended total to start:  Rs 2,30,000  (A + B)", fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(70, 70, 70)
    pdf.multi_cell(0, 5, "  Then optional C (Rs 20,000/mo) after go-live + D as incurred.")
    pdf.set_text_color(30, 30, 30)

    section(pdf, "4. Payment schedule")
    bullet(pdf, "AI setup (A): 100% on approval - Rs 5,000.")
    bullet(pdf, "Build (B): 40% kickoff (Rs 90,000) -> 40% staging accepted (Rs 90,000) -> 20% go-live / ready-for-IT sign-off (Rs 45,000).")
    bullet(pdf, "If Neo IT scheduling delays go-live after Pragma delivery, final 20% is still due on 'ready for IT' acceptance.")
    bullet(pdf, "Retainer (C): billed monthly from go-live month.")
    bullet(pdf, "AI usage (D): monthly invoice of actuals, or Neo's own Google billing.")

    section(pdf, "5. What is included / not included")
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "Included in Rs 2,25,000", new_x="LMARGIN", new_y="NEXT")
    bullet(pdf, "All three feature codebases, Neo branding, disclaimers, staging demo.")
    bullet(pdf, "Embed snippet + proxy notes for Neo IT (Django / nginx).")
    bullet(pdf, "One review pass with Neo CHA on sample answers / HS framing / digest tone.")
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "Not included (separate)", new_x="LMARGIN", new_y="NEXT")
    bullet(pdf, "Neo IT server time, DNS, SSL, Django template changes (Neo's team / hosting).")
    bullet(pdf, "Gemini / LLM API spend (line D).")
    bullet(pdf, "Major new features after sign-off (change order).")
    bullet(pdf, "WhatsApp bot, ERP/CRM deep integration, multi-language launch (future options).")

    section(pdf, "6. Why this number is fair")
    bullet(pdf, "Under typical India agency quotes for one RAG chatbot alone.")
    bullet(pdf, "Pays for domain work (CHA guardrails, India CTH index, CBIC/DGFT pipeline) - not a ChatGPT iframe.")
    bullet(pdf, "Transparent: AI credits never hidden inside mystery AI fees.")
    bullet(pdf, "Retainer is optional - Neo can self-operate digest approve if preferred.")

    pdf.add_page()
    section(pdf, "7. Simple commercial summary")
    pdf.set_font("Helvetica", "", 10)
    rows = [
        ("Item", "Amount", "When"),
        ("AI go-live setup", "Rs 5,000", "Now / before live AI demo"),
        ("Pragma Flow build (3 features)", "Rs 2,25,000", "40% / 40% / 20% milestones"),
        ("Ops retainer (optional)", "Rs 20,000/mo", "After go-live"),
        ("Gemini usage", "Actuals", "Monthly"),
    ]
    col_w = [70, 45, 65]
    pdf.set_fill_color(15, 40, 80)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 9)
    for i, h in enumerate(rows[0]):
        pdf.cell(col_w[i], 7, h, border=1, fill=True)
    pdf.ln()
    pdf.set_text_color(30, 30, 30)
    pdf.set_font("Helvetica", "", 9)
    for r in rows[1:]:
        for i, cell in enumerate(r):
            pdf.cell(col_w[i], 7, cell, border=1)
        pdf.ln()

    pdf.ln(8)
    section(pdf, "8. Acceptance")
    body(
        pdf,
        "This document is a commercial summary for discussion. A short work order / invoice will "
        "confirm milestones and payment details. AI usage remains Neo's infrastructure cost.",
        size=9,
    )
    pdf.ln(6)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(90, 8, "For Neo Logistics: ____________________", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(90, 8, "Date: ______________", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.cell(90, 8, "For Pragma: ____________________", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(90, 8, "Date: ______________", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(110, 110, 110)
    pdf.multi_cell(
        0,
        4.5,
        "Disclaimer: Features provide educational assistance only. Neo remains responsible for "
        "licensed CHA advice, filings, and client relationships. HS shortlists are not binding "
        "classifications. Digest posts are not official CBIC/DGFT text.",
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
