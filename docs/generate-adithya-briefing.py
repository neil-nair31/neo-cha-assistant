"""Briefing PDF for Adithya - Pragma Flow / Neo Logistics IT liaison."""
from datetime import date
from pathlib import Path
from fpdf import FPDF

OUT = Path(
    r"C:\Users\neila\Projects\neo-cha-assistant\docs\Pragma-Flow-Adithya-IT-Briefing.pdf"
)


class PDF(FPDF):
    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(
            0,
            6,
            f"Pragma Flow  |  Adithya briefing  |  {date.today().strftime('%d %b %Y')}  |  Page {self.page_no()}/{{nb}}",
            align="C",
        )


def rx(pdf: PDF):
    pdf.set_x(pdf.l_margin)


def h1(pdf: PDF, text: str):
    rx(pdf)
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(15, 40, 80)
    pdf.cell(0, 8, text, new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(180, 40, 40)
    pdf.set_line_width(0.4)
    y = pdf.get_y()
    pdf.line(pdf.l_margin, y, pdf.l_margin + pdf.epw, y)
    pdf.ln(3)
    pdf.set_text_color(30, 30, 30)


def h2(pdf: PDF, text: str):
    pdf.ln(2)
    rx(pdf)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(15, 40, 80)
    pdf.cell(0, 6, text, new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(200, 200, 200)
    pdf.set_line_width(0.25)
    y = pdf.get_y()
    pdf.line(pdf.l_margin, y, pdf.l_margin + pdf.epw, y)
    pdf.ln(2)
    pdf.set_text_color(30, 30, 30)


def p(pdf: PDF, text: str, size=9.5):
    rx(pdf)
    pdf.set_font("Helvetica", "", size)
    pdf.multi_cell(pdf.epw, 4.6, text)
    pdf.ln(0.8)
    rx(pdf)


def bullet(pdf: PDF, text: str, size=9.5):
    rx(pdf)
    pdf.set_font("Helvetica", "", size)
    pdf.set_x(pdf.l_margin + 2)
    pdf.multi_cell(pdf.epw - 2, 4.5, f"-  {text}")
    rx(pdf)


def numbered(pdf: PDF, n: int, text: str):
    rx(pdf)
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_x(pdf.l_margin + 2)
    pdf.multi_cell(pdf.epw - 2, 4.5, f"{n}.  {text}")
    rx(pdf)


def main():
    pdf = PDF(format="A4")
    pdf.set_margins(14, 14, 14)
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.alias_nb_pages()
    pdf.add_page()

    h1(pdf, "Pragma Flow - Briefing for Adithya")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(90, 90, 90)
    p(
        pdf,
        "Prepared by Pragma for Adithya  |  Client: Neo Logistics (neologistics.org)  |  "
        f"Date: {date.today().strftime('%d %B %Y')}",
        size=9,
    )
    pdf.set_text_color(30, 30, 30)
    p(
        pdf,
        "Purpose of this note: give you a clear picture of the project so you can brief Neo's IT team "
        "and unblock go-live. Use this as your talking script with IT.",
    )

    h2(pdf, "1. Goal of this project")
    p(
        pdf,
        "Build and put on Neo Logistics' website a set of first-party tools (Pragma Flow) that help "
        "importers/exporters and generate better leads - without replacing Neo's licensed CHA judgment.",
    )
    bullet(pdf, "Feature 1 - Neo Assist: website chatbot (Neo services + customs education, DPDP consent, lead alerts).")
    bullet(pdf, "Feature 2 - Neo HS Finder: India CTH / ITC-HS shortlist tool for Bill of Entry / Shipping Bill prep.")
    bullet(pdf, "Feature 3 - AI Customs Digest: daily CBIC/DGFT scan -> plain-English blog posts tagged by Neo industries.")
    bullet(pdf, "Next (discussed): client container tracking (Kochi/Chennai ports) + dispatch/invoice document transfer.")
    p(
        pdf,
        "Success = tools live on Neo's domain (or clearly linked), IT-stable, and usable by Neo's team and clients.",
    )

    h2(pdf, "2. What we are doing right now")
    bullet(pdf, "Core three tools are built and running in a local / staging demo (Neo-branded Vite site + 3 Node APIs).")
    bullet(pdf, "Demo can be shared via a temporary public tunnel for team review (not yet on live neologistics.org).")
    bullet(pdf, "AI layer: moving from Gemini (billing blocked in India for us) to OpenRouter prepaid GPT credits (Rs 5,000 invoice).")
    bullet(pdf, "HS Finder needs stronger 'primary recommendation' UX + tariff catalog fixes where Neo desk codes are missing.")
    bullet(pdf, "Customs Digest uses draft -> approve before public blog; scrapers for CBIC + DGFT are working.")
    bullet(pdf, "Commercial: AI credits invoice issued; full build fee and tracking add-on still to be contracted.")

    h2(pdf, "3. What we are going to do next")
    numbered(pdf, 1, "Turn on live GPT via OpenRouter once credits payment is confirmed; re-verify Assist + Digest + HS ranking.")
    numbered(pdf, 2, "Harden HS Finder: primary CTH recommendation + reasoning; refresh India tariff lines using Neo's missing-code list.")
    numbered(pdf, 3, "Hand IT a clean embed pack: widget script, nginx/Django proxy paths, env checklist.")
    numbered(pdf, 4, "Support go-live on staging then production with Neo IT.")
    numbered(pdf, 5, "After core live: scope Phase A client tracking + document transfer (ops-updatable first; auto feeds later).")

    h2(pdf, "4. What still needs to happen (joint checklist)")
    bullet(pdf, "Confirm OpenRouter AI credits payment (Pragma invoice INV-2026-001, Rs 5,000).")
    bullet(pdf, "Agree commercial scope + milestones for core 3 tools (and tracking if in this phase).")
    bullet(pdf, "Neo IT: provision Node hosting (or approve Pragma-hosted APIs) for ports 8787 / 8790 / 8791 (or equivalent).")
    bullet(pdf, "Neo IT: reverse proxy on neologistics.org - /api/assistant, /api/hs, /api/notifications (+ /widget static).")
    bullet(pdf, "Neo IT: paste Neo Assist embed snippet into Django base template (or mount on React rebuild).")
    bullet(pdf, "Neo IT: add/replace pages for HS Finder and Blogs/digest feed (or deep-link to approved URLs).")
    bullet(pdf, "Neo ops: who approves digest drafts daily; who owns lead emails from Assist.")
    bullet(pdf, "Privacy policy URL for consent text; SMTP for lead / handoff emails if required.")
    bullet(pdf, "CORS + HTTPS + keep Node processes alive (systemd / PM2 / container).")

    pdf.add_page()
    h2(pdf, "5. What YOU (Adithya) need to do specifically")
    p(
        pdf,
        "Your role: bridge Pragma <-> Neo IT. You do not need to write code. You need to get clear answers "
        "and owners so go-live is not stuck.",
    )

    pdf.set_font("Helvetica", "B", 9.5)
    rx(pdf)
    pdf.cell(0, 5, "A. Before the IT meeting - prepare", new_x="LMARGIN", new_y="NEXT")
    rx(pdf)
    numbered(pdf, 1, "Share this PDF + the demo link with IT so they see what already works.")
    numbered(pdf, 2, "Confirm with leadership: which tools are approved for this phase (3 core only, or tracking too).")
    numbered(pdf, 3, "Ask Pragma for the latest embed snippet + proxy checklist (one page) if IT wants it in writing.")

    pdf.set_font("Helvetica", "B", 9.5)
    rx(pdf)
    pdf.ln(1)
    pdf.cell(0, 5, "B. Ask Neo IT these questions (write down answers)", new_x="LMARGIN", new_y="NEXT")
    rx(pdf)
    numbered(pdf, 1, "Can we run 3 Node/Express services on Neo's server (or a small VPS Neo controls)? If no, can Neo allow Pragma-hosted APIs with CORS?")
    numbered(pdf, 2, "Who owns nginx/Django templates and can add reverse proxies this week?")
    numbered(pdf, 3, "Preferred path: embed on live Django site, or ship via Neo React rebuild first?")
    numbered(pdf, 4, "Staging URL available? (e.g. staging.neologistics.org) - strongly preferred before production.")
    numbered(pdf, 5, "SMTP: can Assist send lead mails to customercare@neologistics.org from Neo's mail?")
    numbered(pdf, 6, "Any security review / change window / freeze dates we must respect?")
    numbered(pdf, 7, "For tracking later: any existing PCS / shipping-line / internal TMS we must integrate with?")

    pdf.set_font("Helvetica", "B", 9.5)
    rx(pdf)
    pdf.ln(1)
    pdf.cell(0, 5, "C. What to request from IT (action items)", new_x="LMARGIN", new_y="NEXT")
    rx(pdf)
    bullet(pdf, "Assign a named IT owner + WhatsApp/email for Pragma for 2 weeks of cutover.")
    bullet(pdf, "Create staging + production proxy routes (table below).")
    bullet(pdf, "Add Assist widget to site footer/base layout.")
    bullet(pdf, "Open firewall outbound HTTPS for AI provider (OpenRouter / OpenAI) from the API server.")
    bullet(pdf, "Confirm SSL and that API paths are same-origin where possible (best for cookies/CORS simplicity).")

    pdf.set_font("Helvetica", "B", 9.5)
    rx(pdf)
    pdf.ln(1)
    pdf.cell(0, 5, "D. After the IT meeting - send Pragma", new_x="LMARGIN", new_y="NEXT")
    rx(pdf)
    bullet(pdf, "IT owner name + contact.")
    bullet(pdf, "Hosting decision (Neo server vs Pragma-hosted APIs).")
    bullet(pdf, "Staging URL timeline.")
    bullet(pdf, "Any blockers (security, budget for VPS, Django access delays).")
    bullet(pdf, "Target go-live date for core 3 tools.")

    h2(pdf, "6. Technical cheat-sheet for IT (share this)")
    p(pdf, "Three backend services + one front-end surface:", size=9)
    bullet(pdf, "Neo Assist API - default port 8787 - proxy example: /api/assistant/ -> http://127.0.0.1:8787/api/assistant/")
    bullet(pdf, "Neo HS Finder API - default port 8790 - proxy: /api/hs/ -> http://127.0.0.1:8790/api/")
    bullet(pdf, "Notifications Digest API - default port 8791 - proxy: /api/notifications/ -> http://127.0.0.1:8791/api/")
    bullet(pdf, "Widget static: /widget/neo-assist.js + neo-assist.css (from Assist host) with data-api-base = API origin.")
    bullet(pdf, "Env secrets stay server-side only (never in browser): OPENAI/OpenRouter key, DIGEST_ADMIN_TOKEN, SMTP.")
    bullet(pdf, "Daily jobs later: scan notifications; optional digest approve; retention job for Assist.")

    h2(pdf, "7. Boundaries (say this clearly to IT)")
    bullet(pdf, "Tools are assistive. HS codes are shortlists - Neo CHA confirms before filing.")
    bullet(pdf, "Digest posts are awareness summaries - not official CBIC/DGFT text.")
    bullet(pdf, "Assist must not invent duty percentages or prices.")
    bullet(pdf, "Pragma delivers software + cutover support; Neo IT owns production servers/DNS/Django access.")

    h2(pdf, "8. Contacts")
    bullet(pdf, "Pragma: 26pragmalabs@gmail.com")
    bullet(pdf, "Neo public contacts already in product: customercare@neologistics.org | docschennai@neologistics.org")

    pdf.ln(4)
    p(
        pdf,
        "Adithya - if IT only has 15 minutes: show the demo, hand them section 6, get a named owner and a staging date. "
        "That is enough for Pragma to move.",
        size=9,
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
