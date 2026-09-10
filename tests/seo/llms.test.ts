import { describe, expect, it } from 'vitest';
import { buildLlmsTxt, buildLlmsFullTxt } from '@/lib/seo/llms';
import { ACTIVE_TOOLS } from '@/config/tools';
import { CATEGORY_LIST } from '@/config/categories';
import { LANDING_PAGES } from '@/config/landing-pages';

const BASE = 'https://tools.cygnatrix.com';

describe('llms.txt', () => {
  const txt = buildLlmsTxt();

  it('starts with the H1 and a blockquote summary', () => {
    expect(txt.startsWith('# Cygnatrix Tools\n')).toBe(true);
    expect(txt).toMatch(/\n> .+\n/);
  });

  it('lists every active tool with an absolute URL and description', () => {
    for (const t of ACTIVE_TOOLS) {
      expect(txt).toContain(`[${t.name}](${BASE}${t.path}): ${t.shortDescription}`);
    }
  });

  it('has a section heading for each non-empty category', () => {
    for (const c of CATEGORY_LIST) expect(txt).toContain(`## ${c.name}`);
  });

  it('links every task-specific landing page', () => {
    for (const p of LANDING_PAGES) expect(txt).toContain(`(${BASE}/${p.slug}):`);
  });

  it('contains only absolute https links and no local or env leakage', () => {
    const urls = [...txt.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]!);
    expect(urls.length).toBeGreaterThan(0);
    for (const u of urls) expect(u.startsWith(`${BASE}/`)).toBe(true);
    expect(txt).not.toMatch(/localhost|127\.0\.0\.1|NEXT_PUBLIC|process\.env/);
  });

  it('stays compact', () => {
    expect(txt.length).toBeLessThan(20_000);
  });
});

describe('llms-full.txt', () => {
  const full = buildLlmsFullTxt();

  it('includes each tool URL, its long description and how-it-works steps', () => {
    for (const t of ACTIVE_TOOLS) {
      expect(full).toContain(`URL: ${BASE}${t.path}`);
      expect(full).toContain(t.description);
    }
    expect(full).toContain('How it works:');
    expect(full).toMatch(/\nFAQ:\nQ: /);
  });

  it('is a plausible size for a full reference', () => {
    expect(full.length).toBeGreaterThan(15_000);
    expect(full.length).toBeLessThan(400_000);
  });
});
