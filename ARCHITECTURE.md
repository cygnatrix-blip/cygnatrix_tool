# Cygnatrix Tools — Architecture

> Production URL: **https://tools.cygnatrix.com/**
> Product: **Cygnatrix Tools** — _Fast, Free & Useful Online Tools_
> Status: **MVP (18 tools)** — built for organic Google traffic + AdSense, extensible to hundreds of tools.

This document is the single source of truth for the platform architecture. Keep it updated
whenever structural decisions change.

---

## 1. Goals & Constraints

| Priority | Requirement |
|---|---|
| **1. SEO** | Every indexable page is server/statically rendered with full HTML content, unique metadata, canonical URL, one H1, structured data, breadcrumbs, internal links. No client-only SPA. |
| **2. Production ready** | Real working tools, tested calculation layer, graceful errors, security hardening, deployable to the target host with documented ops. |
| 3. Performance | Minimal client JS. Interactive widgets are isolated islands. Custom lightweight SVG charts (no charting lib). Static generation everywhere possible. |
| 4. Extensibility | New tools = add one config entry + one widget. New categories = add one category config. URL strategy never changes. |
| 5. Privacy | File processing happens **in the browser** wherever practical. Nothing uploaded unless unavoidable. |

### Hosting target — Hostinger Business Web Hosting

- Node.js 18–24, MySQL, ~5 GB NVMe, **shared** CPU/RAM, **no Docker, no system binaries**
  (no Ghostscript / LibreOffice / ImageMagick), Passenger-style Node process.

**Consequences that shaped the architecture:**

1. **All heavy processing is client-side** (WASM/Canvas in the browser). This is simultaneously
   the best choice for privacy, for server cost on shared hosting, and for SEO (pages stay static
   and fast, server is never the bottleneck).
2. **PDF compression** = pure-JS: image downsampling + re-encode + object stream + metadata strip
   via `pdf-lib` + `pdf.js`. Honest UI about what "compression" means without Ghostscript.
3. **PDF → Word** = client-side text + basic layout extraction via `pdf.js`, emitted as a real
   `.docx` with the `docx` library. UI clearly states limitations (scanned PDFs, complex layouts,
   graphics, non-standard fonts).
4. **MySQL** is used **only** for analytics events + contact-form submissions. The app runs fully
   without a DB connection (features degrade silently, nothing breaks). Tool metadata lives in
   typed code config, not the DB — it must be available at build time for SSG/SEO.

---

## 2. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | RSC by default; client islands only where interactive. |
| Language | **TypeScript** (strict) | |
| UI | **React 19 + Tailwind CSS 3.4** | Design tokens in `tailwind.config.ts`. No component library. |
| Charts | **Custom SVG components** (`components/charts/*`) | `DonutChart`, `StackedBarChart`, `LineChart` — ~2 KB each, server-renderable, responsive, theme-aware. No Recharts/Chart.js. |
| Icons | `lucide-react` | Tree-shaken to ~20 used glyphs via `components/ui/ToolIcon`. |
| PDF | `pdf-lib` (write/merge/split), `pdfjs-dist` (render/extract) | Both run in the browser. |
| DOCX | `docx` **8.5.0** (pinned) | Client-side `.docx` generation. 9.x breaks Next's bundler parse. |
| Images | Native `Canvas` / `createImageBitmap` / `OffscreenCanvas`, `browser-image-compression` | 100% client-side. |
| Validation | **zod** | Shared schemas: client forms + API route handlers. |
| DB | **mysql2** (promise pool) | Lazy singleton, optional. |
| Logging | **pino** | Structured JSON; redacts file contents & PII. |
| Rate limiting | In-memory token bucket (`lib/security/rate-limit.ts`) | Per-IP, per-route. Swappable for Redis later. |
| Testing | **Vitest** + `@testing-library/react` | Full coverage of `lib/finance/*`; unit tests for pdf/image/seo/validation/config. |
| Analytics | First-party event API → MySQL, + optional GA4/AdSense script tags | No PII, IP truncated, consent-gated. |

---

## 3. URL Architecture (never changes)

```
/                          Platform landing page
/pdf/                      PDF category landing
/pdf/merge-pdf             ┐
/pdf/split-pdf             │
/pdf/compress-pdf          ├ 5 PDF tools
/pdf/pdf-to-word           │
/pdf/pdf-to-jpg            ┘
/finance/                  Finance category landing
/finance/emi-calculator    ┐
/finance/sip-calculator    │
/finance/fd-calculator     │
/finance/rd-calculator     ├ 8 finance calculators
/finance/gst-calculator    │
/finance/loan-calculator   │
/finance/cagr-calculator   │
/finance/salary-calculator ┘
/image/                    Image category landing
/image/compress-image      ┐
/image/resize-image        │
/image/jpg-to-png          ├ 5 image tools
/image/png-to-jpg          │
/image/webp-converter      ┘
/about /contact /privacy-policy /terms /cookie-policy /disclaimer
/tools                     Full A–Z tool index
/sitemap.xml /robots.txt /manifest.webmanifest
/api/analytics  /api/contact   (only server endpoints in MVP)
```

**Canonical rule:** no trailing slash on tool pages (Next default). `metadataBase` +
per-page `alternates.canonical` always set to the exact preferred path. Category landing
pages are the `/pdf`, `/finance`, `/image` segments. Future categories (`/developer/`,
`/qr/`, …) drop in with zero changes to routing, SEO, search, or analytics.

---

## 4. Folder Structure

```
app/
  layout.tsx                 Root layout: <html>, fonts, header, footer, JSON-LD (Organization + WebSite+SearchAction)
  page.tsx                   Landing page (static)
  globals.css
  sitemap.ts                 Dynamic from tool config
  robots.ts
  manifest.ts
  not-found.tsx
  error.tsx                  Global error boundary (user-safe copy)
  opengraph-image.tsx        Default OG image (edge-free, static)
  (legal)/about|contact|privacy-policy|terms|cookie-policy|disclaimer/page.tsx
  tools/page.tsx             A–Z index
  pdf/
    layout.tsx               Category shell (breadcrumb scope)
    page.tsx                 Category landing (CategoryPage template)
    merge-pdf/page.tsx       Server page: metadata + content + <MergePdfTool/> island
    split-pdf/page.tsx
    compress-pdf/page.tsx
    pdf-to-word/page.tsx
    pdf-to-jpg/page.tsx
  finance/
    layout.tsx
    page.tsx
    emi-calculator/page.tsx  … (8)
  image/
    layout.tsx
    page.tsx
    compress-image/page.tsx  … (5)
  api/
    analytics/route.ts
    contact/route.ts

components/
  layout/      Header, Footer, MobileNav, SearchBar, SearchDialog, Breadcrumb, Container
  cards/       CategoryCard, ToolCard, ToolGrid
  tool/        ToolLayout, ToolHeader, ToolDescription, HowItWorks, FeatureList,
               FAQSection, RelatedTools, SEOSection, PrivacyNote, ToolShell(client wrapper)
  file/        DragDropZone, FileUploader, FileList, FilePreview, ProcessButton,
               ProgressIndicator, DownloadButton, SizeComparison
  calculator/  CalculatorLayout, CalculatorForm, CalculatorInput, CalculatorSlider,
               CalculatorResult, ResultCard, BreakdownTable, AmortizationTable,
               FormulaSection, ExampleSection, CurrencyInput
  charts/      DonutChart, StackedBarChart, LineChart, Legend  (pure SVG)
  ads/         AdSlot  (configurable, consent-aware, never over controls)
  seo/         JsonLd, BreadcrumbJsonLd, FaqJsonLd, SoftwareAppJsonLd
  ui/          Button, Card, Field, Label, Select, Alert, Tabs, Badge, Spinner, Toast

lib/
  finance/     emi.ts sip.ts fd.ts rd.ts gst.ts loan.ts cagr.ts salary.ts  index.ts
  pdf/         merge.ts split.ts compress.ts to-images.ts to-docx.ts  load.ts (pdfjs setup)
  image/       compress.ts resize.ts convert.ts  canvas.ts (shared helpers)
  seo/         metadata.ts  jsonld.ts  site.ts (name, urls, socials)
  analytics/   client.ts (sendEvent) events.ts (typed event names) server.ts (persist)
  db/          pool.ts  migrations/  queries.ts
  security/    rate-limit.ts  file-validation.ts (magic-byte sniff) sanitize.ts
  validation/  schemas.ts (zod)  file.ts
  format/      currency.ts number.ts bytes.ts date.ts
  hooks/       useDebounce, useLocalStorage, useCopyToClipboard, useObjectUrl, useAnalyticsView

config/
  site.ts            Brand, nav, socials, feature flags, limits (FILE_LIMITS), ad config
  categories.ts      Category[] (id, slug, title, seo, intro, faqs, order)
  tools/             one file per tool exporting a ToolConfig; tools/index.ts aggregates + validates with zod
  tools.ts           getTool(slug), getToolsByCategory, getFeatured, getPopular, searchTools

types/               tool.ts category.ts finance.ts pdf.ts image.ts analytics.ts

tests/
  finance/*.test.ts  (one per calculator — normal, zero, decimal, tiny, huge, short, long,
                      invalid, empty, negative, boundary)
  pdf/*.test.ts  image/*.test.ts  config/*.test.ts  seo/*.test.ts  validation/*.test.ts
  components/*.test.tsx  (routing/metadata smoke)

public/            favicon set, logo.svg, og default, ads.txt
scripts/           db-migrate.mjs
```

---

## 5. Tool Configuration Architecture

Single typed registry drives **cards, search, related tools, category pages, metadata,
navigation, featured/popular sections, and the sitemap**. Nothing about a tool is duplicated.

```ts
// types/tool.ts
type ToolType = 'calculator' | 'file' | 'converter';

interface ToolConfig {
  id: string;                 // 'emi-calculator'
  name: string;               // 'EMI Calculator'
  slug: string;               // 'emi-calculator'
  category: 'pdf' | 'finance' | 'image';
  path: string;               // '/finance/emi-calculator'  (derived, validated)
  shortDescription: string;   // card copy (<=90 chars)
  description: string;        // page intro paragraph
  icon: string;               // lucide-ish name mapped in <ToolIcon/>
  toolType: ToolType;
  active: boolean;
  featured: boolean;
  popular: boolean;
  keywords: string[];         // search + meta keywords
  seoTitle: string;
  seoDescription: string;
  content: {                  // rendered server-side for SEO
    howItWorks: { title: string; body: string }[];
    features: string[];
    body?: MDXLikeBlock[];    // extra explanatory sections
    formula?: { expression: string; where: { sym: string; meaning: string }[] };
    example?: { inputs: Record<string,string>; result: string; walkthrough: string };
  };
  faq: { q: string; a: string }[];
  relatedTools: string[];     // tool ids; validated to exist & active
  sortOrder: number;
  updatedAt: string;          // ISO — feeds <lastmod> + "Updated on" line
}
```

`config/tools/index.ts` runs every config through a **zod schema at module load** — a bad
config fails the build, not production. Related-tool ids and category slugs are cross-checked.

---

## 6. Rendering Strategy

| Page part | Rendering |
|---|---|
| Landing, category pages, all tool page **content** (H1, intro, how-it-works, features, formula, example, FAQ, related, SEO section, breadcrumbs, JSON-LD) | **Static (SSG)** — `generateStaticParams` + `export const dynamic = 'force-static'` |
| Interactive widget (calculator inputs, file dropzone, charts, results) | **Client island** — one `<XxxTool/>` component, lazy-hydrated, `next/dynamic` with `ssr: false` only for browser-API-dependent file tools |
| `/api/analytics`, `/api/contact` | Node route handlers, `runtime = 'nodejs'` |
| Sitemap / robots / manifest | Static, generated from config |

The client bundle per tool page = shared framework + one widget. Charts are SVG components
that render on the server for the example/preview and re-render client-side on input change.
No page ships a charting library.

---

## 7. Finance Calculation Layer

Pure functions, zero UI/DOM/React imports, fully unit-tested. All money math uses numbers with
explicit rounding **only at display**; internal precision kept full. Each module exports an
`Input` type, `Result` type, a `calculate(input): Result`, and where relevant a `schedule()`.

| Module | Core formula |
|---|---|
| `emi.ts` | `EMI = P·r·(1+r)^n / ((1+r)^n − 1)`; `r=0` → `P/n`. Returns EMI, totalInterest, totalPayment, monthly amortization rows. |
| `loan.ts` | Thin wrapper over `emi` + amortization + solve-for-EMI-given-inputs. |
| `sip.ts` | `FV = P · [((1+i)^n − 1)/i] · (1+i)`, monthly i; `i=0` → `P·n`. Returns invested, gain, futureValue, yearly series. |
| `fd.ts` | `M = P·(1 + r/(100·f))^(f·t)`; f ∈ {1,2,4,12}. Simple-interest fallback option. |
| `rd.ts` | Sum of each monthly deposit compounded quarterly (Indian bank convention), configurable. |
| `gst.ts` | exclusive: `gst = amt·rate/100`. inclusive: `base = amt·100/(100+rate)`. CGST=SGST=gst/2; IGST option. |
| `cagr.ts` | `CAGR = (FV/PV)^(1/years) − 1`. Guards PV≤0, years≤0. |
| `salary.ts` | Config-driven (`config/india-payroll.ts`): PF 12% of basic (cap ₹15k basic optional), professional tax slab table, gratuity, employer contributions, new/old regime income-tax slabs FY-tagged. Returns gross, deductions breakdown, monthly & annual in-hand. All rates in one dated config object so a law change is a one-file edit. |

Disclaimer component is mandatory on every `/finance/*` page and the category page.

---

## 8. PDF / Image Processing Strategy

**Everything client-side.** No file ever leaves the browser for these tools.

| Tool | Approach |
|---|---|
| Merge PDF | `pdf-lib`: load each, `copyPages`, save. Drag-reorder, remove, validate (magic bytes `%PDF`), size/count limits from `FILE_LIMITS`. |
| Split PDF | `pdf-lib`: modes = every page / selected pages / ranges (`1-3,5,8-10`). Outputs zip (`fflate`) or individual downloads. |
| Compress PDF | `pdf.js` renders pages → downscaled JPEG → new `pdf-lib` doc; or "lossless" mode = object-stream + metadata strip only. Shows original/new/percent. Clear copy: "best-effort, in-browser". |
| PDF → Word | `pdf.js` text content per page → paragraph grouping by Y, font-size → `docx` `Paragraph`/`TextRun`. Emits `.docx`. Limitation banner. Scanned-PDF detection (no text layer) → explains OCR not supported. |
| PDF → JPG | `pdf.js` render each page to canvas at chosen DPI → `toBlob('image/jpeg', quality)`. Per-page or zip. |
| Image Compressor | `browser-image-compression` (Web Worker). Quality slider, target size, before/after, preview. jpg/jpeg/png/webp. |
| Image Resizer | Canvas draw. width/height/percent, lock aspect ratio, preview, format preserved. |
| JPG→PNG / PNG→JPG / WebP Converter | Shared `lib/image/convert.ts` — `createImageBitmap` → canvas → `toBlob(mime, q)`. PNG→JPG: configurable flatten background (default white) for transparency. Converter architecture takes `{from, to}` so new pairs are trivial. |

Shared file UI: `DragDropZone` → `FileList` → controls → `ProcessButton` → `ProgressIndicator`
→ result + `DownloadButton`. Object URLs revoked on unmount (`useObjectUrl`).

**Client-side validation is UX only.** The two API routes that do accept input (`contact`,
`analytics`) re-validate with zod server-side, rate-limit per IP, and sanitize.

---

## 9. SEO Architecture

- `lib/seo/metadata.ts` — `buildMetadata({ title, description, path, keywords, ogType, updatedAt })`
  → Next `Metadata` with title, description, `alternates.canonical`, OpenGraph, Twitter card,
  `keywords`, robots directives. `metadataBase = https://tools.cygnatrix.com`.
- Per-page `generateMetadata` on category + tool pages pulls straight from `ToolConfig` /
  `CategoryConfig` — impossible to have a page without unique metadata.
- **Structured data** (JSON-LD, server-rendered):
  - Root layout: `Organization` + `WebSite` with `SearchAction` (sitelinks search box).
  - Category pages: `BreadcrumbList` + `CollectionPage` + `ItemList` of tools.
  - Tool pages: `BreadcrumbList` + `SoftwareApplication` (offers: free) + `FAQPage` (from config faq).
  - Legal pages: `WebPage`.
- One `<h1>` per page, enforced by `ToolHeader` / `CategoryHeader` owning the only h1.
  Content sections use h2/h3.
- `app/sitemap.ts`: home + 3 categories + `active` tools + `/tools` + 6 legal pages.
  `lastmod` from `updatedAt`. Disabled/placeholder tools excluded. No thin programmatic pages.
- `app/robots.ts`: allow all except `/api/`, `/_next/`; points to sitemap.
- Internal linking: every tool page links to its category, its related tools, and the
  landing page links to categories + popular tools. Category pages link to every tool in
  the category + related categories. `/tools` links to everything.
- Content is genuinely useful and original (how-it-works, formula, worked example, real FAQs).
  No doorway pages. `updatedAt` surfaced as a visible "Last updated" line for freshness.
- `ads.txt` served from `public/`. `manifest.ts` for PWA-lite install metadata.

---

## 10. Database (MySQL)

Optional. `lib/db/pool.ts` returns `null` if env not configured; callers no-op.

```sql
-- migrations/001_init.sql
CREATE TABLE analytics_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event VARCHAR(40) NOT NULL,
  tool_slug VARCHAR(60) NULL,
  category VARCHAR(20) NULL,
  meta JSON NULL,
  country CHAR(2) NULL,
  device VARCHAR(10) NULL,
  referrer_host VARCHAR(120) NULL,
  ip_hash CHAR(64) NULL,           -- sha256(ip + daily salt), not reversible
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (event), INDEX (tool_slug), INDEX (created_at)
);
CREATE TABLE contact_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  subject VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  ip_hash CHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (created_at)
);
```

Future entities (`users`, `tools`, `tool_categories`, `faqs`, `subscriptions`, `api_keys`,
`settings`, `admin_users`) are documented here but **not created** in the MVP. Parameterized
queries only (`mysql2` placeholders). Migration runner: `node scripts/db-migrate.mjs`.

---

## 11. Security & File Handling

| Control | Implementation |
|---|---|
| Transport | HTTPS enforced at host + HSTS header (`next.config` headers). |
| File-type / MIME | `lib/security/file-validation.ts` magic-byte sniff (`%PDF`, `\xFF\xD8\xFF`, `\x89PNG`, `RIFF….WEBP`) — client-side gate before processing. |
| Size / count / pages / timeout | `config/site.ts` → `FILE_LIMITS` (per tool). Shown in UI before processing; enforced before work starts. |
| Server temp files | **None** — no server file processing in MVP. If added later: `os.tmpdir()` random subdir, unlinked in `finally`, cron sweep, signed one-time download tokens. |
| Rate limiting | `lib/security/rate-limit.ts` token bucket per IP on `/api/*`. 429 + `Retry-After`. |
| XSS | React escaping; no `dangerouslySetInnerHTML` except vetted JSON-LD (serialized via `JSON.stringify`, `<` escaped). |
| CSRF | API routes are same-origin JSON, `Origin`/`Sec-Fetch-Site` check; no cookie-auth in MVP. |
| SQL injection | Parameterized queries only. |
| Headers | CSP (script-src self + AdSense domains + GA), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`. |
| Input sanitize | zod `.trim()`/length caps; contact message HTML-stripped before store. |
| Errors | `error.tsx` + try/catch in widgets show friendly copy; details go to `pino` server-side only. |
| Admin | No admin UI in MVP. Extension point: `app/(admin)` route group + `admin_users` table + middleware auth documented. |

---

## 12. Monetization (AdSense)

`components/ads/AdSlot.tsx`:
- Props: `slot` (id), `format`, `layout`, `className`, `label` (always renders an "Advertisement" label).
- Reads `NEXT_PUBLIC_ADSENSE_CLIENT` + slot map from `config/site.ts` (`ADS`). If unset → renders nothing (dev) or a reserved-space placeholder (configurable) to avoid CLS.
- Consent-gated: no ad/analytics scripts before cookie consent (`components/CookieConsent`).
- Allowed positions only: below the fold on landing, mid-content on category pages, **below**
  calculator results, between SEO content sections. Never above/over tool controls, never
  styled as a button, never adjacent to real download buttons.
- Layout reserves height to protect CLS.

`next/script` loads `adsbygoogle` + GA4 `afterInteractive`, only post-consent.

---

## 13. Analytics

`lib/analytics/client.ts` `track(event, props)` → `navigator.sendBeacon('/api/analytics', …)`.
Events: `tool_view, tool_started, tool_completed, tool_failed, file_downloaded,
calculator_calculated, category_view, tool_search`. Server truncates IP → daily-salted hash,
derives country (host header / CF header if present), device from UA class. No PII, no
cross-site identifiers. Consent-gated. Degrades to no-op without DB.

---

## 14. Reusable Templates

- **CategoryPage** = `Breadcrumb → CategoryHeader → CategoryDescription → ToolGrid →
  HelpfulContent → AdSlot → FAQSection → RelatedCategories → (Footer)`. Category-specific
  copy injected from `config/categories.ts`.
- **ToolLayout** (calculator) = `Breadcrumb → ToolHeader(h1) → ToolDescription → [widget] →
  [results+chart] → AdSlot → HowItWorks → FormulaSection → ExampleSection → SEOSection →
  FAQSection → RelatedTools → Disclaimer(finance)`.
- **ToolLayout** (file) = `Breadcrumb → ToolHeader(h1) → ToolDescription → PrivacyNote →
  [dropzone/list/controls/process/progress/result/download] → AdSlot → HowItWorks →
  FeatureList → SEOSection → FAQSection → RelatedTools`.

A new tool page is ~15 lines: import config, render `<ToolLayout config={...}><Widget/></ToolLayout>`.

---

## 15. Testing

- `lib/finance/*` — exhaustive: normal, zero-interest, decimal rates, ₹1 amounts, ₹10cr
  amounts, 1-month & 40-year tenures, invalid/empty/negative inputs, boundary (rate 0, tenure 0).
- `lib/pdf/*`, `lib/image/*` — pure helpers (range parsing, size math, mime sniff, background
  flatten) unit-tested; browser-only paths covered by jsdom + fixture buffers where feasible.
- `config/tools` — every tool: valid schema, unique slug/id, path matches category, related
  tools exist & are active, referenced in exactly one category.
- `lib/seo` — `buildMetadata` produces canonical + OG + unique title per tool; sitemap has no
  dupes and excludes inactive tools.
- Component smoke — breadcrumb structure, one-h1-per-page assertion helper.
- `npm test` gates the build in CI.

---

## 16. Deployment (Hostinger Business — Node.js app)

1. `npm ci && npm run build` (Next standalone-compatible; `next start` on the assigned port).
2. Hostinger Node app: entry `node_modules/next/dist/bin/next start -p $PORT`, or `server.js`
   wrapper. App root = repo root. Node 20.
3. Env vars set in hPanel (see `.env.example`). `DATABASE_URL` optional.
4. MySQL DB created in hPanel; run `npm run db:migrate` once via SSH.
5. Domain `tools.cygnatrix.com` pointed at the Node app; SSL issued by Hostinger; HSTS on.
6. Static assets served by Next; long-cache immutable `_next/static`. gzip/brotli by host.
7. Environments: `production` (main), `staging` (subdomain or separate app, `NODE_ENV` +
   `NEXT_PUBLIC_SITE_URL` override), local `development` via `.env.local`.
8. Rollback = redeploy previous commit. DB migrations are additive & forward-only.

Ops notes, exact hPanel steps, and troubleshooting live in `README.md` and `docs/DEPLOY.md`.

---

## 17. Future Expansion (designed-in, not built)

- New category: add `config/categories.ts` entry + `app/<cat>/layout.tsx` + `page.tsx` +
  tool configs. Search, sitemap, analytics, related-tools, breadcrumbs all pick it up free.
- Premium: `subscriptions` + `users` tables, `lib/entitlements.ts` gate, `AdSlot` hides for
  premium, higher `FILE_LIMITS` tier. Auth via NextAuth drop-in at `app/(auth)`.
- API access: `app/api/v1/*` + `api_keys` table + rate-limit tiers (rate-limit lib already keyed).
- Admin: `app/(admin)` route group + middleware; CRUD over a future DB-backed tool registry
  that falls back to code config.

---

## 18. Change Log

| Date | Change |
|---|---|
| 2026-08-27 | Initial architecture. Locked to Hostinger shared hosting → all-client-side processing, pure-JS PDF, custom SVG charts, DB optional (analytics + contact only). |
| 2026-08-27 | Implementation complete (18 tools). Deltas from the plan: legal pages are flat routes (`app/about/…`) not a `(legal)` group; no per-category `layout.tsx` (breadcrumbs are per-page); charts are `DonutChart` / `StackedBarChart` / `LineChart`; `docx` pinned to **8.5.0** (9.x fails Next's webpack parse); `lucide-react` added for icons (tree-shaken); consent state in `lib/consent.ts`, scripts gated by `components/ConsentScripts.tsx`; Hostinger entry point is `server.js`. Build: 37 static pages, 2 dynamic API routes, shared First-Load JS ~103 kB. 121 unit tests green. |
| 2026-08-28 | Fixed a webpack dev-mode `Cannot read properties of undefined (reading 'call')` at `<RouteProgress/>`. Root cause: the `experimental.optimizePackageImports: ['lucide-react']` added earlier — it is redundant (lucide-react is on Next's built-in list) and is a known trigger for that chunk error under `next dev`. Removed it; bundle sizes unchanged. (A stale `.next` also produces this error class — `rm -rf .next` + restart is the general fix.) |
| 2026-08-28 | Responsiveness + loaders. **Overflow fix:** every responsive layout grid started as an implicit `auto` column, so wide children (the amortization table's `min-w-[520px]`, the bar chart's `min-w-[420px]`, non-shrinking flex cards) pushed the whole page wider than the viewport on mobile — `/finance/*`, `/pdf/*` all had horizontal scroll. Fixed by prefixing every layout grid with `grid-cols-1` (Tailwind's `repeat(1, minmax(0,1fr))` lets tracks shrink so the inner `overflow-x-auto` wrappers actually scroll). Verified 0 overflow at 320 / 390 / 768. **Loaders:** `components/ui/Loader.tsx` — swan mark inside a spinning ring (`inline` + `page` sizes); `app/loading.tsx` uses `PageLoader` as the route-level Suspense fallback; `components/layout/RouteProgress.tsx` — thin top progress bar for client navigations, delays ~90 ms so instant static-page nav never flashes, only `usePathname` so it never forces dynamic rendering. |
| 2026-08-28 | P1/P2 + UI/UX pass. **P1:** per-route Open Graph images — `lib/og.tsx` renders one branded 1200×630 card; co-located `opengraph-image.tsx` in all 18 tool folders + 3 category folders + root (21 routes, ~208 B each); `buildMetadata` no longer hard-codes an image so Next picks the co-located one. `/ads.txt` is now a route generated from `NEXT_PUBLIC_ADSENSE_CLIENT` (one place to configure AdSense). `docs/LAUNCH.md` added — exact env-var checklist. **P2:** search dialog got a focus trap + `aria-live` result count + focus restore to the trigger; `/tools` title shortened; `<title>` dedup handles brand-prefixed titles. **UI/UX:** cookie banner is now a compact bottom-left card (was a full-width wall over content); calculator input column is `lg:sticky` so inputs stay visible while results/charts/schedule scroll (kills the empty left column); donut-chart legend is compact and shows the rupee value, not just %; card shadows/borders strengthened, `.section-muted` + `.eyebrow` utilities for section rhythm; homepage hero gained a radial glow + popular-tool quick chips; category pages gained a muted header band; tool cards use `line-clamp-2`; related-tools grid is 2×2; FAQ rows have hover + circular toggle. |
| 2026-08-27 | Full SEO + performance audit. **SEO:** fixed doubled brand suffix in `<title>` (`buildMetadata` now emits `title.absolute` and appends `" | Cygnatrix Tools"` once, only when absent; brand stripped from the 21 config `seoTitle`s; zod cap 62 chars); tightened the API same-origin guard from `origin.endsWith(host)` to an exact host match. **Performance:** heavy libraries moved out of the page bundle into on-demand `import()` — `pdf-lib` (merge/split/compress), `docx` (pdf-to-word), `browser-image-compression` (image compressor). First Load JS: `/pdf/*` 288–295 kB → 114–116 kB, `/pdf/pdf-to-word` 205 → 114 kB, `/image/compress-image` 139 → 119 kB. Dropped the JetBrains Mono web font (formula text now uses the system mono stack). Fixed an object-URL leak in the image resizer preview. `lucide-react` added to `optimizePackageImports`. Every route now 103–122 kB First Load JS. |
| 2026-08-27 | Search dialog rebuilt. **Bug:** the dialog's `fixed inset-0` overlay was trapped by the sticky `<Header>`'s `backdrop-blur-md` (a `backdrop-filter` creates a containing block for `position: fixed` descendants), so the modal was clipped to ~header height. **Fix:** `SearchDialog` now renders through `createPortal(…, document.body)`. Also split the trigger buttons into `SearchTrigger` (dispatches a `cygnatrix:search` window event) so only ONE `SearchDialog` is mounted (in `Header`) — previously the header + hero each mounted one, stacking two modals on `/`. Redesigned: dark overlay, centred card, "Popular tools" default state, result count, category badges, keyboard-hint footer, `↑↓/↵/esc` support. `server.js` now forces `NODE_ENV=production` unless explicitly `development` (running it without the env var was silently starting a dev server and clobbering `.next`). |
| 2026-08-27 | Branding: support email is now `support@cygnatrix.com` (default in `config/site.ts`, `.env.example` `CONTACT_NOTIFY_EMAIL`; every page reads `SITE.contactEmail`). Company name → "Cygnatrix IT Solutions". New `BRAND` block in `config/site.ts` points the logo at `public/brand/logo-mark.svg` (a vector Cygnatrix swan mark) — used by `components/layout/Logo.tsx`, `app/icon.svg` (favicon/PWA), `app/opengraph-image.tsx` and the Organization JSON-LD `logo` + `contactPoint`. To use the exact company artwork: replace `public/brand/logo-mark.svg` (or drop a PNG and change the extension in `BRAND.mark`). |
| 2026-08-27 | Browser QA pass. **Fix 1:** CSP `script-src` was missing `'unsafe-eval'`, which `next dev` (webpack HMR + React Refresh) needs — hydration was fully dead in dev (calculators frozen, uploads inert). Now added in dev only; `'wasm-unsafe-eval'` added in all envs for pdf.js/image codecs; AdSense/ad-traffic-quality hosts widened. **Fix 2:** removed `public/icon.svg` (conflicted with `app/icon.svg` → `/icon.svg` 500 in dev). Added `tests/e2e/smoke.cjs` (`npm run test:e2e`, puppeteer-core, auto-detects Chrome/Edge, self-generates fixtures) — drives all 29 pages + 8 calculators + 10 file tools in a real browser. 47/47 green on both `next dev` and `next start`. |
