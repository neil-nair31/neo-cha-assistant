"""Generate Pragma invoice PDF: Rs 5,000 OpenRouter AI credits for Neo Logistics."""
from datetime import date
from pathlib import Path
from fpdf import FPDF

OUT = Path(
    r"C:\Users\neila\Projects\neo-cha-assistant\docs\Pragma-Invoice-INV-2026-001-OpenRouter-AI-Credits.pdf"
)

VENDOR = {
    "name": "Pragma",
    "legal": "Pragma (Technology Studio)",
    "tagline": "Product & AI systems for logistics and trade",
    "email": "26pragmalabs@gmail.com",
    "address": "India",
    "gstin": "GSTIN: Not applicable / not registered",
    "upi": "neilajithnair@okhdfcbank",
}

CLIENT = {
    "name": "Neo Logistics",
    "website": "www.neologistics.org",
    "address": "Kochi (Willingdon Island) / Chennai (Egmore), India",
    "email": "customercare@neologistics.org",
    "project": "Pragma Flow - Assist, HS Finder, Customs Digest",
}


class PDF(FPDF):
    def footer(self):
        self.set_y(-11)
        self.set_font("Helvetica", "I", 7.5)
        self.set_text_color(120, 120, 120)
        self.cell(
            0,
            5,
            f"Pragma Invoice INV-2026-001  |  Page {self.page_no()}/{{nb}}  |  Confidential",
            align="C",
        )


def rx(pdf: PDF):
    pdf.set_x(pdf.l_margin)


def section(pdf: PDF, title: str):
    pdf.ln(1.8)
    rx(pdf)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(15, 40, 80)
    pdf.cell(0, 5, title, new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(180, 40, 40)
    pdf.set_line_width(0.3)
    y = pdf.get_y()
    pdf.line(pdf.l_margin, y, pdf.l_margin + pdf.epw, y)
    pdf.ln(1.4)
    pdf.set_text_color(30, 30, 30)
    rx(pdf)


def p(pdf: PDF, text: str, size=8.5):
    rx(pdf)
    pdf.set_font("Helvetica", "", size)
    pdf.multi_cell(pdf.epw, 3.8, text)
    pdf.ln(0.3)
    rx(pdf)


def bullet(pdf: PDF, text: str):
    rx(pdf)
    pdf.set_font("Helvetica", "", 8.2)
    pdf.set_x(pdf.l_margin + 1.5)
    pdf.multi_cell(pdf.epw - 1.5, 3.7, f"-  {text}")
    rx(pdf)


def kv_row(pdf: PDF, left: str, right: str):
    rx(pdf)
    w = pdf.epw / 2
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(w, 4.8, left)
    pdf.cell(w, 4.8, right, new_x="LMARGIN", new_y="NEXT")


def two_columns(pdf: PDF, left_title: str, left_lines: list[str], right_title: str, right_lines: list[str]):
    gap = 8
    col_w = (pdf.epw - gap) / 2
    y0 = pdf.get_y()
    x_left = pdf.l_margin
    x_right = pdf.l_margin + col_w + gap

    def draw_col(x: float, title: str, lines: list[str]) -> float:
        pdf.set_xy(x, y0)
        pdf.set_font("Helvetica", "B", 8.5)
        pdf.set_text_color(15, 40, 80)
        pdf.cell(col_w, 4.5, title)
        pdf.ln(5)
        pdf.set_text_color(30, 30, 30)
        first = True
        for line in lines:
            if not line:
                continue
            pdf.set_x(x)
            pdf.set_font("Helvetica", "B" if first else "", 10 if first else 8)
            first = False
            pdf.multi_cell(col_w, 3.9, line)
        return pdf.get_y()

    y_l = draw_col(x_left, left_title, left_lines)
    y_r = draw_col(x_right, right_title, right_lines)
    pdf.set_y(max(y_l, y_r) + 2)
    rx(pdf)


def wrap_height(pdf: PDF, text: str, width: float, line_h: float) -> float:
    """Estimate multi_cell height without drawing."""
    pdf.set_font("Helvetica", "", 8)
    # fpdf2 has get_string_width
    words = text.split()
    lines = 1
    cur = ""
    for w in words:
        trial = (cur + " " + w).strip()
        if pdf.get_string_width(trial) <= width - 3:
            cur = trial
        else:
            lines += 1
            cur = w
    return max(lines * line_h + 3, 16)


def charges_table(pdf: PDF):
    rx(pdf)
    w_desc = pdf.epw * 0.64
    w_qty = pdf.epw * 0.10
    w_amt = pdf.epw - w_desc - w_qty

    pdf.set_fill_color(15, 40, 80)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 8)
    pdf.cell(w_desc, 6.5, " Description", border=1, fill=True)
    pdf.cell(w_qty, 6.5, "Qty", border=1, fill=True, align="C")
    pdf.cell(w_amt, 6.5, "Amount (Rs)", border=1, fill=True, align="C")
    pdf.ln()

    desc = (
        "OpenRouter prepaid AI credits (GPT family) - launch wallet for Pragma Flow "
        "Features 1-3 (Neo Assist, Neo HS Finder, AI Customs Digest). Includes Pragma "
        "setup, key wiring, and live-AI verification (not fallback mode)."
    )

    line_h = 4.0
    row_h = wrap_height(pdf, desc, w_desc, line_h)
    x0 = pdf.get_x()
    y0 = pdf.get_y()

    # Borders
    pdf.set_draw_color(0, 0, 0)
    pdf.rect(x0, y0, w_desc, row_h)
    pdf.rect(x0 + w_desc, y0, w_qty, row_h)
    pdf.rect(x0 + w_desc + w_qty, y0, w_amt, row_h)

    # Description text once
    pdf.set_text_color(30, 30, 30)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_xy(x0 + 1.5, y0 + 1.5)
    pdf.multi_cell(w_desc - 3, line_h, desc)

    # Qty / amount vertically centered
    pdf.set_xy(x0 + w_desc, y0)
    pdf.cell(w_qty, row_h, "1", align="C")
    pdf.set_xy(x0 + w_desc + w_qty, y0)
    pdf.cell(w_amt, row_h, "5,000.00  ", align="R")

    pdf.set_y(y0 + row_h)

    w_lab = w_desc + w_qty
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(w_lab, 6.5, "Subtotal  ", border=1, align="R")
    pdf.cell(w_amt, 6.5, "5,000.00  ", border=1, align="R")
    pdf.ln()
    pdf.set_font("Helvetica", "", 8)
    pdf.cell(w_lab, 5.5, "GST  ", border=1, align="R")
    pdf.cell(w_amt, 5.5, "Nil (no GSTIN)  ", border=1, align="R")
    pdf.ln()
    pdf.set_fill_color(245, 248, 252)
    pdf.set_font("Helvetica", "B", 10.5)
    pdf.cell(w_lab, 7.5, "TOTAL PAYABLE  ", border=1, fill=True, align="R")
    pdf.cell(w_amt, 7.5, "Rs 5,000.00  ", border=1, fill=True, align="R")
    pdf.ln(1.5)
    rx(pdf)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 4.5, "Amount in words: Rupees Five Thousand Only.", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(30, 30, 30)
    rx(pdf)


def main():
    today = date.today().strftime("%d %B %Y")
    inv = "INV-2026-001"

    pdf = PDF(format="A4")
    pdf.set_margins(14, 11, 14)
    pdf.set_auto_page_break(auto=True, margin=12)
    pdf.alias_nb_pages()
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 17)
    pdf.set_text_color(15, 40, 80)
    pdf.cell(0, 7, "INVOICE / BILL", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(90, 90, 90)
    pdf.cell(0, 4.5, "AI infrastructure credits - Pragma Flow (Neo Logistics website tools)", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    pdf.set_text_color(30, 30, 30)
    kv_row(pdf, f"Invoice No: {inv}", f"Date: {today}")
    kv_row(pdf, "Status: Due on receipt", "Currency: INR (Rs)")
    pdf.ln(1.5)

    two_columns(
        pdf,
        "FROM (Vendor)",
        [
            VENDOR["name"],
            VENDOR["legal"],
            VENDOR["tagline"],
            VENDOR["address"],
            VENDOR["email"],
            VENDOR["gstin"],
            f"UPI: {VENDOR['upi']}",
        ],
        "BILL TO (Client)",
        [
            CLIENT["name"],
            CLIENT["website"],
            CLIENT["address"],
            CLIENT["email"],
            f"Project: {CLIENT['project']}",
        ],
    )

    section(pdf, "1. Charges")
    charges_table(pdf)

    section(pdf, "2. What we have right now")
    bullet(pdf, "Feature 1 - Neo Assist: chatbot, KB, guardrails, and lead capture are built and demoable.")
    bullet(pdf, "Feature 2 - Neo HS Finder: India CTH index (~12,475 lines) live; ranking needs a working AI key.")
    bullet(pdf, "Feature 3 - AI Customs Digest: scan + blog pipeline works; posts often fall back to templates without AI.")
    bullet(pdf, "Google Gemini paid billing failed (activation error), so tools risk non-AI / template answers at go-live.")

    section(pdf, "3. Why this purchase is required")
    bullet(pdf, "All three features share one AI layer for chat, HS ranking/reasoning, and customs summaries.")
    bullet(pdf, "OpenRouter prepaid GPT credits have a hard spend ceiling - empty wallet stops usage (predictable cost).")
    bullet(pdf, "This invoice covers launch credits + Pragma wiring/verification so Neo Logistics is not stuck in fallback mode.")
    bullet(pdf, "Later top-ups are separate and billed only if more usage is needed.")

    section(pdf, "4. How things change after payment")
    bullet(pdf, "Pragma loads OpenRouter credits and configures GPT (e.g. gpt-4o-mini for Assist/Digest; stronger GPT for HS).")
    bullet(pdf, "Neo Assist answers become live AI grounded in Neo knowledge, not offline templates.")
    bullet(pdf, "HS Finder can give clearer primary CTH recommendations with reasoning (CHA confirms before filing).")
    bullet(pdf, "Customs Digest can publish real plain-English AI summaries instead of mail-merge fallbacks.")
    bullet(pdf, "Neo Logistics can demo and go live with authentic AI behaviour across all three tools.")

    section(pdf, "5. Scope of this invoice")
    rx(pdf)
    pdf.set_font("Helvetica", "B", 8.2)
    pdf.cell(0, 4, "Included in Rs 5,000", new_x="LMARGIN", new_y="NEXT")
    rx(pdf)
    bullet(pdf, "OpenRouter prepaid AI credit load for launch (GPT family via OpenRouter).")
    bullet(pdf, "Key setup, environment wiring for Features 1-3, and verification tests.")
    pdf.ln(0.4)
    rx(pdf)
    pdf.set_font("Helvetica", "B", 8.2)
    pdf.cell(0, 4, "Not included", new_x="LMARGIN", new_y="NEXT")
    rx(pdf)
    bullet(pdf, "Full Pragma Flow software build / go-live fee (separate commercial proposal).")
    bullet(pdf, "Monthly ops retainer, hosting, or Neo IT deployment work.")
    bullet(pdf, "Future OpenRouter top-ups beyond this launch wallet.")

    section(pdf, "6. Payment")
    p(
        pdf,
        "Please pay Rs 5,000 to Pragma on receipt. On confirmation, Pragma will activate OpenRouter credits "
        "and verify all three features on live AI within 1-2 working days.",
    )
    rx(pdf)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 5, f"UPI: {VENDOR['upi']}", new_x="LMARGIN", new_y="NEXT")
    rx(pdf)
    pdf.set_font("Helvetica", "", 8.5)
    pdf.cell(0, 4, f"Confirmation / queries: {VENDOR['email']}", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(2.5)
    rx(pdf)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 4, "For Pragma", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    rx(pdf)
    pdf.cell(0, 4, "Authorised signatory: ____________________", new_x="LMARGIN", new_y="NEXT")
    rx(pdf)
    pdf.cell(0, 4, f"Date: {today}", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(1.5)
    rx(pdf)
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(110, 110, 110)
    p(
        pdf,
        "Note: AI outputs are assistive. HS recommendations are educational shortlists for licensed CHA confirmation. "
        "Customs digest posts are awareness summaries, not official CBIC/DGFT text.",
        size=7,
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
