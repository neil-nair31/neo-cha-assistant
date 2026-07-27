# Refreshing India ITC-HS data

Neo HS Finder’s runtime index is built from `data/india-itc-hs.json` → `data/hs-index.json`.

## When to refresh

- After major CBIC Customs Tariff / DGFT ITC(HS) schedule updates
- Quarterly (minimum recommended)
- When ops spots stale export-policy tags or missing national lines

## Command

```powershell
cd C:\Users\neila\Projects\neo-cha-assistant
npm run refresh:hs
```

This will:

1. Download the source JSON (`INDIA_ITC_HS_URL` or default community ITC-HS dump)
2. Backup the previous `india-itc-hs.json`
3. Write new source + `india-itc-hs.meta.json`
4. Rebuild `hs-index.json`

Then verify:

```powershell
npm run smoke:hs
npm run audit:hs
```

## Custom / internal feed

Point at a Neo-controlled file when available:

```powershell
$env:INDIA_ITC_HS_URL = "https://internal.example/india-itc-hs.json"
npm run refresh:hs
```

Expected shape: JSON array of objects with at least `hs_code`, `description`, and ideally `export_policy`.

## Manual rebuild only

If you edited `india-itc-hs.json` by hand:

```powershell
npm run build:hs-index
```

## Important

- Export-policy tags are **indicative** — verify Restricted/Prohibited on DGFT before advising clients
- This tool still does **not** quote live BCD/IGST
- After refresh, always smoke-test Neo core cargo (cashew, shrimp, HRC, cement)
