# Client demo hosting — Neo tools + portal always on (PC off OK)

Neo staff need **public HTTPS links** that work without your laptop.
Cloudflare quick tunnels (`trycloudflare.com`) **die when your PC sleeps**.
Use a **cloud VPS** (this guide) or a platform with always-on containers.

---

## What you will give Neo (after deploy)

Replace `https://YOUR-DEMO-HOST` with your real URL (IP or domain).

| Tool | Link |
|------|------|
| Home (all tools) | `https://YOUR-DEMO-HOST/` |
| **Neo Assist** | Bubble bottom-right on any page |
| **HS Finder** | `https://YOUR-DEMO-HOST/hs-code-finder` |
| **Blogs / digests** | `https://YOUR-DEMO-HOST/blogs` |
| **Client portal** | `https://YOUR-DEMO-HOST/app/` |
| Portal from site page | `https://YOUR-DEMO-HOST/client-portal` |

### Demo logins (portal)

| Role | Email | Password |
|------|-------|----------|
| Client | `import@pearlchem.demo` | `neo-demo` |
| Client | `ops@acmeagro.demo` | `neo-demo` |
| Staff Cochin | `desk.cochin@neologistics.demo` | `neo-ops` |

Track samples: `MSCU7845123`, `NEO-IMP-2607-0088`

---

## Architecture (one public origin)

```
Browser  →  nginx gateway :80
              ├── /                    → Neo React site (static)
              ├── /api/assistant/*     → Assist API
              ├── /api/hs/*            → HS Finder API
              ├── /api/notifications/* → Digests API
              ├── /api/*               → Portal API
              └── /app/*               → Portal UI
```

All four APIs run as Docker services. Your **OpenRouter / AI keys** stay in `.env` on the server.

---

## Prerequisites

1. A cloud VPS with public IP (DigitalOcean / Hetzner / Lightsail / any Ubuntu 22+), **1+ GB RAM** recommended (2 GB safer for HS index + AI).
2. Docker + Docker Compose on that VPS.
3. Your monorepo + Neo site code on the VPS (git clone or `scp`).
4. Root `.env` with working `OPENAI_API_KEY` (or Gemini) — **never commit**.

Optional: a subdomain like `demo.yourdomain.com` → A record to VPS IP (can use Cloudflare).

---

## One-time server setup (Ubuntu example)

```bash
# install docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# log out/in

# clone
git clone https://github.com/YOUR_USER/neo-cha-assistant.git
cd neo-cha-assistant
# also need neo site for the polished UI — copy or clone connectosWebsite1/neologistics
```

Copy `.env` to the server (from your machine via scp, not git).

```bash
# on your PC (PowerShell)
scp .env user@YOUR_VPS_IP:~/neo-cha-assistant/.env
```

On the VPS, set:

```bash
# in .env on server
NODE_ENV=production
CORS_ORIGIN=https://YOUR-DEMO-HOST,http://YOUR_VPS_IP
# keep OPENAI_API_KEY / provider settings
```

And:

```bash
# optional: public origin for compose
export PUBLIC_ORIGIN=https://YOUR-DEMO-HOST
export HTTP_PORT=80
```

---

## Build site + start stack

From **neo-cha-assistant** root:

```bash
# Build Neo site into deploy/site-dist
# If site path differs:
export NEO_SITE_PATH=/path/to/neologistics
bash deploy/build-site.sh
# Windows:  powershell -File deploy/build-site.ps1

cd deploy
docker compose up -d --build
```

Check:

```bash
docker compose ps
curl -s http://127.0.0.1/api/assistant/health
curl -s http://127.0.0.1/api/hs/health
curl -s http://127.0.0.1/api/notifications/health
curl -s http://127.0.0.1/api/health   # portal
```

Open `http://YOUR_VPS_IP/` in a browser.

---

## HTTPS (recommended before sending to clients)

On the VPS with domain pointed at the IP:

```bash
# Caddy example (install Caddy, reverse proxy 443 → localhost:80)
# or Cloudflare Full SSL with origin cert, or certbot+nginx on host
```

Simplest for many teams: put the VPS behind **Cloudflare** with the domain, SSL Flexible/Full, and keep Docker on port 80.

---

## Message you can send Adi / Neo

```
Hi team — permanent demo (stays up; not on my laptop):

Home:     https://YOUR-DEMO-HOST/
HS tool:  https://YOUR-DEMO-HOST/hs-code-finder
Blogs:    https://YOUR-DEMO-HOST/blogs
Portal:   https://YOUR-DEMO-HOST/app/

Portal clients: import@pearlchem.demo / neo-demo
Portal staff:   desk.cochin@neologistics.demo / neo-ops

Assist chat is the Neo / Ask button bottom-right.
This is a staging demo, not yet wired into live neologistics.org (that needs your IT proxy/embed).
Please try with office people and note anything wrong or missing.
```

---

## What NOT to do

| Approach | Why it fails for client testing |
|----------|----------------------------------|
| PC on + `cloudflared tunnel` | Dies when laptop sleeps/off |
| Only share `localhost` links | Only works on your machine |
| Free Render spin-down tiers | First load sleeps, feels “broken” |
| Put OpenRouter key in frontend | Never; browser-visible secrets |

---

## Cost (order of magnitude)

| Option | Monthly-ish |
|--------|-------------|
| Small VPS (1–2 GB) | ~$6–12 |
| AI usage while they test | OpenRouter actuals (usually low for a few people) |
| Domain (optional) | ~$1/mo via CF |

---

## After they approve demo

1. Adi puts Assist/HS/digest paths on **neologistics.org** (reverse proxy + widget embed) — see `docs/INTEGRATION.md` + `PRODUCTION-DEPLOY.md`.
2. Move secrets into their hosting / their OpenRouter billing if preferred.
3. Turn off old demo host or keep as staging.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Site loads, chat offline | `docker compose logs assist` — check API key + PORT |
| HS page errors | `docker compose logs hs` — index must be inside image |
| Blogs empty | digest API / data volume; check logs |
| Portal blank | rebuild portal image (`build:web` step) |
| CORS errors | set `CORS_ORIGIN` to the exact public origin |

---

## Alternative (no Docker expertise): single always-on box with PM2

If you prefer not Docker: rent VPS, install Node 20, `git clone`, `npm ci`, run four `pm2` processes + `nginx` same paths as `deploy/nginx.conf`. Same idea — **processes on a cloud machine**, not on your PC.

---

**Bottom line:** Clone + `.env` + build site + `docker compose up` on a **$6–12 VPS** → send Neo four links under one domain that stay up when your PC is off.
