# Neo CHA Assistant (`neo-cha-assistant`)

**Neo Assist** — a production-grade AI Customs House Agent / shipment assistant built for [Neo Logistics](https://www.neologistics.org/) (Kochi & Chennai).

Standalone Pragma Flow Feature 1 package. Slot into Neo’s live Django site later (or the React rebuild) — this repo runs fully on its own today.

---

## What you get

| Layer | Capability |
|---|---|
| **Chat UI** | Floating Neo-branded widget (keyboard accessible, mobile responsive) |
| **Backend** | Express API — chat, consent, deletion requests, health |
| **AI** | Google Gemini (default) via swappable providers (`gemini` \| `openai` \| `anthropic`) |
| **RAG** | Hybrid retrieval over editable Markdown knowledge base (Neo services + customs rules). Optional Voyage embeddings |
| **Guardrails** | No prices, exact duties, binding legal advice, or promised timelines — prompt + output checks |
| **Leads** | Serious / huge enquiry detection → SQLite `leads` + email notify (Slack / Sheets hooks ready) |
| **DPDP** | Explicit consent before storing PII, retention job, deletion requests |
| **i18n-ready** | English launch; language via config/prompt, not hardcoded rewrites |

---

## Platform analysis (why this stack)

We compared the usual options for a **grounded CHA chatbot** that must be accurate, native, and lead-aware:

| Option | Verdict for Neo |
|---|---|
| **Intercom / Zendesk / Drift AI** | Fast embed, weak customs grounding, hard DPDP + Indian CHA nuance, monthly SaaS, not “native Neo brain” |
| **Custom GPT / ChatGPT Actions** | Easy demo; API key risks; poor Neo-KB control; not integratable as first-party |
| **Botpress / Voiceflow** | OK UX builders; still need custom RAG + compliance; extra vendor lock-in |
| **LangChain / LlamaIndex heavy stack** | Powerful but overkill ops for v1; harder for Neo IT to own |
| **Fine-tune only (no RAG)** | Stale law risk; Neo content changes often — rejected as sole approach |
| **Pinecone / Weaviate dedicated vector DB** | Excellent at huge scale; unnecessary ops for current KB size (~dozens of docs) |
| **Chosen: Gemini Flash + local hybrid RAG (+ optional Voyage) + SQLite + first-party widget** | Best ₹/quality for grounded CHA answers, server-side keys only, editable Markdown KB, native branding, DPDP control. Claude/OpenAI available via `AI_PROVIDER` if Neo prefers. |

**Embeddings path:** local lexical hybrid by default (works offline / zero extra keys). Set `VOYAGE_API_KEY` later for Voyage `voyage-3` + rerank without rewriting the app.

**Model:** `gemini-2.0-flash` (or Flash-Lite for cheaper volume) via `AI_MODEL`. Provider interface allows swap to Claude / OpenAI later.

**KB sources used to train Neo Assist (curated, citable):**
- Full public content from https://www.neologistics.org/ (About, Services, Industries, Expertise, Contact, KYC, testimonials, certifications)
- India public frameworks: ICEGATE, CBIC AEO (incl. AEO-LO), HS/tariff concepts, valuation, IGST-on-import framing, MTO, documentation checklists
- Worldwide educational corpus: WCO/HS/SAFE, Incoterms concepts, BL basics, IMDG/IATA DG framing, high-level US/EU/Asia trade concepts

> Worldwide coverage is **educational and general**. Binding foreign counsel, duty %, and quotes always escalate to Neo humans.

---

## Quick start

### Requirements
- Node.js **20+**
- Gemini API key (recommended; KB-only fallback works without it)

```bash
cd neo-cha-assistant
cp .env.example .env
# put GEMINI_API_KEY in .env (AI_PROVIDER=gemini)

npm install
npm run ingest -w server
npm run build -w widget
npm run dev -w server
```

Open **http://localhost:8787** — demo page + floating chat.  
Production embed assets: `/widget/neo-assist.js` + `/widget/neo-assist.css` (see `docs/INTEGRATION.md`).

Widget-only Vite hot reload:

```bash
# terminal 1
npm run dev -w server
# terminal 2
npm run dev -w widget   # http://localhost:5173 (proxies /api)
```

---

## How to edit the knowledge base

Files live in `knowledge/` (Markdown + YAML front matter). Non-developers can edit these safely.

```
knowledge/
  services/          Service catalog
  ports/             Cochin, Chennai, multimodal geography
  brochures/         About, certs, industries, clients
  faqs/              Approved Q&A
  sops/              Public process explanations only
  rules/             Citable India + worldwide customs corpus
```

After edits:

```bash
npm run ingest -w server
```

Restart not always required in `tsx watch` mode (ingest on boot); run ingest explicitly in production after deploys.

---

## Lead routing

Default channel: **email** to `LEAD_NOTIFY_EMAIL` (defaults to `customercare@neologistics.org`).

```env
NOTIFY_CHANNELS=email
# later:
# NOTIFY_CHANNELS=email,slack,sheets
# SLACK_WEBHOOK_URL=https://hooks.slack.com/...
# GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/...
```

**Huge enquiry** alerts when volume looks like **≥ 20 TEU** (configurable `HUGE_ENQUIRY_TEU`) or project/break-bulk language — subject line prefixes `🚨 HUGE ENQUIRY`.

Without SMTP configured, emails print to the server console (safe for local demos).

---

## DPDP (India) — consent & retention

1. Before storing **name / email / phone**, the UI shows a plain-language consent notice + privacy link.
2. `POST /api/assistant/consent` records version + timestamp + IP.
3. Personal fields are **not** persisted without consent (cargo fields without PII may still notify for huge enquiries).
4. Retention: `npm run retention -w server` anonymizes leads older than `DATA_RETENTION_MONTHS` (default 12). Schedule daily via cron.
5. Deletion: `POST /api/assistant/deletion-request` with email/phone/conversationId.

Update `PRIVACY_POLICY_URL` when Neo publishes a formal policy page.

---

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/assistant/health` | Health + KB size |
| GET | `/api/assistant/config` | Public widget config (no secrets) |
| POST | `/api/assistant/chat` | Chat turn (rate limited) |
| POST | `/api/assistant/consent` | Record DPDP consent |
| POST | `/api/assistant/deletion-request` | Request erasure |

AI keys **never** leave the server.

---

## Slotting into Neo’s website later

### React rebuild (`neologistics/` SPA)
1. Copy `widget/src/ChatWidget.tsx` + CSS into the Neo app.
2. Mount `<ChatWidget />` inside `Layout.tsx`.
3. Point `VITE_API_BASE` at this API origin (or same-origin reverse proxy `/api/assistant`).

### Production Django site
1. Serve this Node API behind Neo’s domain (subdir `/api/assistant` or internal host).
2. Add widget JS/CSS into the Django base template **or** load the built `widget/dist` assets.
3. Move secrets to Django/host env; optionally port models into Django ORM later — module boundaries are clean.

Ask Neo IT for: source access, deploy rights, lead inbox, privacy URL, Gemini billing (or Anthropic/OpenAI if preferred) — see email template in project chat history.

---

## Adding a language later

1. Add code to `ALLOWED_LANGUAGES` (e.g. `en,hi,ml`).
2. Add strings in `server/src/assistant/prompts.ts` → `strings`.
3. Optionally add `knowledge/**` locale folders later.
4. Pass `language` from the widget.

No rewrite of RAG / leads / consent required.

---

## Environment reference

See `.env.example` for full list. Critical:

- `GEMINI_API_KEY` — Google AI Studio key (default provider)
- `AI_PROVIDER` — `gemini` (default) \| `openai` \| `anthropic`
- `AI_MODEL` — default `gemini-2.0-flash` (use `gemini-2.0-flash-lite` for cheapest volume)
- `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` — only if you switch provider
- `LEAD_NOTIFY_EMAIL` — sales inbox
- `DATA_RETENTION_MONTHS` — default `12`
- `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` — abuse protection
- `VOYAGE_API_KEY` — optional better embeddings
- Storage is **SQLite** (`DATABASE_PATH`). Postgres is not implemented yet — do not promise it to IT.

---

## Analytics hooks (no PII)

Widget dispatches `neo-assist-analytics` CustomEvents: `widget_opened`, `question_asked`, `consent_granted`.  
Server stores anonymized `analytics_events` rows.

---

## Scripts

```bash
npm run ingest -w server      # reload KB into SQLite
npm run retention -w server   # DPDP retention cleanup
npm run build                 # widget + server
npm start -w server           # production server
```

---

## Honest limits (by design)

Neo Assist is extremely strong at **Neo services + general CHA / customs education**. It will **refuse** to invent duties, prices, and ETAs — that is what makes a CHA bot trustworthy. Live container tracking and HS lookup are planned as separate Pragma Flow features and should stay modular.

---

Built for Neo Logistics by Pragma.
