import { describe, expect, it } from 'vitest';
import { buildMetadata, absoluteUrl } from '@/lib/seo/metadata';
import { ACTIVE_TOOLS } from '@/config/tools';
import { CATEGORY_LIST } from '@/config/categories';

describe('buildMetadata', () => {
  it('always sets a canonical, OpenGraph and Twitter card', () => {
    const m = buildMetadata({
      title: 'EMI Calculator',
      description: 'Work out your loan EMI.',
      path: '/finance/emi-calculator',
    });
    expect(m.alternates?.canonical).toBe('https://tools.cygnatrix.com/finance/emi-calculator');
    expect(m.openGraph?.url).toBe('https://tools.cygnatrix.com/finance/emi-calculator');
    expect(m.twitter).toBeTruthy();
    expect(m.robots).toMatchObject({ index: true });
  });

  it('can mark a page noindex', () => {
    const m = buildMetadata({ title: 'x', description: 'y'.repeat(20), path: '/thanks', noindex: true });
    expect(m.robots).toMatchObject({ index: false });
  });

  it('builds absolute URLs from paths', () => {
    expect(absoluteUrl('/pdf')).toBe('https://tools.cygnatrix.com/pdf');
    expect(absoluteUrl('https://x.com/y')).toBe('https://x.com/y');
  });
});

describe('SEO uniqueness across the site', () => {
  it('every tool and category has a distinct seo title and description', () => {
    const titles = new Set<string>();
    const descs = new Set<string>();
    for (const t of [...ACTIVE_TOOLS, ...CATEGORY_LIST]) {
      expect(titles.has(t.seoTitle)).toBe(false);
      expect(descs.has(t.seoDescription)).toBe(false);
      titles.add(t.seoTitle);
      descs.add(t.seoDescription);
    }
  });

  it('every tool canonical is unique and correctly shaped', () => {
    const seen = new Set<string>();
    for (const t of ACTIVE_TOOLS) {
      const url = absoluteUrl(t.path);
      expect(seen.has(url)).toBe(false);
      seen.add(url);
      expect(url).toMatch(/^https:\/\/tools\.cygnatrix\.com\/(pdf|finance|image)\/[a-z0-9-]+$/);
    }
  });
});
