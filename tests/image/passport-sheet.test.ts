import { describe, expect, it } from 'vitest';
import { computeTileLayout } from '@/lib/image/passport-sheet';

describe('computeTileLayout', () => {
  it('tiles an India-size passport photo (413×531) onto a 4×6in @300dpi sheet (1200×1800)', () => {
    const layout = computeTileLayout({
      sheetWidth: 1200,
      sheetHeight: 1800,
      photoWidth: 413,
      photoHeight: 531,
      marginPx: 35, // ~3mm
      gapPx: 24, // ~2mm
    });
    // availW = 1130, availH = 1730
    // cols = floor((1130+24)/(413+24)) = floor(1154/437) = 2
    // rows = floor((1730+24)/(531+24)) = floor(1754/555) = 3
    expect(layout.cols).toBe(2);
    expect(layout.rows).toBe(3);
    expect(layout.count).toBe(6);
    expect(layout.positions).toHaveLength(6);
  });

  it('centres the tile grid within the available area', () => {
    const layout = computeTileLayout({
      sheetWidth: 1000,
      sheetHeight: 1000,
      photoWidth: 200,
      photoHeight: 200,
      marginPx: 0,
      gapPx: 0,
    });
    // 5 columns/rows fit exactly (1000/200=5) with zero margin — grid fills the sheet exactly.
    expect(layout.cols).toBe(5);
    expect(layout.rows).toBe(5);
    expect(layout.positions[0]).toEqual({ x: 0, y: 0 });
  });

  it('centres with leftover space when tiles do not fill the sheet exactly', () => {
    const layout = computeTileLayout({
      sheetWidth: 1000,
      sheetHeight: 1000,
      photoWidth: 300,
      photoHeight: 300,
      marginPx: 0,
      gapPx: 0,
    });
    // 3 columns/rows fit (900 of 1000px used) — 100px leftover split evenly = 50px each side.
    expect(layout.cols).toBe(3);
    expect(layout.positions[0]).toEqual({ x: 50, y: 50 });
  });

  it('returns an empty layout when the photo does not fit at all', () => {
    const layout = computeTileLayout({
      sheetWidth: 100,
      sheetHeight: 100,
      photoWidth: 500,
      photoHeight: 500,
      marginPx: 10,
      gapPx: 5,
    });
    expect(layout.count).toBe(0);
    expect(layout.positions).toEqual([]);
  });

  it('never produces overlapping tiles', () => {
    const layout = computeTileLayout({
      sheetWidth: 1200,
      sheetHeight: 1800,
      photoWidth: 413,
      photoHeight: 531,
      marginPx: 35,
      gapPx: 24,
    });
    for (let i = 0; i < layout.positions.length; i += 1) {
      for (let j = i + 1; j < layout.positions.length; j += 1) {
        const a = layout.positions[i]!;
        const b = layout.positions[j]!;
        const overlapX = Math.abs(a.x - b.x) < 413;
        const overlapY = Math.abs(a.y - b.y) < 531;
        expect(overlapX && overlapY).toBe(false);
      }
    }
  });

  it('every tile stays within the sheet bounds', () => {
    const layout = computeTileLayout({
      sheetWidth: 1200,
      sheetHeight: 1800,
      photoWidth: 600,
      photoHeight: 600,
      marginPx: 35,
      gapPx: 24,
    });
    for (const pos of layout.positions) {
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.x + 600).toBeLessThanOrEqual(1200);
      expect(pos.y + 600).toBeLessThanOrEqual(1800);
    }
  });
});
