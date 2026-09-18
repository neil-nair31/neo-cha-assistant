# Neo Logistics site (`@neo-cha/site`)

Static / Vite React site for Neo — used to **test Assist, HS Finder, Digests, and Portal** against local APIs in this monorepo.

## Run (API testing)

From repo root (install once):

```bash
npm install
```

Start backends you need (separate terminals):

```bash
npm run start -w @neo-cha/server          # Assist :8787
npm run start -w @neo-cha/hs-lookup       # HS :8790
npm run start -w @neo-cha/notifications-digest   # Digests :8791
npm run start -w @neo-cha/client-portal   # Portal API :8792 (build web first if using /app)
```

Site:

```bash
npm run dev:site
```

Open **http://localhost:5174/**

Vite proxies:

| Browser path | Backend |
|--------------|---------|
| `/api/assistant/*` | `localhost:8787` |
| `/api/hs/*` | `localhost:8790/api/*` |
| `/api/notifications/*` | `localhost:8791/api/*` |
| `/api/portal/*` | `localhost:8792/api/*` |

Assist chat bubble uses same-origin `/api/assistant`. HS page uses `/api/hs`. Blogs/digests use `/api/notifications`. Portal marketing page links to Vite portal UI (`:5175/app/`) unless `VITE_PORTAL_URL` is set.
