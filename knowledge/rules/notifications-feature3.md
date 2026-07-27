---
id: notifications-feature3
section: rules
title: AI Customs Notifications Digest (Feature 3)
updated: 2026-07-17
---

# Feature 3 — AI Customs Notifications Digest (v3 enterprise)

Daily automation (port **8791**):

1. Scrape **5 channels**: CBIC ECCS notifications + circulars; DGFT notifications + public notices + trade notices  
2. Summarize (Gemini cascade → structured fallback)  
3. Tag Neo industries (cashew, steel, chemicals, …)  
4. Create **drafts** → ops approve → publish to Neo **Blog** (`/blogs`)

Reliability: ≥2 healthy scrape channels required per scan. Public API = published only.

Ops: `http://localhost:8791/ops` or `npm run approve:notifications`

Not part of the chatbot. Do not invent duty %. Point to official `sourceUrl` + Neo CHA.
