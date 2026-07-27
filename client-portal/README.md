# Neo Client Portal (Phase A)

Container tracking, clearance timeline, documents, charges, and dispatch for Neo Logistics clients (Cochin & Chennai).

## Run locally

```bash
# from neo-cha-assistant root
npm install
npm run dev:portal          # API :8792
npm run dev:portal-web      # UI  :5175/app/
```

Open **http://localhost:5175/app/**

## Demo login

| Company | Email | Password |
|---|---|---|
| Pearl Chem Impex | import@pearlchem.demo | neo-demo |
| Acme Agro Exports | ops@acmeagro.demo | neo-demo |

## Public track samples

- `MSCU7845123`
- `COSU2607088SHA`
- `NEO-IMP-2607-0088`
- `HLXU4456712`

## Features

- Public track by container / BL / Neo ref
- Client dashboard with alerts & progress
- Shipment detail: milestones, containers, docs, charges, dispatch
- Ask Neo desk (logged request)
- Seed data tied to Neo HS desk cargo (cashew, TiO₂, VAE, kraft, clinker, coco peat)

Phase A uses desk-updatable seed data. Live PCS / shipping-line feeds come later.
