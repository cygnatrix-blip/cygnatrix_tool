import { describe, expect, it } from 'vitest';
import { parsePageRanges } from '@/lib/pdf/ranges';

describe('parsePageRanges', () => {
  it('parses a mix of singles and ranges', () => {
    const r = parsePageRanges('1-3, 5, 8-10', 12);
    expect(r.errors).toHaveLength(0);
    expect(r.pages).toEqual([1, 2, 3, 5, 8, 9, 10]);
    expect(r.groups).toEqual([[1, 2, 3], [5], [8, 9, 10]]);
  });

  it('de-duplicates overlapping ranges', () => {
    const r = parsePageRanges('1-5, 3-7', 10);
    expect(r.pages).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('normalises reversed ranges', () => {
    expect(parsePageRanges('9-4', 10).pages).toEqual([4, 5, 6, 7, 8, 9]);
  });

  it('flags out-of-bounds pages', () => {
    const r = parsePageRanges('1, 25', 10);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.pages).toEqual([1]);
  });

  it('rejects garbage', () => {
    expect(parsePageRanges('abc', 10).errors.length).toBeGreaterThan(0);
    expect(parsePageRanges('', 10).errors.length).toBeGreaterThan(0);
    expect(parsePageRanges('1--3', 10).errors.length).toBeGreaterThan(0);
  });
});
