## Knowledge base index

| Folder | Purpose | Who edits |
|---|---|---|
| `services/` | Neo service catalog | Neo ops / marketing |
| `ports/` | Offices & geography | Neo ops |
| `brochures/` | About, certs, industries, clients, contact | Neo marketing |
| `faqs/` | Approved Q&A | Neo ops + compliance |
| `sops/` | Public-safe process explainers only | Compliance |
| `rules/` | Citable India + worldwide customs education | Compliance / CHA leads |

Do **not** put pricing, internal SOPs, or customer PII in these files.

After editing Markdown, run:

```bash
npm run ingest -w server
```
