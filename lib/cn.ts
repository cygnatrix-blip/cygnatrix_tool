export type ClassValue = string | number | false | null | undefined | ClassValue[];

/** Tiny classnames joiner — no dependency needed for our usage. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const v of values) {
    if (!v) continue;
    if (Array.isArray(v)) out.push(cn(...v));
    else out.push(String(v));
  }
  return out.join(' ');
}
