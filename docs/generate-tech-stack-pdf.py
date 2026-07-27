"""Tech stack + component diagram PDF for Adithya (Neo IT liaison). ASCII-only for Helvetica."""
from datetime import date
from pathlib import Path
from fpdf import FPDF

OUT = Path(
    r"C:\Users\neila\Projects\neo-cha-assistant\docs\Pragma-Flow-Tech-Stack-Component-Diagram.pdf"
)


class PDF(FPDF):
    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(
            0,
            6,
            f"Pragma Flow | Tech stack for Adithya | {date.today().strftime('%d %b %Y')} | Page {self.page_no()}/{{nb}}",
            align="C",
        )


def rx(pdf: PDF):
    pdf.set_x(pdf.l_margin)


def h1(pdf: PDF, text: str):
    rx(pdf)
    pdf.set_font("Helvetica", "B", 15)
    pdf.set_text_color(15, 40, 80)
    pdf.cell(0, 8, text, new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(180, 40, 40)
    pdf.set_line_width(0.4)
    y = pdf.get_y()
    pdf.line(pdf.l_margin, y, pdf.l_margin + pdf.epw, y)
    pdf.ln(3)
    pdf.set_text_color(30, 30, 30)


def h2(pdf: PDF, text: str):
    pdf.ln(1.5)
    rx(pdf)
    pdf.set_font("Helvetica", "B", 10.5)
    pdf.set_text_color(15, 40, 80)
    pdf.cell(0, 5.5, text, new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(210, 210, 210)
    pdf.set_line_width(0.2)
    y = pdf.get_y()
    pdf.line(pdf.l_margin, y, pdf.l_margin + pdf.epw, y)
    pdf.ln(1.8)
    pdf.set_text_color(30, 30, 30)


def p(pdf: PDF, text: str, size=9):
    rx(pdf)
    pdf.set_font("Helvetica", "", size)
    pdf.multi_cell(pdf.epw, 4.3, text)
    pdf.ln(0.6)
    rx(pdf)


def bullet(pdf: PDF, text: str, size=9):
    rx(pdf)
    pdf.set_font("Helvetica", "", size)
    pdf.multi_cell(pdf.epw, 4.2, f"-  {text}")
    rx(pdf)


def mono_block(pdf: PDF, lines: list[str], size=7.2):
    rx(pdf)
    x0 = pdf.l_margin
    y0 = pdf.get_y()
    pdf.set_fill_color(248, 249, 252)
    pdf.set_draw_color(200, 205, 220)
    line_h = 3.6
    h = 4 + len(lines) * line_h
    if y0 + h > pdf.h - pdf.b_margin - 8:
        pdf.add_page()
        y0 = pdf.get_y()
        rx(pdf)
        x0 = pdf.l_margin
    pdf.rect(x0, y0, pdf.epw, h, style="DF")
    pdf.set_xy(x0 + 2.5, y0 + 2)
    pdf.set_font("Courier", "", size)
    pdf.set_text_color(25, 35, 55)
    for line in lines:
        pdf.set_x(x0 + 2.5)
        pdf.cell(pdf.epw - 5, line_h, line, new_x="LMARGIN", new_y="NEXT")
    pdf.set_y(y0 + h + 2)
    pdf.set_text_color(30, 30, 30)
    rx(pdf)


def box_row(pdf: PDF, cells: list[tuple[str, str]], heights=22):
    n = len(cells)
    gap = 3
    w = (pdf.epw - gap * (n - 1)) / n
    y = pdf.get_y()
    x = pdf.l_margin
    for title, body in cells:
        pdf.set_xy(x, y)
        pdf.set_fill_color(245, 247, 252)
        pdf.set_draw_color(48, 51, 146)
        pdf.set_line_width(0.35)
        pdf.rect(x, y, w, heights, style="DF")
        pdf.set_xy(x + 2, y + 2)
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(15, 40, 80)
        pdf.multi_cell(w - 4, 3.8, title)
        pdf.set_x(x + 2)
        pdf.set_font("Helvetica", "", 7.5)
        pdf.set_text_color(40, 40, 40)
        pdf.multi_cell(w - 4, 3.5, body)
        x += w + gap
    pdf.set_y(y + heights + 3)
    rx(pdf)


def build():
    pdf = PDF(orientation="P", unit="mm", format="A4")
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.set_margins(14, 14, 14)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 17)
    pdf.set_text_color(15, 40, 80)
    pdf.cell(0, 8, "Pragma Flow - Tech Stack & Components", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(90, 90, 90)
    pdf.cell(
        0,
        5,
        "For Adithya / Neo Logistics IT  |  Neo Assist · HS Finder · Digests / Blogs",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(1)
    pdf.set_draw_color(180, 40, 40)
    pdf.set_line_width(0.5)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + pdf.epw, pdf.get_y())
    pdf.ln(4)
    pdf.set_text_color(30, 30, 30)

    p(
        pdf,
        "This note answers Adi's ask: tech stack for what we are building, plus a component "
        "diagram of how the pieces connect. Demo today runs on Neil's machine; production sits "
        "behind neologistics.org with Neo IT owning DNS / reverse proxy / process hosting.",
    )

    h1(pdf, "1. What we are building (3 products)")
    box_row(
        pdf,
        [
            (
                "1. Neo Assist",
                "AI chat on site\nLeads + DPDP consent\nRAG over Neo KB\nPort 8787",
            ),
            (
                "2. Neo HS Finder",
                "India CTH / ITC-HS\nDesk recommendation\n~12.5k tariff lines\nPort 8790",
            ),
            (
                "3. Digests -> Blogs",
                "CBIC/DGFT watch\nAI blog posts\nEmail digest opt-in\nPort 8791",
            ),
        ],
        heights=24,
    )
    p(
        pdf,
        "Website UI: Neo Vite/React rebuild (local :5174). Live Django site later gets the same "
        "APIs via reverse proxy + Assist widget embed.",
    )

    h1(pdf, "2. Component diagram")
    mono_block(
        pdf,
        [
            "  [ Browser / Neo website ]",
            "           |",
            "           |  HTTPS (prod) or localhost (demo)",
            "           v",
            "  +------------------+     proxies /api/*",
            "  | Neo Website UI   | --------------------+",
            "  | Vite + React     |                     |",
            "  | :5174 (demo)     |                     |",
            "  +--------+---------+                     |",
            "           | widget embed                  |",
            "           v                               v",
            "  +----------------+  +----------------+  +------------------+",
            "  | Neo Assist API |  | HS Finder API  |  | Digest / Blogs   |",
            "  | Express :8787  |  | Express :8790  |  | Express :8791    |",
            "  +--------+-------+  +--------+-------+  +--------+---------+",
            "           |                   |                   |",
            "           +---------+---------+---------+---------+",
            "                     |",
            "                     v",
            "           +-------------------+     +----------------------+",
            "           | OpenRouter (LLM)  |     | Local data           |",
            "           | GPT-4o / 4o-mini  |     | SQLite (leads)       |",
            "           | prepaid credits   |     | HS index JSON        |",
            "           +-------------------+     | Blog posts JSON      |",
            "                                     | Markdown knowledge/  |",
            "                                     +----------------------+",
            "",
            "  Digest sources:  CBIC / DGFT public pages  -->  scrape + AI summarize --> Blogs",
        ],
    )

    h1(pdf, "3. Tech stack (by layer)")
    h2(pdf, "Frontend")
    bullet(pdf, "Neo site: Vite + React + TypeScript + Tailwind (connectosWebsite1/neologistics)")
    bullet(pdf, "Neo Assist widget: React build -> neo-assist.js / neo-assist.css (drop-in embed)")
    bullet(pdf, "HS Finder + Blogs + Customs Notifications: React pages calling backend APIs")

    h2(pdf, "Backend APIs (Node.js monorepo: neo-cha-assistant)")
    bullet(pdf, "Runtime: Node.js 20+, TypeScript, Express")
    bullet(pdf, "Workspaces: server (Assist), hs-lookup, notifications-digest, widget")
    bullet(pdf, "Validation: Zod  |  Security: Helmet, CORS, rate limits")
    bullet(pdf, "Email (optional): Nodemailer / SMTP for leads + digest")

    h2(pdf, "AI / LLM")
    bullet(pdf, "Provider: OpenRouter (OpenAI-compatible API) - prepaid credits")
    bullet(pdf, "Assist: gpt-4o-mini default; gpt-4o for serious cargo / quote chats")
    bullet(pdf, "HS Finder: gpt-4o for definitive CTH desk ranking")
    bullet(pdf, "Blogs / Digest: gpt-4o writing; content machine auto-publishes on quality gate")
    bullet(pdf, "Keys stay server-side only (.env) - never in the browser")

    h2(pdf, "Data")
    bullet(pdf, "Assist: SQLite (conversations, leads, consent) + Markdown knowledge base + RAG")
    bullet(pdf, "HS: Vendored India CTH-8 index (~12,475 lines) in JSON; lexical search + AI rerank")
    bullet(pdf, "Digest: Scraped notices -> blog-posts.json; syncs published posts to site data file")

    pdf.add_page()
    h1(pdf, "4. Ports and demo URLs (local)")
    mono_block(
        pdf,
        [
            "  :5174   Neo Vite website (UI)",
            "  :8787   Neo Assist API          /api/assistant/*",
            "  :8790   Neo HS Finder API       /api/classify, /api/health",
            "  :8791   Digests / Blogs API     /api/blog-posts, /api/machine/*",
            "",
            "  Site proxies (Vite):",
            "    /api/assistant/*      -> 8787",
            "    /api/hs/*             -> 8790",
            "    /api/notifications/*  -> 8791",
        ],
    )

    h1(pdf, "5. Production cutover (what Neo IT needs)")
    bullet(pdf, "Host the 3 Node services (PM2 / systemd / container) on Neo infra or a small VPS")
    bullet(pdf, "Reverse proxy path or subdomain to each API (nginx / Cloudflare / existing Django proxy)")
    bullet(pdf, "Set env secrets: OPENAI_API_KEY (OpenRouter), OPENAI_BASE_URL, SMTP if email required")
    bullet(pdf, "Assist: add widget script + data-api-base on Django base template")
    bullet(pdf, "Keep DIGEST_AUTO_MACHINE=true so blogs keep publishing when CBIC/DGFT updates land")
    bullet(pdf, "TLS + CORS locked to neologistics.org")

    h1(pdf, "6. Repo map")
    mono_block(
        pdf,
        [
            "  neo-cha-assistant/                 # APIs + widget + content machine",
            "    server/                          # Feature 1 Neo Assist",
            "    hs-lookup/                       # Feature 2 HS / CTH Finder",
            "    notifications-digest/            # Feature 3 Digests -> Blogs",
            "    widget/                          # Embeddable chat widget",
            "    knowledge/                       # Approved Markdown KB",
            "    .env                             # Secrets (not in git)",
            "",
            "  connectosWebsite1/neologistics/    # Vite Neo website UI",
        ],
    )

    h1(pdf, "7. Out of scope (for clarity)")
    bullet(pdf, "Container tracking across Kochi/Chennai ports - separate phase, not these 3 APIs")
    bullet(pdf, "Replacing Neo's Django CMS wholesale - we slot in; Neo IT owns live hosting cutover")

    pdf.ln(3)
    p(
        pdf,
        "Questions / access: Neil (Pragma)  |  Client liaison: Adithya  |  Product: Suraj / Neo Logistics",
        size=8.5,
    )
    p(pdf, "Pragma Flow  |  26pragmalabs@gmail.com", size=8.5)

    pdf.output(str(OUT))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
