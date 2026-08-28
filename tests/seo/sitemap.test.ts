import { describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { ACTIVE_TOOLS } from '@/config/tools';

describe('sitemap', () => {
  const entries = sitemap();

  it('includes home, all categories, all active tools and legal pages with no duplicates', () => {
    const urls = entries.map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain('https://tools.cygnatrix.com/');
    for (const slug of ['pdf', 'finance', 'image']) {
      expect(urls).toContain(`https://tools.cygnatrix.com/${slug}`);
    }
    for (const tool of ACTIVE_TOOLS) {
      expect(urls).toContain(`https://tools.cygnatrix.com${tool.path}`);
    }
    expect(urls).toContain('https://tools.cygnatrix.com/privacy-policy');
  });

  it('does not include api, admin or Next internal routes', () => {
    for (const e of entries) {
      expect(e.url).not.toMatch(/\/api\/|\/_next\/|\/admin/);
    }
  });

  it('every entry has a lastModified date', () => {
    for (const e of entries) expect(e.lastModified).toBeInstanceOf(Date);
  });
});

describe('robots', () => {
  it('allows crawling but blocks api and points to the sitemap', () => {
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule?.allow).toBe('/');
    expect(rule?.disallow).toContain('/api/');
    expect(r.sitemap).toBe('https://tools.cygnatrix.com/sitemap.xml');
  });
});
