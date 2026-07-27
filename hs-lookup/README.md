# Neo HS Finder — India CTH / ITC-HS (Feature 2)

**Standalone product.** Not part of the Neo Assist chatbot.

India-first tariff shortlist tool for Neo Logistics CHA workflows (Cochin / Chennai):
indexes **~12,400+ India CTH / ITC-HS 8-digit** tariff lines, hybrid lexical + Gemini ranking
(constrained to real catalog codes), export-policy tags, and a hard path to licensed CHA confirmation.

## Why it is separate

| Neo Assist (Feature 1) | Neo HS Finder (Feature 2) |
|---|---|
| Website chat + leads | India CTH classification tool |
| Narrow Neo KB answers | Full India 8-digit tariff index |
| Port **8787** | Port **8790** |

## Run

```powershell
cd C:\Users\neila\Projects\neo-cha-assistant
npm install
npm run build-index -w @neo-cha/hs-lookup
npm run dev -w @neo-cha/hs-lookup
```

Open **http://localhost:8790**

Website (Vite Neo rebuild): proxy `/api/hs` → `:8790`, page `/hs-code-finder`.

```powershell
npm run smoke:hs
npm run audit:hs
npm run refresh:hs   # refresh India ITC-HS source + rebuild index
```

CHA handoff: `POST /api/cha-handoff` (SMTP via same env as Neo Assist, or console log in dev).

## What it returns

- **India CTH 8-digit** codes (e.g. `0801.32.20` cashew kernel, whole)
- Parent **HS-6** for reference
- Indicative **export policy** tag (Free / Restricted / Prohibited) from source — verify on DGFT
- Clarifying questions for Bill of Entry / Shipping Bill prep
- Explicit notes: **no live BCD / IGST quotes**

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Index size + India market flag |
| GET | `/api/search?q=` | Keyword / code search |
| POST | `/api/classify` | Ranked India CTH shortlist (`tradeFlow`: import\|export\|either) |
| GET | `/api/chapters` | Chapters |
| GET | `/api/chapter/:code` | Lines in a chapter |
| GET | `/api/code/:code` | Exact lookup |

## Data

- Source: `data/india-itc-hs.json` (India ITC-HS style lines + export policy tags)
- Built index: `data/hs-index.json` (`npm run build-index`)
- International UN Comtrade CSV remains in `data/` for reference only — **runtime index is India CTH-8**

## Env

| Variable | Default | Notes |
|---|---|---|
| `HS_LOOKUP_PORT` | `8790` | Standalone server port |
| `GEMINI_API_KEY` | — | Hybrid AI rerank (codes still must exist in index) |
| `AI_MODEL` | `gemini-2.0-flash` | Rerank model |
| `CORS_ORIGIN` | `*` | Browser origins |
