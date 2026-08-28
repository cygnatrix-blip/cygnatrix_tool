# Cygnatrix Tools

**Fast, Free & Useful Online Tools** — free online PDF tools, finance calculators and image
tools designed to be fast, simple and easy to use.

Production: **https://tools.cygnatrix.com/**

---

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 3 · MySQL (optional) ·
Vitest. All PDF/image processing runs **in the browser** (pdf-lib, pdf.js, docx, Canvas). See
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design.

## The 18 MVP tools

| PDF | Finance | Image |
|---|---|---|
| Merge PDF | EMI Calculator | Image Compressor |
| Split PDF | SIP Calculator | Image Resizer |
| Compress PDF | FD Calculator | JPG to PNG |
| PDF to Word | RD Calculator | PNG to JPG |
| PDF to JPG | GST Calculator | WebP Converter |
| | Loan Calculator | |
| | CAGR Calculator | |
| | Salary Calculator | |

Adding a tool = one file in `config/tools/<category>.ts` + one widget component + one
`app/<category>/<slug>/page.tsx` (≈15 lines). Cards, search, related tools, breadcrumbs,
sitemap, structured data and analytics pick it up automatically.

## Local development

```bash
cp .env.example .env.local      # optional — the app runs with no env at all
npm install
npm run dev                     # http://localhost:3000
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (also validates every tool config + SEO) |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm test` | Vitest — full calculation-layer coverage + config/SEO/validation |
| `npm run db:migrate` | Apply `lib/db/migrations/*.sql` (needs `DATABASE_*` env) |

## Environment variables

See [`.env.example`](./.env.example). Every variable is optional:

- **No DB** → analytics + contact form become no-ops, everything else works.
- **No AdSense client** → no ad markup renders at all.
- **No GA id** → no analytics script loads.

## Deployment

Target: **Hostinger Business Web Hosting** (Node.js app, MySQL, shared). Full step-by-step in
[`docs/DEPLOY.md`](./docs/DEPLOY.md). Summary:

1. `npm ci && npm run build` on the server (Node 20).
2. Start command: `npm start` (or `node server.js`).
3. Set env vars in hPanel. Create the MySQL DB and run `npm run db:migrate` once over SSH.
4. Point `tools.cygnatrix.com` at the app; issue SSL in hPanel.

## Project layout

```
app/          Routes (RSC static pages + 2 API routes)
components/   Reusable UI — layout, cards, tool sections, calculator, file, charts, ads, seo
config/       site.ts, categories.ts, tools/*  (typed, zod-validated registry)
lib/          finance/ pdf/ image/ seo/ security/ validation/ analytics/ db/ hooks/ format/
tests/        Vitest — finance/*, config, seo, validation, pdf, image, security
```

## License

Proprietary — © Cygnatrix.
