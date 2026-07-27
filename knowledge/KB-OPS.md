# Keeping the knowledge base sharp (without "training on the internet")

## What we do NOT do (on purpose)

- Scrape the whole internet — would add wrong duties, fake Neo prices, outdated laws
- Auto-learn from every chat without human review — compliance risk under DPDP
- Replace Gemini/Claude — the **KB + AI** work together: KB = facts, AI = conversation

A trustworthy CHA bot is **narrow and accurate**, not "knows everything on Google."

## What we DO (three layers)

### Layer 1 — Curated markdown (best quality)
Neo ops / Pragma edit files in `knowledge/`:
- `services/` `ports/` `brochures/` `faqs/` `sops/` `rules/`

After edits:
```bash
npm run ingest
```

### Layer 2 — Approved website sync (auto-refresh Neo's own site)
`knowledge/sync/manifest.json` lists **only approved URLs** (neologistics.org pages).

```bash
npm run sync-kb
```
This downloads those pages → `knowledge/synced/` → re-ingests chunks.

**Schedule weekly** (Windows Task Scheduler / cron / GitHub Action):
```bash
cd neo-cha-assistant && npm run sync-kb
```

### Layer 3 — AI (Gemini recommended for release)
When API credits exist, Claude/Gemini reads retrieved KB chunks and answers naturally.
When API fails → KB fallback still answers from Layer 1+2.

## Adding new content (Neo team, no coding)

1. Copy an existing FAQ in `knowledge/faqs/`
2. Use the header format:
```markdown
---
id: unique-id
section: faqs
title: Your question topic
updated: 2026-07-09
---
```
3. Run `npm run ingest`
4. Test in chat

## Future modules (separate Pragma features)
- **Neo HS Finder (Feature 2)** — standalone package `hs-lookup/` · port 8790 · India CTH · **not** wired into the chatbot
- **Customs Notifications Digest (Feature 3)** — `notifications-digest/` · port 8791 · daily CBIC/DGFT scan → AI summary → Neo industry tags → auto-post to `/blogs`

## Quality bar
If it's not on Neo's site, in an approved PDF, or signed off by Neo compliance — **don't add it.**
