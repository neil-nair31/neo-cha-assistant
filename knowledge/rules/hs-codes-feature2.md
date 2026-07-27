---
id: hs-codes-feature2
section: rules
title: Neo HS Finder (Feature 2 — standalone India CTH)
updated: 2026-07-16
---

# Neo HS Finder — standalone Feature 2 (India)

Neo HS Finder is a **separate product** from Neo Assist chat.

- Runs on its own process/port (`HS_LOOKUP_PORT`, default 8790)
- Indexes **India CTH / ITC-HS 8-digit** tariff lines (not international HS-6 only)
- Returns educational shortlists + export-policy tags — **no live duty rates**
- Final Bill of Entry / Shipping Bill classification needs licensed CHA confirmation (ICEGATE / CBIC / DGFT)

Do **not** route chatbot answers through this tool. Point users to the HS Finder URL / `/hs-code-finder` page.
