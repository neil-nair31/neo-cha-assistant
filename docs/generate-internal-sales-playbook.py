"""Pragma full internal sales & business playbook PDF (all services + glossary)."""
from datetime import date
from pathlib import Path

from fpdf import FPDF

OUT = Path(
    r"C:\Users\neila\Projects\neo-cha-assistant\docs\Pragma-Internal-Sales-Playbook.pdf"
)


def S(t: str) -> str:
    """Core Helvetica is latin-1 only."""
    repl = {
        "\u2014": "-",
        "\u2013": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2022": "-",
        "\u2026": "...",
        "\u00a0": " ",
        "\u2192": "->",
        "\u2190": "<-",
        "\u00d7": "x",
        "\u00b7": "-",
        "\u20b9": "Rs ",
        "\u2713": "Y",
        "\u274c": "N",
    }
    for a, b in repl.items():
        t = t.replace(a, b)
    return t.encode("latin-1", errors="replace").decode("latin-1")


class PDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(110, 110, 110)
        self.cell(
            0,
            6,
            S(
                f"Pragma  |  INTERNAL Business + Sales Playbook  |  {date.today().strftime('%d %b %Y')}  |  CONFIDENTIAL"
            ),
            align="L",
        )
        self.ln(8)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(130, 130, 130)
        self.cell(0, 6, S(f"Page {self.page_no()}/{{nb}}  |  Not for clients  |  26pragmalabs@gmail.com"), align="C")


def h2(pdf: PDF, t: str):
    pdf.ln(2)
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(15, 40, 80)
    pdf.multi_cell(0, 6.5, S(t))
    pdf.set_draw_color(200, 40, 40)
    pdf.set_line_width(0.35)
    y = pdf.get_y()
    pdf.line(pdf.l_margin, y, pdf.w - pdf.r_margin, y)
    pdf.ln(2.5)
    pdf.set_text_color(35, 35, 35)


def h3(pdf: PDF, t: str):
    pdf.ln(1.5)
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "B", 10.5)
    pdf.set_text_color(25, 55, 100)
    pdf.multi_cell(0, 5.5, S(t))
    pdf.set_text_color(35, 35, 35)


def p(pdf: PDF, t: str, size=9.5):
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "", size)
    pdf.multi_cell(0, 4.8, S(t))
    pdf.ln(0.6)


def b(pdf: PDF, t: str, size=9.5):
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "", size)
    pdf.multi_cell(0, 4.7, S(f"-  {t}"))


def kb(pdf: PDF, label: str, body: str):
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "", 9.5)
    pdf.multi_cell(0, 4.7, S(f"-  {label}: {body}"))


def money(pdf: PDF, label: str, amount: str):
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "B", 9.5)
    pdf.cell(100, 5.5, S(label))
    pdf.cell(0, 5.5, S(amount), align="R", new_x="LMARGIN", new_y="NEXT")


def box(pdf: PDF, t: str):
    pdf.set_x(pdf.l_margin)
    pdf.set_fill_color(244, 247, 252)
    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(0, 4.7, S(t), fill=True)
    pdf.ln(1.5)


def term(pdf: PDF, word: str, meaning: str):
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "B", 9)
    pdf.multi_cell(0, 4.5, S(word))
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(0, 4.5, S(meaning))
    pdf.ln(0.8)


def main():
    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.set_margins(14, 14, 14)
    pdf.add_page()

    # COVER
    pdf.set_xy(pdf.l_margin, 24)
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(15, 40, 80)
    pdf.multi_cell(0, 10, S("Pragma"))
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "B", 13)
    pdf.multi_cell(0, 7, S("Internal Business + Sales Playbook"))
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(90, 90, 90)
    pdf.ln(2)
    pdf.multi_cell(
        0,
        5,
        S(
            f"For outreach and pre-sales only. Not a client-facing proposal.\n"
            f"Updated {date.today().strftime('%d %B %Y')}  |  26pragmalabs@gmail.com\n"
            "Covers ALL Pragma services (websites, ConnectOS, NestOS, Pragma Flow AI tools, portal, retainers),\n"
            "how deals actually run, pricing guidance, demos, and a full plain-English glossary."
        ),
    )
    pdf.set_text_color(35, 35, 35)
    pdf.ln(3)
    box(
        pdf,
        "ONE-LINE PITCH: Pragma builds first-party software for real-ops businesses - "
        "marketing sites that convert, admin systems that capture leads, recruitment ops platforms, "
        "and domain AI tools (assistant, classification support, digests, client portals) that do not invent "
        "liability on regulated topics.",
    )
    p(
        pdf,
        "Read order for a new hire: (1) How Pragma makes money  (2) Service map  "
        "(3) Deep-dives on any product you will sell  (4) Deal process  (5) Pricing cheat sheet  "
        "(6) Glossary before any technical call  (7) Talk tracks.",
        size=9,
    )

    # =========================================================
    h2(pdf, "1. What Pragma is (business model)")
    p(
        pdf,
        "Pragma is a product-building studio (custom software + productized modules). "
        "We are NOT a pure staffing agency, NOT a pure design agency, and NOT a multi-tenant SaaS company "
        "that keeps all client data on a secret platform forever. We design, ship, and hand over systems "
        "the client (or their IT) can own.",
    )
    h3(pdf, "How we make money")
    b(pdf, "One-time build fees (majority): website, admin platform modules, AI features, ops portals.")
    b(pdf, "Optional monthly retainer: support, small changes, content ops, hosting help.")
    b(pdf, "Pass-through costs: AI API credits, cloud host (Render/Neon etc.), special OCR/WhatsApp APIs - client pays actuals or we invoice cost.")
    b(pdf, "Trials: sometimes a small trial access fee (example NestOS trial) before full product sale.")
    h3(pdf, "Who we sell to (ideal client)")
    b(pdf, "Ops-heavy SMEs / mid-market in India: recruitment/staffing, logistics & CHA customs, specialist professional brands.")
    b(pdf, "They have WhatsApp chaos, brochure website, or Excel as the 'system of record'.")
    b(pdf, "They care about brand + compliance, not toy AI demos.")
    b(pdf, "Someone can own production (their IT, founder, or willing paid host accounts).")
    h3(pdf, "Who is a waste of time")
    b(pdf, "Want free ChatGPT pasted on site with no ownership / no payment.")
    b(pdf, "Want ERP/TMS/full enterprise RFP for agency-size budget.")
    b(pdf, "Want us to invent binding legal/duty/classification as a product promise.")
    b(pdf, "No decision maker after 2 calls and endless 'just one more demo for cousin'.")

    # =========================================================
    h2(pdf, "2. Full service map (memorize this table)")
    p(pdf, "Every pitch maps to one or more of these product lines:", size=9)
    b(pdf, "A. Marketing website rebuild/build - public brand site that converts.")
    b(pdf, "B. ConnectOS - website lead admin inbox (forms -> database -> dashboard).")
    b(pdf, "C. NestOS - full recruitment / staffing company operating system (internal).")
    b(pdf, "D. Pragma Flow - modular AI + desk tools for specialized ops (CHA/logistics package fully built; pattern resells).")
    b(pdf, "E. Client tracking portal - public track + client login + staff ops console.")
    b(pdf, "F. Deploy / hosting setup + handoff - make it live + keep it alive.")
    b(pdf, "G. Ongoing tech retainer - bug fixes, small updates, monitoring.")
    b(pdf, "H. Internal only for now: PragmaOS - Pragma's own studio OS foundation (NOT sold externally yet).")
    pdf.ln(1)
    box(
        pdf,
        "IMPORTANT: Neo Logistics is ONE client case for line D+E. ConnectorsHR / HummingBrains are cases for A+B+C. "
        "Do not talk as if Pragma only sells 'the Neo bot'. Sell the PRODUCT LINE that fits the buyer's industry.",
    )

    # =========================================================
    h2(pdf, "3. Service deep-dive A - Marketing websites")
    h3(pdf, "What it is")
    p(
        pdf,
        "We rebuild or design a modern company website for the client's brand (examples: ConnectorsHR recruitment site, Neo Logistics marketing site rebuild). "
        "Pages, mobile layout, contact forms, SEO basics, performance. Content may be migrated from old site or written with client sign-off.",
    )
    h3(pdf, "Business problem it solves")
    b(pdf, "Old WordPress/static brochure that confuses employers/candidates or importers.")
    b(pdf, "Forms open someone's personal email and vanish.")
    b(pdf, "Brand looks weaker than competitors.")
    h3(pdf, "Typical pieces")
    b(pdf, "Public pages: Home, About, Services, Industries, Contact, careers / job-hunter variants.")
    b(pdf, "Forms that POST to an API (ConnectOS or similar) instead of mailto-only.")
    b(pdf, "Admin path if bundled with ConnectOS.")
    b(pdf, "Deploy to Cloudflare Pages / Netlify style frontend + separate API host.")
    h3(pdf, "Technical wording you may hear")
    kb(pdf, "Frontend", "What the visitor sees in the browser.")
    kb(pdf, "SPA", "Single-page application - site changes pages without full reloads (React apps often work this way).")
    kb(pdf, "React / Vite / Next.js", "Tools for building modern web frontends. You don't need to code them - just know 'modern JS website stack'.")
    kb(pdf, "SEO", "Search engine optimization - titles, meta, structure so Google can find the business.")
    kb(pdf, "DNS", "Domain name settings that point connectorshr.com or neologistics.org to hosting.")
    h3(pdf, "Pricing guidance (website only)")
    money(pdf, "Reference quote (ConnectorsHR website share)", "Part of Rs 40k package: website ~ Rs 28k")
    money(pdf, "Typical range (standalone rebuild)", "Rs 25,000 - 1,50,000+")
    p(
        pdf,
        "Price rises with pages, custom design depth, content writing volume, multi-language, CMS, animations. "
        "ConnectorsHR was a relationship-efficient package, NOT the market ceil for every brand.",
        size=9,
    )
    h3(pdf, "How you sell it")
    b(pdf, "Lead with conversion and brand trust, not 'we use React'.")
    b(pdf, "Always pair website with ConnectOS when forms matter - otherwise leads die in email.")
    b(pdf, "Ask who owns domain login - biggest deployment blocker.")

    # =========================================================
    h2(pdf, "4. Service deep-dive B - ConnectOS")
    h3(pdf, "What it is (plain English)")
    p(
        pdf,
        "ConnectOS is the back-office for a company website. When someone fills a form "
        "(job seeker CV, employer hire request, contact, careers), it is saved in a database and shows "
        "in a password-protected admin inbox with filters, search, CV download, and CSV export. "
        "It is NOT a full recruiter ATS and NOT NestOS.",
    )
    h3(pdf, "Reference client")
    p(pdf, "ConnectorsHR (recruitment brand). Prod shape: public website + admin at /admin.")
    h3(pdf, "What ConnectOS does")
    b(pdf, "Receive multi-type form submissions via API.")
    b(pdf, "Store name, email, phone, company, message, source page, CV file.")
    b(pdf, "Spam friction (e.g. honeypot fields).")
    b(pdf, "Admin login (JWT session).")
    b(pdf, "Filter types: Candidate / Employer / Careers / Contact.")
    b(pdf, "CSV export for Excel/CRM.")
    b(pdf, "Optional email notify when a lead lands (SMTP / Resend).")
    h3(pdf, "What ConnectOS does NOT do")
    b(pdf, "No interview pipeline stages.")
    b(pdf, "No Naukri Resdex sourcing.")
    b(pdf, "No call logging, end-of-day sign-out, multi-role RBAC for whole staff (NestOS).")
    b(pdf, "No MRR/invoicing CRM depth.")
    h3(pdf, "Pricing guidance")
    money(pdf, "Reference (ConnectOS share of CHR quote)", "~ Rs 12,000 of Rs 40,000 package")
    money(pdf, "Packaged website + ConnectOS (CHR Option 1)", "Rs 40,000 one-time")
    money(pdf, "CHR Option 2", "Rs 25,000 up front + Rs 4,000/month retainer")
    money(pdf, "Typical production hosting (not our fee)", "~ $7-26/month services (Render, DB, etc.)")
    h3(pdf, "Sales line")
    box(
        pdf,
        "Website alone generates vanity traffic. ConnectOS makes traffic into a recoverable lead pipeline. "
        "If the buyer loses CVs in WhatsApp, this is the product.",
    )

    # =========================================================
    pdf.add_page()
    h2(pdf, "5. Service deep-dive C - NestOS")
    h3(pdf, "What it is (plain English)")
    p(
        pdf,
        "NestOS is an internal recruitment / staffing company operating system. "
        "Built for HummingBrains / RTS-style firms that sell (1) staff augmentation, "
        "(2) talent acquisition placements, and (3) Interview-as-a-Service (IaaS). "
        "Team logs in with roles. It is NOT the public marketing website.",
    )
    h3(pdf, "Who uses which role")
    kb(pdf, "Recruiter", "Daily sourcing, candidates, outreach, Resdex helper, interviews, activity log, end day.")
    kb(pdf, "Manager", "Assigns interviews, team visibility, review operations, broader dashboards.")
    kb(pdf, "Sales", "Leads, clients, renewals, revenue/invoices.")
    kb(pdf, "Admin", "Everything + sign-out reviews + settings + audit.")
    h3(pdf, "Major modules (explain without fear)")
    kb(pdf, "Talent Hub", "Master list of candidates - profiles, resumes, documents.")
    kb(pdf, "OCR / PDF parse", "Upload many CVs; system extracts text/fields (Azure Document Intelligence when configured; plain text PDFs work without).")
    kb(pdf, "Naukri Resdex helper", "Chrome extension; Naukri has no public API so recruiters still use Resdex; helper sends shortlisted CVs into NestOS without retyping.")
    kb(pdf, "Activity log", "Verified calls / WhatsApp / email / LinkedIn outreach entries.")
    kb(pdf, "End of day / sign-out", "Recruiter closes day with summary; manager can review unlogged work.")
    kb(pdf, "Workspace + tasks", "Internal tasks/messages so work is not stuck in email chains.")
    kb(pdf, "IaaS interviews", "Interview-as-a-Service workflow - run client-supplied candidates through structured interview flow + faster report style capture.")
    kb(pdf, "Team and audit", "Who is online / in interview / utilization-style tracking.")
    kb(pdf, "Clients / Leads / Revenue", "CRM layer - pipeline health, invoices, MRR style views.")
    kb(pdf, "Analytics", "Pipeline, sourcing, outreach, team, IaaS tabs - based on verified activity.")
    kb(pdf, "RBAC", "Role-based access control - each login only sees/does what their job needs.")
    h3(pdf, "Business lines NestOS maps to (HummingBrains language)")
    kb(pdf, "Staff augmentation", "Place contractors at client sites; bill monthly.")
    kb(pdf, "Talent acquisition (TA)", "Permanent hire search; placement fee.")
    kb(pdf, "IaaS", "Client sends candidates; we interview + deliver assessment report.")
    h3(pdf, "Honest status language (use this)")
    p(
        pdf,
        "NestOS has been demoed and trialled with HummingBrains / Mani-class stakeholders. "
        "It is a serious product surface with multi-user trial packaging. "
        "Always clarify trial vs full production handover vs future ATS connectors.",
    )
    h3(pdf, "Trial commercial example")
    money(pdf, "NestOS multi-user trial access fee (example invoice)", "Rs 12,999")
    p(
        pdf,
        "That fee covers trial hosting footprint, OCR/API-ish costs, helper distribute - "
        "it is NOT the full NestOS product price. Full production sale is phased and higher - always re-scope with founder before quoting full NestOS.",
        size=9,
    )
    h3(pdf, "How NestOS relates to ConnectOS")
    box(
        pdf,
        "ConnectOS = public site lead capture for ConnectorsHR brand.\n"
        "NestOS = day-to-day ops OS for staffing company.\n"
        "Some patterns shared (activity, analytics thinking). Different products and buyers.",
    )

    # =========================================================
    h2(pdf, "6. Service deep-dive D - Pragma Flow (AI + desk tools)")
    h3(pdf, "What the product line is")
    p(
        pdf,
        "Pragma Flow is a modular package of first-party AI and desk tools for specialist operations. "
        "The flagship shipped build is for licensed CHA / logistics (Neo Logistics class). "
        "You sell the MODULES, then name them for the client (Neo Assist, etc.).",
    )
    h3(pdf, "Module D1 - Website AI Assist")
    p(
        pdf,
        "Branded site chat that answers from the client's approved knowledge (services, FAQs, process).",
    )
    kb(pdf, "Does", "Educate, route, escalate, capture consented leads (name/company/email/phone).")
    kb(pdf, "Does not", "Invent duty %, bound prices, fake ETAs, legal advice.")
    kb(pdf, "Tech stack plain words", "Server holds AI key; widget is UI; RAG pulls relevant knowledge chunks into the prompt; SQLite stores chats/leads/consent.")
    kb(pdf, "Why sold", "Website stops being a dead brochure; serious enquiries become CRM-ready.")
    h3(pdf, "Module D2 - Domain lookup tool (India HS / CTH Finder for CHA)")
    p(
        pdf,
        "For CHA/logistics: India CTH 8-digit educational recommender over full India tariff index, "
        "optionally locked to the firm's own filed desk precedents when goods match.",
    )
    kb(pdf, "Does", "Primary code, ruled-out lines, desk memo, docs checklist, ports, handoff to CHA.")
    kb(pdf, "Does not", "Replace licensed CHA filing / BoE / Shipping Bill.")
    kb(pdf, "Resell angle", "Same pattern = 'your industry catalog + your rules + memo + handoff' for other verticals (insurance codes, parts catalogs, etc.) - needs discovery.")
    h3(pdf, "Module D3 - Digests / content machine")
    p(
        pdf,
        "Monitor regulator or industry sources (e.g. CBIC/DGFT), summarize into desk-style posts, "
        "tag industries, publish to site, email subscribe.",
    )
    kb(pdf, "Does", "Authority content without full-time writer; optional quality scoring.")
    kb(pdf, "Does not", "Automatic legal advice or auto-change client operations.")
    h3(pdf, "Module D4 - Client tracking portal (Phase A)")
    p(
        pdf,
        "Public track by container/BL/ref + client dashboard + staff ops console "
        "(milestones, docs, charges, dispatch). Seed/desk-updatable data in Phase A.",
    )
    kb(pdf, "Phase A honesty", "Works as branded status glass + ops process product.")
    kb(pdf, "Phase B upsell", "Live PCS / carrier feeds - separate larger quote.")
    h3(pdf, "Pragma Flow package pricing (target closes)")
    money(pdf, "Assist only", "Rs 1.25L - 1.75L  (floor ~ Rs 1.0L)")
    money(pdf, "Core three (Assist + HS + Digests)", "Target Rs 2.5L  (band 2.25-2.75L, floor ~2.0L)")
    money(pdf, "Core three + Portal Phase A", "Target Rs 4.0L  (band 3.75-4.5L, floor ~3.25L)")
    money(pdf, "AI credits / launch wallet", "Often separate (e.g. Rs 5k OpenRouter style) + monthly actuals")
    money(pdf, "Optional monthly ops after go-live", "Rs 15k - 25k depending scope")
    h3(pdf, "Reference client")
    p(
        pdf,
        "Neo Logistics - licensed CHA & logistics (Cochin / Chennai). Full three tools built; portal Phase A available. "
        "Live on production domain still needs their IT embed + host - demos can be staging/local.",
        size=9,
    )

    # =========================================================
    h2(pdf, "7. Service deep-dive F+G - Deploy, host, retain")
    h3(pdf, "Deploy / go-live")
    p(
        pdf,
        "Making software reachable on the internet safely: DNS, SSL, reverse proxy, env secrets, "
        "admin seed, smoke tests. Client must provide domain access and usually pays host accounts with their card.",
    )
    kb(pdf, "Typical CHR stack example", "Cloudflare Pages (frontend), Render (API), managed DB, Resend (email).")
    kb(pdf, "CHA AI stack", "Node APIs on VPS/PM2 or similar + reverse proxy paths /api/assistant etc. + widget embed into Django/React site.")
    h3(pdf, "Retainer")
    p(
        pdf,
        "Monthly fee for on-demand tech support: bugs, redeploys, admin/API issues, minor content or feature tweaks. "
        "Cancel with notice (e.g. 30 days). Does NOT include unlimited new products.",
    )
    money(pdf, "CHR example retainer", "Rs 4,000 / month")
    money(pdf, "Pragma Flow ops retainer band", "Rs 15,000 - 25,000 / month")

    # =========================================================
    h2(pdf, "8. How business is actually done (sales -> build -> money)")
    h3(pdf, "Stage 0 - Positioning")
    b(pdf, "We sell outcomes: more recoverable leads, less ops chaos, modern trust, controlled AI.")
    b(pdf, "We show working demos whenever possible - decks alone convert poorly.")
    h3(pdf, "Stage 1 - Outreach")
    b(pdf, "Identify decision maker (owner, MD, IT head, ops head).")
    b(pdf, "Short message + offer demo of the matching product line.")
    b(pdf, "Do NOT dump full pricing wall first; book a discovery call.")
    h3(pdf, "Stage 2 - Discovery (30 min)")
    b(pdf, "What is broken today (WhatsApp, lost CVs, static HS fights, silent website).")
    b(pdf, "Who uses what tools; existing domain / host / CRM.")
    b(pdf, "Must-have in 60 days vs wishlist.")
    b(pdf, "Budget signals and who signs.")
    b(pdf, "Take notes; map to service letters A-G.")
    h3(pdf, "Stage 3 - Demo")
    b(pdf, "Only demo product lines you diagnosed. Keep under 40 min + Q&A.")
    b(pdf, "Always state Phase A vs Phase B if portal/integrations involved.")
    b(pdf, "Always state AI refuses inventing liability for CHA products.")
    h3(pdf, "Stage 4 - Package + quote")
    b(pdf, "Founder approves non-standard discounts under floors.")
    b(pdf, "Send short client proposal (not this full internal PDF).")
    b(pdf, "Separate AI / hosting actuals explicitly.")
    b(pdf, "Payment prefer 40% kickoff / 40% staging accept / 20% go-live ready.")
    h3(pdf, "Stage 5 - Kickoff")
    b(pdf, "Collect assets: logo, content, domain access, admin emails, SMTP decision.")
    b(pdf, "Confirm stack ownership (who pays Cloudflare/Render/OpenRouter).")
    b(pdf, "Shared chat (WhatsApp/Slack) + single source of scope list.")
    h3(pdf, "Stage 6 - Build + staging")
    b(pdf, "Ship in thin vertical slices (working path, not 8 week blackout).")
    b(pdf, "Staging URL or local + tunnel for client trials.")
    b(pdf, "Change-request rule: out of scope = re-quote.")
    h3(pdf, "Stage 7 - Handoff + go-live")
    b(pdf, "IT pack: env example, ports, embed snippet, runbook.")
    b(pdf, "Smoke checklist; retention of admin credentials properly.")
    b(pdf, "Offer retainer.")
    h3(pdf, "Stage 8 - Expand")
    b(pdf, "Land and expand: website -> ConnectOS; ConnectOS -> NestOS; Assist -> HS + digests -> portal.")
    b(pdf, "NestOS trial -> full production modules.")

    # =========================================================
    pdf.add_page()
    h2(pdf, "9. Pricing matrix (internal - all lines)")
    p(pdf, "Currency INR. Always get founder sign-off below floors or on custom enterprise.", size=9)
    money(pdf, "Website + ConnectOS (CHR style Option 1)", "Rs 40,000 one-time")
    money(pdf, "Website + ConnectOS (CHR Option 2)", "Rs 25k + Rs 4k/mo")
    money(pdf, "Website rebuild band (general)", "Rs 25k - 1.5L+ by scope")
    money(pdf, "ConnectOS standalone add-on band", "Rs 12k - 80k by depth")
    money(pdf, "NestOS multi-user trial fee (example)", "Rs 12,999")
    money(pdf, "NestOS full production", "PHASED - do not freestyle; founder scopes")
    money(pdf, "Pragma Flow Assist only", "Rs 1.25L - 1.75L")
    money(pdf, "Pragma Flow core 3 tools", "Rs 2.5L target")
    money(pdf, "Pragma Flow + portal Phase A", "Rs 4.0L target")
    money(pdf, "AI credits", "Pass-through / small launch wallet")
    money(pdf, "Hosting cloud (client)", "typically few $ to tens of $/mo")
    h3(pdf, "Payment language (standard)")
    b(pdf, "40 / 40 / 20 for multi-lakh builds.")
    b(pdf, "100% up front acceptable on small fixed website packages.")
    b(pdf, "Trial fees 100% before credentials.")
    b(pdf, "GST: confirm registration at invoicing.")

    # =========================================================
    h2(pdf, "10. Discovery questions by scenario")
    h3(pdf, "Any website / lead capture prospect")
    b(pdf, "Where do enquiries go today? Email, WhatsApp, nowhere?")
    b(pdf, "Who follows up and how fast?")
    b(pdf, "Do you collect CVs or documents?")
    b(pdf, "Who owns the domain DNS login?")
    h3(pdf, "Staffing / recruitment prospect")
    b(pdf, "Staff aug vs permanent placements vs IaaS - which lines?")
    b(pdf, "Do recruiters live in Excel + Naukri + WhatsApp?")
    b(pdf, "Any ATS today (Greenhouse etc.)?")
    b(pdf, "Do managers need proof of activity / utilization?")
    h3(pdf, "CHA / logistics prospect")
    b(pdf, "What % of first contact is 'what's the HS code' / duty / 'where is my container'?")
    b(pdf, "Do you want leads from website into sales inbox with consent?")
    b(pdf, "Have you ever been burned by wrong public classification claims?")
    b(pdf, "Who updates clients today on shipment status?")

    # =========================================================
    h2(pdf, "11. Demo scripts (compact)")
    h3(pdf, "ConnectOS (15 min)")
    b(pdf, "Public form submit test lead -> admin login -> find row -> download CV -> CSV export.")
    b(pdf, "Close: lost WhatsApp leads die; this is recoverable.")
    h3(pdf, "NestOS (25-40 min)")
    b(pdf, "Recruiter: candidates, Resdex helper, log call, end day.")
    b(pdf, "Manager/Admin: sign-out review, tasks, analytics, clients/revenue skim.")
    b(pdf, "Close: three business lines on one OS; trial then production scope.")
    h3(pdf, "Pragma Flow (30-40 min)")
    b(pdf, "Assist quote path + consent form + desk phones.")
    b(pdf, "HS desk precedent green badge (cashew/clinker).")
    b(pdf, "Blog post + subscribe chips.")
    b(pdf, "Portal public track + ops console if in package.")

    # =========================================================
    h2(pdf, "12. Objection handling (all products)")
    kb(pdf, "Just use WhatsApp", "WhatsApp is not filterable compliance history, not a shared CRM, not searchable for CV harvest.")
    kb(pdf, "Just use ChatGPT", "No brand control, invents answers, no consent pipeline, keys often misused.")
    kb(pdf, "SaaS tools exist", "Many generic; weak India logistics/customs / weak Resdex reality. We ship first-party you brand.")
    kb(pdf, "IT will build later", "Cool - then buy product acceleration + domain design. Still sells modules.")
    kb(pdf, "Need live tracking day 1", "Portal Phase A first; Phase B integrations quoted separately.")
    kb(pdf, "Too expensive", "Split packages; floors exist; free rebuilds kill the studio.")
    kb(pdf, "Show live on our domain now", "Staging first is normal; production needs their DNS + host.")

    # =========================================================
    h2(pdf, "13. Ready talk tracks")
    h3(pdf, "Cold - general")
    p(
        pdf,
        "Hi [Name] - I'm with Pragma. We build first-party software for ops-heavy businesses: "
        "websites that actually capture leads, recruitment ops systems, and specialized AI desk tools "
        "that refuse unsafe answers. Happy to show a working demo if useful.",
        size=9,
    )
    h3(pdf, "Cold - staffing")
    p(
        pdf,
        "Recruiting teams often run Naukri + Excel + WhatsApp. We built NestOS - ops layer for "
        "talent, activity proof, IaaS interviews, and revenue visibility - and ConnectOS if the site loses CVs.",
        size=9,
    )
    h3(pdf, "Cold - CHA/logistics")
    p(
        pdf,
        "Most CHA sites are brochures. We ship Assist + India HS desk support + customs digests "
        "and an optional client track portal - educational tools that protect the licence.",
        size=9,
    )
    h3(pdf, "Close skeleton")
    p(
        pdf,
        "Package is fixed-scope. Staging acceptance unlocks next invoice tranche. "
        "AI/hosting are actuals. IT handoff is included for go-live. Expand modules later.",
        size=9,
    )

    # =========================================================
    h2(pdf, "14. Portfolio snapshot (honest for internal)")
    kb(pdf, "ConnectorsHR", "Website + ConnectOS style lead admin - quoting/deploy path documented.")
    kb(pdf, "HummingBrains / Mani orbit", "NestOS product + trial packaging + ops guides + Chrome helper.")
    kb(pdf, "Neo Logistics", "Pragma Flow: Assist, HS desk finder, digests/blogs, client portal Phase A; market site integration path.")
    kb(pdf, "PragmaOS", "Internal foundation for Pragma studio OS - Phase 1 technical. DO NOT sell as client product yet.")
    p(
        pdf,
        "Never invent live production claims. If demo-only, say demo/trial. If partial go-live, say staging + IT remaining.",
        size=9,
    )

    # =========================================================
    h2(pdf, "15. Hard do-NOTs")
    b(pdf, "Do not send THIS PDF to clients unredacted.")
    b(pdf, "Do not promise binding HS, duty %, legal conclusions.")
    b(pdf, "Do not promise live carrier tracking without Phase B sell.")
    b(pdf, "Do not quote full NestOS from memory without founder.")
    b(pdf, "Do not put API keys, trial passwords, or client secrets in public posts.")
    b(pdf, "Do not offer free unlimited features to 'close this month'.")
    b(pdf, "Do not position portal or NestOS as finished forever products if they are phased.")

    # =========================================================
    pdf.add_page()
    h2(pdf, "16. FULL GLOSSARY (plain English for non-tech sales)")
    p(
        pdf,
        "If a word is said on a call and you freeze, search this section after. Definitions are practical, not exam theory.",
        size=9,
    )

    term(pdf, "AI (Artificial Intelligence)", "Software that can draft answers, classify text, or extract info. We always constrain it with company knowledge and rules.")
    term(pdf, "API", "How software programs talk to each other. Forms send data to an API; the admin UI reads from the same API. Clients never need to 'see' the API.")
    term(pdf, "API key", "Secret password for a paid service (OpenAI/OpenRouter/Azure). Lives only on SERVER, never in the public website code.")
    term(pdf, "ATS", "Applicant Tracking System - software for hiring pipelines (stages, jobs). NestOS covers ops; big brand ATS (Greenhouse) may integrate later.")
    term(pdf, "Azure Document Intelligence (DI)", "Microsoft cloud OCR/document reading. Helps turn scanned PDF CVs into text when plain text is missing.")
    term(pdf, "Backend / Server", "Hidden software that stores data, checks logins, talks to AI, sends email. Runs on a host like Render or a VPS.")
    term(pdf, "BoE (Bill of Entry)", "Import customs filing document in India. HS tool must NEVER replace CHA final BoE judgment.")
    term(pdf, "Browser extension (Chrome helper)", "Small install inside Chrome that reads what is on a page (e.g. Naukri Resdex) and sends chosen rows into NestOS.")
    term(pdf, "CBIC", "Central Board of Indirect Taxes and Customs - India customs authority; notices feed digests.")
    term(pdf, "CDN", "Content Delivery Network - hosting that serves website files fast worldwide (Cloudflare Pages is CDN-like).")
    term(pdf, "CHA", "Customs House Agent / licensed customs broker. Highly reputation-sensitive client type.")
    term(pdf, "Cloudflare", "Company for DNS, security, and free/cheap frontend hosting (Pages).")
    term(pdf, "Consent (DPDP-aware)", "User must agree before we store personal contact data for follow-up. India data protection mindset.")
    term(pdf, "ConnectOS", "Pragma product: website form submissions admin inbox + storage + CSV.")
    term(pdf, "CORS", "Browser security rule about which website may call which API. Misconfigured CORS = form fails in browser.")
    term(pdf, "CRM", "Customer Relationship Management - tracking clients/leads/deals. NestOS includes a light CRM layer.")
    term(pdf, "CSV", "Spreadsheet file you can open in Excel. ConnectOS exports leads as CSV.")
    term(pdf, "CTH / HS code", "Number that classifies traded goods for customs. India often uses 8-digit CTH.")
    term(pdf, "Database", "Organized storage (MySQL, Postgres, SQLite). Without DB, leads do not persist.")
    term(pdf, "Deploy / go-live", "Putting software on the internet for real users, not just your laptop.")
    term(pdf, "DGFT", "Directorate General of Foreign Trade - India trade policy notices; part of digests source set.")
    term(pdf, "DNS", "Settings that say 'this domain name opens this host server'. Client often gates deployment.")
    term(pdf, "Domain", "Human website name (example.com). Separate from hosting.")
    term(pdf, "DPDP", "India's Digital Personal Data Protection regime (high-level). Reason we stress consent.")
    term(pdf, "Embed (widget)", "Paste a small script into a site so Assist chat appears on all pages.")
    term(pdf, "Env / .env", "File of secrets and config on the server (API keys, DB URL). Never email publicly.")
    term(pdf, "Express", "Popular Node.js framework for building APIs. (Background tech name.)")
    term(pdf, "Frontend", "Screens users see.")
    term(pdf, "Guardrails", "Rules that stop AI from saying unsafe things (duty %, legal invention). Selling point.")
    term(pdf, "Hosting", "Paying a company to run servers 24/7 (Render, VPS, etc.).")
    term(pdf, "Handoff", "Giving client IT the package to run themselves with docs and secrets structure.")
    term(pdf, "IaaS (Interview-as-a-Service)", "Business line: client pays staffing firm to interview candidates and deliver reports.")
    term(pdf, "JWT", "Login token technology - keeps admin session secure after password login.")
    term(pdf, "KB / Knowledge base", "Approved written docs the Assist AI is allowed to ground answers on.")
    term(pdf, "Lead", "A person/company who raised hand (form/chat) - potential sales target.")
    term(pdf, "Monorepo", "One code repository containing multiple packages (Assist API + HS + digests).")
    term(pdf, "MRR", "Monthly Recurring Revenue - helpful sales metric for staffing clients.")
    term(pdf, "MySQL / Postgres / SQLite", "Database brands. MySQL often ConnectOS; SQLite often local Assist/NestOS demos.")
    term(pdf, "Naukri / Resdex", "Big India job portal; Resdex is recruiter search. No full public API - hence our helper.")
    term(pdf, "Neon", "Managed Postgres cloud DB example.")
    term(pdf, "NestOS", "Pragma recruitment ops platform product.")
    term(pdf, "Node.js", "Runtime that lets JavaScript/TypeScript run servers.")
    term(pdf, "OCR", "Optical character recognition - reading text from images/scans of CVs.")
    term(pdf, "OpenRouter", "Billed gateway that can route requests to OpenAI and other models using prepaid credits.")
    term(pdf, "Pass-through cost", "Money spent on vendors that we rebill at cost or client pays directly - not pure Pragma margin.")
    term(pdf, "Phase A / Phase B", "Shipping order: usable product first; live external integrations later.")
    term(pdf, "PM2 / systemd", "Process managers that keep Node servers running after reboot on a VPS.")
    term(pdf, "Portal", "Client login area (vs public website).")
    term(pdf, "Pragma Flow", "Name for modular AI/desk suite (Assist, HS, digests, portal).")
    term(pdf, "Production", "The real public system. Opposite of local demo.")
    term(pdf, "Proxy / reverse proxy", "Nginx or host path that maps public URL path to an internal port (e.g. /api/assistant -> port 8787).")
    term(pdf, "RAG", "Retrieval-Augmented Generation - AI answers using retrieved knowledge snippets, not pure imagination.")
    term(pdf, "Rate limit", "Cap to stop spam bots from abusing chat/forms.")
    term(pdf, "RBAC", "Role-based access control - different menus by job role.")
    term(pdf, "React", "Frontend library used for many of our UIs.")
    term(pdf, "Render", "Cloud host for backend APIs (common for ConnectOS).")
    term(pdf, "Resend", "Modern transactional email API - form notifications.")
    term(pdf, "Retainer", "Monthly support fee.")
    term(pdf, "Scope", "Exact list of paid deliverables. Change requests outside scope re-quote.")
    term(pdf, "SMTP", "Classic email sending protocol (Gmail Workspace apps password or company mail server).")
    term(pdf, "SPA", "Single-page app - slick site UX via JS routing.")
    term(pdf, "SSL / HTTPS", "Padlock encryption for websites. Required for production.")
    term(pdf, "Staging", "Near-production environment for client review before go-live.")
    term(pdf, "Staff augmentation", "Placing contractors into client teams for recurring billing.")
    term(pdf, "Talent acquisition", "Permanent recruitment with placement fees.")
    term(pdf, "Tunnel (Cloudflare tunnel)", "Temporary public URL that points to software on your laptop for demos.")
    term(pdf, "TypeScript", "JavaScript with types - how we write robust code. Clients need not care.")
    term(pdf, "UI / UX", "User Interface / User Experience - screens and how easy they feel.")
    term(pdf, "VPS", "Virtual Private Server - rented Linux machine you fully control.")
    term(pdf, "Widget", "Floating chat button component.")
    term(pdf, "WhatsApp Business API", "Official programmable WhatsApp (paid / approved). Different from personal WhatsApp chat.")

    # =========================================================
    pdf.add_page()
    h2(pdf, "17. Industry terms mini-glossary (clients she will meet)")
    term(pdf, "CHA / Customs Broker", "Licensed person/company that files customs docs. High trust bar.")
    term(pdf, "FF / Freight forwarder", "Organizes international transport legs, often with CHA.")
    term(pdf, "ICEGATE", "India customs portal systems ecosystem (electronically filing).")
    term(pdf, "AEO", "Authorized Economic Operator - trusted trader certification mark many CHAs mention.")
    term(pdf, "IEC", "Importer Exporter Code - required for Indian importers/exporters.")
    term(pdf, "BL / BoL", "Bill of Lading - ocean shipping transport document.")
    term(pdf, "Container number", "Unique ID for a shipping container - used in track tools.")
    term(pdf, "Clearance", "Getting goods released by customs.")
    term(pdf, "Desk precedent", "How THIS firm previously treated a goods line / CTH in filing practice.")
    term(pdf, "Resdex credits", "Naukri prepaid credits recruiters spend viewing profiles - NestOS tries to reduce waste.")
    term(pdf, "Placement fee", "One-time fee when a permanent hire joins client via recruiter.")
    term(pdf, "Bench", "Recruiters/candidates between assignments - operations concept.")

    # =========================================================
    h2(pdf, "18. One-page operating cheat sheet")
    p(pdf, "WE ARE: Pragma - first-party software studio for real-ops businesses.", size=9.5)
    p(pdf, "PRODUCT LINES: Website | ConnectOS | NestOS | Pragma Flow AI suite | Portal | Deploy | Retainer", size=9.5)
    p(pdf, "MATCH: forms lost -> Website+ConnectOS | staffing chaos -> NestOS | CHA trust tools -> Flow | status spam -> Portal", size=9.5)
    p(pdf, "CORE PRICE ANCHORS: CHR Web+OS ~40k | Flow 2.5L | Flow+Portal 4L | NestOS full = founder scopes | Nest trial ~13k", size=9.5)
    p(pdf, "PROCESS: Outreach -> Discovery -> Demo -> Quote -> Kickoff -> Staging -> Handoff -> Retain/Expand", size=9.5)
    p(pdf, "ALWAYS: separate AI/hosting | Phase honesty | no binding duty/HS promises | no secrets in decks", size=9.5)
    p(pdf, "WHEN STUCK: map pain to product letter -> book demo -> founder for custom NestOS or below-floor price", size=9.5)
    pdf.ln(3)
    box(
        pdf,
        "If she remembers only four sentences:\n"
        "1) We sell first-party products, not chat gimmicks.\n"
        "2) ConnectOS catches website leads; NestOS runs staffing ops; Pragma Flow is specialized AI/desk tools.\n"
        "3) Demo working software; quote packages; host and AI cost are transparent.\n"
        "4) Never invent metrics or liability claims; when unsure, ask founder before promising.",
    )
    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(
        0,
        5,
        S(
            "End of playbook. Rebuild PDF: python docs/generate-internal-sales-playbook.py  |  "
            "Questions and deal exceptions -> founder."
        ),
    )

    pdf.output(str(OUT))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
