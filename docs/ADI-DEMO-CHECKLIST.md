# Adi — local demo deploy checklist (Neo CHA)

Short ops sheet for running Assist + HS Finder + Digests against the Neo site rebuild.

## Ports

| Service | Port | Start (from `neo-cha-assistant`) |
|---------|------|----------------------------------|
| Neo Assist API | **8787** | `npm run dev` |
| Neo HS Finder | **8790** | `npm run dev:hs` |
| Digests / Blogs | **8791** | `npm run dev:notifications` |
| Neo site (Vite) | **5174** | in `connectosWebsite1/neologistics`: `npm run dev` |

Site proxies `/api/assistant`, `/api/hs`, `/api/notifications` to those ports.

## Before a Suraj / client demo

1. Copy root `.env.example` → `.env` (never commit). Set `AI_PROVIDER=openai` + OpenRouter key (or Gemini as documented).
2. Start all three APIs + the Neo site (table above).
3. Smoke in browser:
   - Assist launcher shows **Neo / Ask** — ask a quote → consent form asks name + email/phone.
   - HS Finder → tap a quick sample (cashew / clinker) → green **Neo desk precedent** badge.
   - Blogs loads posts; subscribe with an industry chip.
4. SMTP can stay off for demos — handoff/subscribe copy points to Cochin/Chennai email & phone (no “check console” language).

## Optional quality refresh (blogs)

```bash
npm run rescore-filler -w @neo-cha/notifications-digest
# or full AI rewrite:
npm run resummarize -w @neo-cha/notifications-digest
```

Filler-heavy posts score lower / move to draft after rescore; re-run when AI copy looks ChatGPT-y.

## Production later

See `docs/PRODUCTION-DEPLOY.md` for CORS, reverse proxy, widget embed on Django, and SMTP/lead notify.
