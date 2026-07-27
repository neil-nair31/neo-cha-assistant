# Production deployment — Neo Assist

This guide covers deploying the Neo Assist API and embedding the chat widget on **neologistics.org** (Django) or any front-end.

## Architecture

```
Browser (neologistics.org)
  └── Chat widget (static JS bundle)
        └── POST /api/assistant/chat  →  Neo Assist API (Node/Express)
              ├── Gemini (AI_PROVIDER=gemini)
              ├── SQLite (leads, consent, analytics)
              └── SMTP / Slack (lead notifications)
```

The widget never sees API keys. All AI calls are server-side.

## 1. Deploy the API

### Requirements

- Node.js 20+
- Persistent disk for SQLite (`DATABASE_PATH`)
- Outbound HTTPS to `generativelanguage.googleapis.com` (Gemini)

### Environment (production)

Copy `.env.example` to `.env` on the server and set:

| Variable | Production value |
|----------|------------------|
| `NODE_ENV` | `production` |
| `PORT` | `8787` (or behind reverse proxy) |
| `CORS_ORIGIN` | `https://www.neologistics.org` |
| `AI_PROVIDER` | `gemini` |
| `GEMINI_API_KEY` | From Google AI Studio (server secret) |
| `AI_MODEL` | `gemini-2.0-flash` |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Corporate SMTP for lead emails |
| `LEAD_NOTIFY_EMAIL` | `customercare@neologistics.org` |
| `PRIVACY_POLICY_URL` | Live privacy page URL (fallback: contact page) |
| `DATA_RETENTION_MONTHS` | `12` |

Without SMTP, leads are logged to stdout only — fine for staging, not production.

### Build & start

```powershell
cd neo-cha-assistant
npm ci
npm run build
npm run ingest
npm run sync-kb
npm run start -w server
```

Use **PM2**, **systemd**, or your container platform to keep the process running.

### Reverse proxy

Expose the API at e.g. `https://api.neologistics.org` or path `/api/assistant` on the main site:

```
location /api/assistant/ {
  proxy_pass http://127.0.0.1:8787/api/assistant/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

Health check: `GET /api/assistant/health` → should show `aiKeyConfigured: true`.

## 2. Embed widget on Django site

Neo IT should:

1. Build the widget: `npm run build -w widget` → produces `neo-assist.js` + `neo-assist.css`
2. Either serve from the Assist host (`/widget/...`) or copy those two files to Django static
3. Paste the snippet from `docs/INTEGRATION.md` into the base template
4. Set `data-api-base` to the API **origin** (e.g. `https://assist.neologistics.org` or `""` if same-origin proxied) — not `/api/assistant`

For cross-origin API, ensure `CORS_ORIGIN` includes the site origin.

## 3. Knowledge base maintenance

| Task | Command | Schedule |
|------|---------|----------|
| Re-sync website pages | `npm run sync-kb` | Weekly |
| Re-ingest after manual KB edits | `npm run ingest` | After edits |
| Data retention (DPDP) | `npm run retention` | Monthly cron |

Example cron (Linux):

```
0 3 * * 0  cd /opt/neo-cha-assistant && npm run sync-kb >> /var/log/neo-assist-sync.log 2>&1
0 4 1 * *  cd /opt/neo-cha-assistant && npm run retention >> /var/log/neo-assist-retention.log 2>&1
```

## 4. SMTP setup (lead notifications)

When a serious enquiry or huge shipment is captured, the server emails `LEAD_NOTIFY_EMAIL`.

Example (Office 365 / generic SMTP):

```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=assistant@neologistics.org
SMTP_PASS=<app-password>
SMTP_FROM="Neo Assist <assistant@neologistics.org>"
NOTIFY_CHANNELS=email
```

Test by sending a chat message with 20+ TEU and accepting consent.

Optional: add `SLACK_WEBHOOK_URL` to `NOTIFY_CHANNELS=email,slack`.

## 5. Pre-launch checklist

- [ ] `npm run smoke -w server` passes all 7 scenarios
- [ ] Gemini key set; health shows `aiKeyConfigured: true`
- [ ] SMTP sends test lead email
- [ ] Privacy policy URL loads (or contact page linked in consent)
- [ ] CORS locked to production domain
- [ ] Retention cron scheduled
- [ ] Widget visible on staging Django page
- [ ] Rate limits appropriate (`RATE_LIMIT_MAX=30` per 10 min per IP)

## 6. Smoke tests

With the server running locally:

```powershell
npm run dev -w server
# separate terminal:
npm run smoke
```

Scenarios cover: IPL refusal, duty % guardrail, unknown internal questions, services FAQ, huge enquiry, AEO, price refusal.

## 7. Monitoring

Watch server logs for:

- `[gemini] All models failed` — API key or quota issue
- `[chat] AI error` — provider failures (KB fallback still answers)
- Lead notification errors — SMTP misconfiguration

Consider uptime checks on `/api/assistant/health` every 5 minutes.

---

## 8. Feature 2 — Neo HS Finder (India CTH)

Separate process from Neo Assist. Do **not** mount inside the chat widget.

### Architecture

```
Browser (/hs-code-finder or :8790 UI)
  └── POST /api/hs/classify  →  Neo HS Finder (Express :8790)
        ├── India CTH-8 index (hs-lookup/data/hs-index.json)
        ├── Optional Gemini rerank (same GEMINI_API_KEY)
        └── POST /api/hs/cha-handoff → SMTP → LEAD_NOTIFY_EMAIL
```

### Environment

| Variable | Value |
|----------|--------|
| `HS_LOOKUP_PORT` | `8790` |
| `CORS_ORIGIN` | `https://www.neologistics.org` (and staging) |
| `GEMINI_API_KEY` | Same as Assist (optional; lexical works without) |
| `SMTP_*` / `LEAD_NOTIFY_EMAIL` | Same as Assist — CHA handoff emails |
| `INDIA_ITC_HS_URL` | Optional override for data refresh |

### Build & start

```powershell
cd neo-cha-assistant
npm ci
npm run build:hs-index
npm run start -w @neo-cha/hs-lookup
```

Keep alive with PM2/systemd (separate process from Assist).

### Reverse proxy

```
location /api/hs/ {
  proxy_pass http://127.0.0.1:8790/api/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

Vite/local site already proxies `/api/hs` → `:8790`. Live Django/React site needs the same mapping.

### Pre-launch checklist (HS Finder)

- [ ] `npm run smoke:hs` → 20/20
- [ ] `npm run audit:hs` → India CTH scores healthy
- [ ] Health `GET /api/hs/health` shows `market: India`, large `cth8` count
- [ ] CHA handoff works (SMTP or console log in staging)
- [ ] UI disclaimer visible: shortlist only — confirm before filing
- [ ] Page linked in nav (`/hs-code-finder` on Neo rebuild)

### Refresh India tariff data

```powershell
npm run refresh:hs
npm run smoke:hs
npm run audit:hs
```

Backs up prior `india-itc-hs.json`, downloads fresh source, rebuilds index. Spot-check cashew / shrimp / HRC lines against CBIC/DGFT after refreshes. Full notes: `hs-lookup/docs/DATA-REFRESH.md`.

---

## 9. Feature 3 — AI Customs Notifications Digest → Blog

Enterprise daily automation. Port **8791**. Version **3.0**.

```
Cron (daily)
  └── npm run scan:notifications
        ├── scrape CBIC ECCS + DGFT (5 channels, ≥2 must succeed)
        ├── Gemini cascade + structured fallback
        ├── quality score + draft status (default)
        └── write data/blog-posts.json

Ops review
  └── http://localhost:8791/ops  OR  npm run approve:notifications
        └── publishes → sync published-only to Vite blog-posts.json

Browser (/blogs)
  └── /api/notifications/blog-posts → Express :8791 (published only)
```

```powershell
npm run scan:notifications
npm run approve:notifications   # or open /ops
npm run dev:notifications
```

Proxy:

```
location /api/notifications/ {
  proxy_pass http://127.0.0.1:8791/api/;
}
```

Checklist:

- [ ] Smoke: `npm run smoke:notifications` (5 channels)
- [ ] Scan creates **drafts**; approve before public blog
- [ ] `/blogs` lists approved posts with industry filters
- [ ] Disclaimer visible
- [ ] `DIGEST_PUBLISH_MODE=draft`, `DIGEST_ADMIN_TOKEN` set in production
- [ ] Task Scheduler / cron for daily `scan:notifications` + review step
