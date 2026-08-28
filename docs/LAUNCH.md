# Launch checklist — Cygnatrix Tools

Everything is built and tested. To go live you only need to plug in account
values and deploy. Nothing in the code needs to change.

---

## 1. Set environment variables (Hostinger hPanel → Node app → Environment)

Copy from `.env.example`. The only **required** ones for a basic launch:

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://tools.cygnatrix.com` | No trailing slash. Drives canonicals, sitemap, OG. |
| `ANALYTICS_IP_SALT` | a random 32-char string | `openssl rand -hex 16`. Used to hash visitor IPs. |

**Recommended for monetisation + insight:**

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_ADSENSE_CLIENT` | AdSense dashboard → Account → Settings → "Publisher ID" (`ca-pub-…`). Also auto-populates `/ads.txt`. |
| `NEXT_PUBLIC_ADSENSE_SLOT_LANDING` / `_CATEGORY` / `_TOOL_RESULT` / `_CONTENT` | AdSense → Ads → By ad unit → create a Display unit for each, copy the numeric slot ID. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 → Admin → Data streams → Web → "Measurement ID" (`G-…`). |

**Optional (analytics events + contact-form storage):**

| Variable | Notes |
|---|---|
| `DATABASE_HOST` / `PORT` / `USER` / `PASSWORD` / `NAME` | Create a MySQL DB in hPanel → Databases. Leave blank to run without a DB — analytics + contact form silently no-op, the rest of the site is unaffected. |

> Ads and analytics scripts do **not** load until a visitor accepts cookies, and
> not at all if the IDs above are unset. So an un-configured deploy is safe and
> shows no ads / collects nothing.

---

## 2. Deploy on Hostinger (Business — Node.js app)

### a. Create the app in hPanel

hPanel → **Advanced → Node.js** → *Create application*:

| Field | Value |
|---|---|
| Node.js version | **20** (18–24 all work; 20 is the safe pick) |
| Application root | e.g. `domains/tools.cygnatrix.com/app` |
| Application URL | `tools.cygnatrix.com` |
| Application startup file | `server.js` |

Add the environment variables from step 1 in the same screen.

### b. Get the code onto the server

Either connect the Git repo in hPanel (*Node.js → your app → Git*), or upload
the project folder via SFTP / File Manager. **Do not upload `node_modules` or
`.next`** — they are built on the server.

### c. Build (over SSH — Business plan includes SSH)

```bash
cd ~/domains/tools.cygnatrix.com/app
npm ci --omit=optional      # skips `sharp`/`canvas` — neither is used at runtime
npm run build               # validates every tool config + all SEO metadata, then compiles
```

`--omit=optional` matters: `sharp` and `canvas` are optional native modules that
shared hosting can't compile. The app doesn't use them (no `next/image`; PDF/image
work is 100% client-side), so skipping them is correct and makes `npm ci` reliable.

### d. Start / restart

In hPanel → Node.js → your app → **Restart**. The app runs `node server.js`,
which forces `NODE_ENV=production` and listens on the `PORT` Hostinger injects.

### e. Redeploys

```bash
git pull && npm ci --omit=optional && npm run build
```
then **Restart** in hPanel.

---

## 3. If you added a database

```bash
npm run db:migrate     # once, over SSH — creates analytics_events + contact_messages
```

Migrations are additive and forward-only.

---

## 4. Post-deploy verification

```bash
curl -s https://tools.cygnatrix.com/robots.txt
curl -s https://tools.cygnatrix.com/sitemap.xml | head
curl -s https://tools.cygnatrix.com/ads.txt          # should show your pub-… line
curl -sI https://tools.cygnatrix.com/ | grep -i strict-transport-security
```

Then, in a browser:

- Open a calculator, change inputs → results + chart update live.
- Open Merge PDF, drop two PDFs → merged file downloads.
- Google Search Console → add `tools.cygnatrix.com`, submit `sitemap.xml`.
- Google Rich Results Test on a tool URL → `SoftwareApplication`, `FAQPage`,
  `BreadcrumbList` all valid.
- AdSense → "Sites" → add `tools.cygnatrix.com`, wait for approval, then the ad
  units appear automatically (they're consent-gated placeholders until then).

---

## 5. First-week SEO

- Submit the sitemap in Search Console and Bing Webmaster Tools.
- Share the three category pages + 2–3 flagship tools where relevant.
- Check Core Web Vitals in Search Console after ~a week of traffic (every page is
  static and < 122 kB JS, so this should be green).
