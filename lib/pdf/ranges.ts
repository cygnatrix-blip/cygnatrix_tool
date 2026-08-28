/**
 * Parse a page-range expression like "1-3, 5, 8-10" into a sorted, de-duplicated
 * list of 1-based page numbers within [1, pageCount]. Also returns the grouped
 * ranges so callers can emit "one file per range" if asked.
 */
export interface ParsedRanges {
  pages: number[];
  groups: number[][];
  errors: string[];
}

export function parsePageRanges(expr: string, pageCount: number): ParsedRanges {
  const errors: string[] = [];
  const groups: number[][] = [];
  const seen = new Set<number>();

  const parts = expr
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { pages: [], groups: [], errors: ['Enter at least one page or range.'] };
  }

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    const singleMatch = part.match(/^(\d+)$/);

    if (singleMatch) {
      const n = Number(singleMatch[1]);
      if (n < 1 || n > pageCount) {
        errors.push(`Page ${n} is outside 1–${pageCount}.`);
        continue;
      }
      groups.push([n]);
      seen.add(n);
    } else if (rangeMatch) {
      let [a, b] = [Number(rangeMatch[1]), Number(rangeMatch[2])];
      if (a > b) [a, b] = [b, a];
      if (a < 1 || b > pageCount) {
        errors.push(`Range ${part} is outside 1–${pageCount}.`);
        continue;
      }
      const group: number[] = [];
      for (let i = a; i <= b; i += 1) {
        group.push(i);
        seen.add(i);
      }
      groups.push(group);
    } else {
      errors.push(`“${part}” is not a valid page or range.`);
    }
  }

  return { pages: [...seen].sort((x, y) => x - y), groups, errors };
}
