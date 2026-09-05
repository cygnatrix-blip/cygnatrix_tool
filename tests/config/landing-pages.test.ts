import { describe, expect, it } from 'vitest';
import { LANDING_PAGES, getLandingPage } from '@/config/landing-pages';
import { getToolById } from '@/config/tools';

describe('landing page registry', () => {
  it('has one entry per compress-to-size preset', () => {
    expect(LANDING_PAGES).toHaveLength(6);
  });

  it('every slug is unique', () => {
    const slugs = new Set(LANDING_PAGES.map((p) => p.slug));
    expect(slugs.size).toBe(LANDING_PAGES.length);
  });

  it('every targetToolId resolves to an active tool', () => {
    for (const page of LANDING_PAGES) {
      const tool = getToolById(page.targetToolId);
      expect(tool).toBeDefined();
      expect(tool?.active).toBe(true);
    }
  });

  it('getLandingPage resolves by slug and returns undefined for an unknown one', () => {
    expect(getLandingPage('compress-image-to-50kb')?.targetSizeKB).toBe(50);
    expect(getLandingPage('does-not-exist')).toBeUndefined();
  });

  it('targetSizeKB matches the value implied by the slug', () => {
    for (const page of LANDING_PAGES) {
      if (page.slug.endsWith('-1mb')) {
        expect(page.targetSizeKB).toBe(1024);
      } else {
        const match = page.slug.match(/-(\d+)kb$/);
        expect(match).not.toBeNull();
        expect(page.targetSizeKB).toBe(Number(match![1]));
      }
    }
  });

  it('every FAQ block has at least 3 questions', () => {
    for (const page of LANDING_PAGES) {
      expect(page.faq.length).toBeGreaterThanOrEqual(3);
    }
  });
});
