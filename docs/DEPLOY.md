# Deploying Cygnatrix Tools to Hostinger Business Web Hosting

This is the production deployment guide for **https://tools.cygnatrix.com/**.

Hostinger Business Web Hosting provides: Node.js 18–24, MySQL, ~5 GB NVMe, shared CPU/RAM,
**no Docker, no system binaries**. The app is built for exactly this — all heavy processing
runs in the visitor's browser, so the server only needs to serve HTML and two light API routes.

---

## 0. One-time: prepare the subdomain

1. hPanel → **Domains** → **Subdomains** → create `tools` under `cygnatrix.com`.
2. Note the document root it creates (e.g. `/home/uXXXX/domains/tools.cygnatrix.com/public_html`).
   You will point the Node app at the **repository root**, not `public_html`.

## 1. One-time: create the MySQL database (optional but recommended)

1. hPanel → **Databases** → **MySQL Databases**.
2. Create a database, a user, and grant the user all privileges on it.
3. Record: host (often `localhost`), database name, user, password.

## 2. Get the code onto the server

**Option A — Git (preferred):** hPanel → **Advanced** → **Git** → deploy the repository into a
directory such as `~/apps/cygnatrix-tools`.

**Option B — Upload:** zip the repo (excluding `node_modules` and `.next`), upload via File
Manager, extract into `~/apps/cygnatrix-tools`.

## 3. Configure the Node.js application

hPanel → **Advanced** → **Node.js** → **Create application**:

| Field | Value |
|---|---|
| Node version | 20.x |
| Application root | `apps/cygnatrix-tools` (where you put the code) |
| Application URL | `tools.cygnatrix.com` |
| Application startup file | `server.js` |

Create it. Hostinger provisions a virtualenv-style Node environment and an `NODE_ENV`.

## 4. Environment variables

In the Node.js app screen, add variables (from `.env.example`). Minimum for a clean launch:

```
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://tools.cygnatrix.com
NEXT_PUBLIC_SITE_NAME=Cygnatrix Tools
ANALYTICS_IP_SALT=<openssl rand -hex 16>
```

Add when ready:

```
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=<db user>
DATABASE_PASSWORD=<db password>
DATABASE_NAME=<db name>
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_LANDING=...
NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY=...
NEXT_PUBLIC_ADSENSE_SLOT_TOOL_RESULT=...
NEXT_PUBLIC_ADSENSE_SLOT_CONTENT=...
```

> `NEXT_PUBLIC_*` values are baked in at **build time** — rebuild (step 6) after changing them.

## 5. Install dependencies

Open the app's terminal (hPanel gives you an SSH command, or use **Advanced → SSH Access**):

```bash
cd ~/apps/cygnatrix-tools
npm ci --omit=dev=false        # dev deps are needed for `next build`
```

If `npm ci` runs out of memory on the shared plan, use `npm install --no-audit --no-fund`.

## 6. Build

```bash
npm run build
```

This also **validates every tool config and all SEO metadata** — a bad config fails here, not
in production. Expect ~37 static pages to be generated.

## 7. Database migration (if using MySQL)

```bash
npm run db:migrate
```

Creates `analytics_events` and `contact_messages`. Migrations are additive and forward-only.

## 8. Start / restart

Back in hPanel → Node.js app → **Restart**. The startup file `server.js` boots
`next start` internally on the port Hostinger assigns.

Verify:

- `https://tools.cygnatrix.com/` loads
- `https://tools.cygnatrix.com/finance/emi-calculator` works and shows SSR content in *View Source*
- `https://tools.cygnatrix.com/sitemap.xml` and `/robots.txt` respond
- `https://tools.cygnatrix.com/pdf/merge-pdf` — merge two PDFs, confirm download

## 9. SSL & HTTPS

hPanel → **Security** → **SSL** → install a free certificate for `tools.cygnatrix.com`.
Enable **Force HTTPS**. The app already sends HSTS in production.

## 10. AdSense

1. Add the site in your AdSense account; put the real publisher ID in `public/ads.txt`
   and `NEXT_PUBLIC_ADSENSE_CLIENT`, then rebuild.
2. While waiting for approval, set `NEXT_PUBLIC_ADS_PLACEHOLDER=true` to reserve ad space
   without live ads (protects layout/CLS).
3. Ads only load after a visitor accepts advertising cookies.

---

## Redeploying (routine)

```bash
cd ~/apps/cygnatrix-tools
git pull                       # or re-upload
npm ci
npm run build
npm run db:migrate             # no-op if nothing new
# hPanel → Node.js app → Restart
```

Rollback = check out the previous commit and repeat.

## Staging

Create a second subdomain (e.g. `tools-staging.cygnatrix.com`) and a second Node.js app
pointing at a `staging` checkout, with its own `NEXT_PUBLIC_SITE_URL` and a separate database.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `next: command not found` | `npm ci` did not install dev deps — run `npm install`. |
| Build killed / OOM | Free memory: stop other apps, retry; or build locally and upload `.next/` + `node_modules` (production only) alongside the source. |
| Fonts fail to fetch during build | The build needs outbound HTTPS to `fonts.googleapis.com`. Hostinger build shells allow this; retry. |
| PDF worker 404 in browser | Ensure the full `.next/` output was deployed; the pdf.js worker is emitted as a static asset. |
| 500 on `/api/contact` | Check `DATABASE_*` vars; without a DB the endpoint still returns `ok` and logs the message. |
| Ads not showing | Not approved yet, cookies not accepted, or `NEXT_PUBLIC_ADSENSE_*` unset at build time. |
