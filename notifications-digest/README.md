# AI Customs Notifications Digest — Pragma Flow Feature 3 (v3 enterprise)

Daily automation that:

1. **Scans** CBIC ECCS (notifications + circulars) **and** DGFT (notifications, public notices, trade notices)
2. **Summarizes** in plain English (Gemini model cascade + structured fallback)
3. **Tags** Neo industries (cashew, steel, chemicals, automobiles, mining, textiles, agro, seafood, cement, …)
4. **Holds as drafts** until ops approve → then posts to Neo **Blog** (`/blogs`)

| Feature | Port |
|---|---|
| 1 Neo Assist | 8787 |
| 2 HS Finder | 8790 |
| **3 AI Digest → Blog** | **8791** |

## Daily ops

```powershell
cd C:\Users\neila\Projects\neo-cha-assistant
npm run scan:notifications
# Review drafts:
#   browser → http://localhost:8791/ops
#   or CLI:
npm run approve:notifications
npm run dev:notifications
```

Site: http://localhost:5174/blogs

### Reliability gates

- At least **2 scrape channels** must succeed (`DIGEST_MIN_OK_CHANNELS`)
- Junk titles (`Download (Type: PDF)`) are discarded
- Quality score filter (`DIGEST_MIN_QUALITY`)
- Public API returns **published only** — drafts never sync to the Vite site

### Cron

```
npm run scan:notifications
# human or automated approve
npm run approve:notifications
npm run send:digest   # optional email of published posts
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Version, draft/publish stats, AI status |
| GET | `/api/blog-posts` | **Published** posts (`?q=&industry=`) |
| GET | `/api/drafts` | Draft queue (admin token) |
| POST | `/api/blog-posts/:id/approve` | Publish one draft |
| POST | `/api/blog-posts/:id/reject` | Reject one draft |
| POST | `/api/blog-posts/approve-all-drafts` | Bulk approve `minQuality` |
| POST | `/api/scan` | Trigger scan |
| POST | `/api/subscribe` | Email digest |

Ops UI: http://localhost:8791/ops

## Env

| Variable | Default | Notes |
|---|---|---|
| `GEMINI_API_KEY` | — | AI summaries; structured fallback if quota/error |
| `DIGEST_PUBLISH_MODE` | `draft` | `draft` (enterprise) or `auto` |
| `DIGEST_MAX_NEW` | `5` | Max new items per scan |
| `DIGEST_MIN_OK_CHANNELS` | `2` | Fail scan if fewer healthy sources |
| `DIGEST_MIN_QUALITY` | `35` | Drop low-quality candidates |
| `DIGEST_APPROVE_MIN_QUALITY` | `45` | CLI/bulk approve threshold |
| `DIGEST_ADMIN_TOKEN` | — | Required for scan/approve/drafts in prod |
| `NOTIFICATIONS_DIGEST_PORT` | `8791` | |
| `NEO_BLOG_SYNC_PATH` | Vite `blog-posts.json` | Published-only sync |

## Disclaimer

Educational AI summaries only — not official CBIC/DGFT text, not duty advice. Clients must verify + Neo CHA confirms.
