import { describe, expect, it } from 'vitest';
import { ALL_TOOLS, ACTIVE_TOOLS, getTool, getToolsByCategory, getRelatedTools, searchTools, getPopularTools } from '@/config/tools';
import { CATEGORY_LIST } from '@/config/categories';

describe('tool registry', () => {
  it('contains exactly the 18 MVP tools', () => {
    expect(ALL_TOOLS).toHaveLength(18);
    expect(ACTIVE_TOOLS).toHaveLength(18);
  });

  it('has 5 PDF, 8 finance and 5 image tools', () => {
    expect(getToolsByCategory('pdf')).toHaveLength(5);
    expect(getToolsByCategory('finance')).toHaveLength(8);
    expect(getToolsByCategory('image')).toHaveLength(5);
  });

  it('every tool has a unique slug and a path matching its category', () => {
    const slugs = new Set<string>();
    for (const t of ALL_TOOLS) {
      expect(slugs.has(t.path)).toBe(false);
      slugs.add(t.path);
      expect(t.path).toBe(`/${t.category}/${t.slug}`);
    }
  });

  it('every related tool exists, is active and is not self-referential', () => {
    for (const t of ALL_TOOLS) {
      expect(t.relatedTools).not.toContain(t.id);
      const related = getRelatedTools(t, 10);
      expect(related.length).toBe(Math.min(t.relatedTools.length, 10));
    }
  });

  it('every tool belongs to a known category', () => {
    const known = new Set(CATEGORY_LIST.map((c) => c.slug));
    for (const t of ALL_TOOLS) expect(known.has(t.category)).toBe(true);
  });

  it('getTool resolves by category and slug', () => {
    expect(getTool('finance', 'emi-calculator')?.name).toBe('EMI Calculator');
    expect(getTool('pdf', 'nope')).toBeUndefined();
  });

  it('landing page popular tools resolve to 6 active tools', () => {
    expect(getPopularTools()).toHaveLength(6);
  });
});

describe('searchTools', () => {
  it('finds both loan-related calculators for "loan"', () => {
    const ids = searchTools('loan').map((t) => t.id);
    expect(ids).toContain('emi-calculator');
    expect(ids).toContain('loan-calculator');
  });

  it('returns every PDF tool for "pdf"', () => {
    const ids = searchTools('pdf', 20).map((t) => t.id);
    for (const t of getToolsByCategory('pdf')) expect(ids).toContain(t.id);
  });

  it('matches on keywords not present in the name', () => {
    const ids = searchTools('take home').map((t) => t.id);
    expect(ids).toContain('salary-calculator');
  });

  it('returns nothing for an empty or nonsense query', () => {
    expect(searchTools('')).toHaveLength(0);
    expect(searchTools('zzxqwptn')).toHaveLength(0);
  });
});
