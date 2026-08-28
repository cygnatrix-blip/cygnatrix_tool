/**
 * Browser smoke test — real hydration, real file uploads.
 *
 *   1. npm run build && npm start      (in one terminal)
 *   2. node tests/e2e/smoke.cjs        (in another)
 *
 * Or point at a running dev server:  BASE=http://localhost:3000 node tests/e2e/smoke.cjs
 *
 * Needs a Chromium-based browser. Set BROWSER_PATH to override auto-detection.
 * Skips (exit 0) if puppeteer-core or a browser is unavailable.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch {
  console.log('SKIP: puppeteer-core not installed (npm i -D puppeteer-core).');
  process.exit(0);
}

function findBrowser() {
  if (process.env.BROWSER_PATH) return process.env.BROWSER_PATH;
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

const BASE = process.env.BASE || 'http://localhost:3000';
const FIX = path.join(__dirname, 'fixtures');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function ensureFixtures() {
  fs.mkdirSync(FIX, { recursive: true });
  const pdf = path.join(FIX, 'sample.pdf');
  const pdf2 = path.join(FIX, 'sample2.pdf');
  const jpg = path.join(FIX, 'sample.jpg');
  const png = path.join(FIX, 'sample.png');

  if (!fs.existsSync(pdf) || !fs.existsSync(pdf2)) {
    const { PDFDocument, StandardFonts } = require('pdf-lib');
    return (async () => {
      const d = await PDFDocument.create();
      const f = await d.embedFont(StandardFonts.Helvetica);
      for (let i = 1; i <= 3; i++) {
        const pg = d.addPage([400, 500]);
        pg.drawText(`Cygnatrix smoke-test page ${i}. The quick brown fox jumps over the lazy dog.`, { x: 30, y: 420, size: 11, font: f });
      }
      fs.writeFileSync(pdf, await d.save());
      const d2 = await PDFDocument.create();
      d2.addPage([300, 300]);
      fs.writeFileSync(pdf2, await d2.save());
      writeImages();
    })();
  }
  writeImages();
  return Promise.resolve();

  function writeImages() {
    if (fs.existsSync(jpg) && fs.existsSync(png)) return;
    let sharp;
    try {
      sharp = require('sharp');
    } catch {
      // Minimal 1x1 files as a last resort.
      fs.writeFileSync(jpg, Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==', 'base64'));
      fs.writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
      return;
    }
    return Promise.all([
      sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 200, g: 120, b: 40 } } }).jpeg({ quality: 92 }).toFile(jpg),
      sharp({ create: { width: 600, height: 400, channels: 4, background: { r: 0, g: 128, b: 128, alpha: 0.5 } } }).png().toFile(png),
    ]);
  }
}

(async () => {
  const exe = findBrowser();
  if (!exe) {
    console.log('SKIP: no Chromium-based browser found. Set BROWSER_PATH to run this test.');
    process.exit(0);
  }
  try {
    execFileSync('node', ['-e', `require('http').get('${BASE}/', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))`]);
  } catch {
    console.log(`SKIP: no server responding at ${BASE}. Run "npm start" first.`);
    process.exit(0);
  }

  await ensureFixtures();
  const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox'] });
  let pass = 0;
  const fails = [];
  const check = (name, cond, extra) => {
    if (cond) { pass++; console.log('  ok   ' + name); }
    else { fails.push(name); console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
  };

  async function open() {
    const p = await browser.newPage();
    p._errs = [];
    p.on('pageerror', (e) => p._errs.push(String(e.message).slice(0, 160)));
    p.on('console', (m) => {
      if (m.type() === 'error' && !/favicon|adsbygoogle|net::ERR_|ERR_BLOCKED_BY_CLIENT/i.test(m.text())) p._errs.push(m.text().slice(0, 160));
    });
    return p;
  }

  const routes = [
    '/', '/pdf', '/finance', '/image', '/tools', '/about', '/contact',
    '/privacy-policy', '/terms', '/cookie-policy', '/disclaimer',
    '/pdf/merge-pdf', '/pdf/split-pdf', '/pdf/compress-pdf', '/pdf/pdf-to-word', '/pdf/pdf-to-jpg',
    '/finance/emi-calculator', '/finance/sip-calculator', '/finance/fd-calculator', '/finance/rd-calculator',
    '/finance/gst-calculator', '/finance/loan-calculator', '/finance/cagr-calculator', '/finance/salary-calculator',
    '/image/compress-image', '/image/resize-image', '/image/jpg-to-png', '/image/png-to-jpg', '/image/webp-converter',
  ];

  console.log('\n## Pages load (no JS errors, exactly one H1)');
  for (const r of routes) {
    const p = await open();
    await p.goto(BASE + r, { waitUntil: 'networkidle0' }).catch(() => {});
    await wait(250);
    const h1 = await p.evaluate(() => document.querySelectorAll('h1').length);
    check(r, p._errs.length === 0 && h1 === 1, p._errs[0] || 'h1=' + h1);
    await p.close();
  }

  console.log('\n## Calculators react to input changes');
  for (const c of ['emi-calculator', 'sip-calculator', 'fd-calculator', 'rd-calculator', 'gst-calculator', 'loan-calculator', 'cagr-calculator', 'salary-calculator']) {
    const p = await open();
    await p.goto(`${BASE}/finance/${c}`, { waitUntil: 'networkidle0' });
    await wait(500);
    const snap = () => p.evaluate(() => (document.querySelector('main').innerText.match(/[₹%][\d,.]+/g) || []).join('|'));
    const before = await snap();
    const inp = await p.$('input[type="number"]');
    await inp.click({ clickCount: 3 });
    await inp.type('777');
    await inp.evaluate((el) => el.blur());
    await wait(450);
    check(`${c} reactive`, before !== (await snap()), p._errs[0]);
    await p.close();
  }

  console.log('\n## File tools accept uploads and produce output');
  const fileTests = [
    ['/pdf/merge-pdf', ['sample.pdf', 'sample2.pdf'], 'merge \\d+ pdf', 'ready|download merged'],
    ['/pdf/split-pdf', ['sample.pdf'], 'split pdf', 'ready|download'],
    ['/pdf/compress-pdf', ['sample.pdf'], 'compress pdf', 'saved|already|download compressed'],
    ['/pdf/pdf-to-word', ['sample.pdf'], 'convert to word', 'extracted|download .*docx|no text layer'],
    ['/pdf/pdf-to-jpg', ['sample.pdf'], 'convert to jpg', 'converted|download all'],
    ['/image/compress-image', ['sample.jpg'], 'compress \\d+ image', 'saved|review the savings'],
    ['/image/resize-image', ['sample.png'], 'resize image', 'resized to'],
    ['/image/jpg-to-png', ['sample.jpg'], 'convert \\d+ image', 'converted \\d+ image'],
    ['/image/png-to-jpg', ['sample.png'], 'convert \\d+ image', 'converted \\d+ image'],
    ['/image/webp-converter', ['sample.jpg'], 'convert \\d+ image', 'converted \\d+ image'],
  ];
  for (const [route, files, btn, ok] of fileTests) {
    const p = await open();
    await p.goto(BASE + route, { waitUntil: 'networkidle0' });
    await wait(500);
    const fi = await p.$('input[type="file"]');
    await fi.uploadFile(...files.map((f) => path.join(FIX, f)));
    await wait(900);
    const listed = await p.evaluate((n) => document.body.innerText.includes(n), files[0]);
    const clicked = await p.evaluate((re) => {
      const b = [...document.querySelectorAll('button')].find((x) => new RegExp(re, 'i').test(x.textContent));
      if (b) { b.click(); return true; }
      return false;
    }, btn);
    await wait(3500);
    const produced = await p.evaluate((re) => new RegExp(re, 'i').test(document.body.innerText), ok);
    check(route, listed && clicked && produced && p._errs.length === 0, p._errs[0] || `listed=${listed} clicked=${clicked} produced=${produced}`);
    await p.close();
  }

  console.log(`\n===== ${pass} passed, ${fails.length} failed =====`);
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
