import { describe, expect, it } from 'vitest';
import { fracBoxToPixels } from '@/lib/idcard/region';
import { computeCr80Fit, computeA4Layout } from '@/lib/idcard/compose';
import { CR80, A4_SHEET } from '@/config/cr80';

describe('CR80 / A4 pixel dimensions', () => {
  it('matches the standard 85.6×54mm CR80 card at 300 DPI', () => {
    expect(CR80.width).toBe(1011);
    expect(CR80.height).toBe(638);
  });

  it('matches standard A4 at 300 DPI', () => {
    expect(A4_SHEET.width).toBe(2480);
    expect(A4_SHEET.height).toBe(3508);
  });
});

describe('fracBoxToPixels', () => {
  it('converts a fractional box to pixels of the source size', () => {
    const rect = fracBoxToPixels({ x: 0.5, y: 0.75, w: 0.5, h: 0.25 }, 2000, 3000);
    expect(rect).toEqual({ x: 1000, y: 2250, width: 1000, height: 750 });
  });
});

describe('computeCr80Fit', () => {
  it('centres a same-aspect source with no letterboxing', () => {
    const fit = computeCr80Fit(CR80.width, CR80.height);
    expect(fit.x).toBeCloseTo(0, 5);
    expect(fit.y).toBeCloseTo(0, 5);
    expect(fit.width).toBeCloseTo(CR80.width, 5);
    expect(fit.height).toBeCloseTo(CR80.height, 5);
  });

  it('letterboxes a taller-than-card source without cropping it ("contain")', () => {
    const fit = computeCr80Fit(500, 1000); // much taller than CR80's ~1.58:1
    expect(fit.height).toBeCloseTo(CR80.height, 5);
    expect(fit.width).toBeLessThan(CR80.width);
    expect(fit.x).toBeGreaterThan(0); // padded left/right, not cropped
  });

  it('"cover" fills the card completely, drawing past the edges instead of padding', () => {
    const fit = computeCr80Fit(500, 1000, 'cover'); // same source as above
    expect(fit.width).toBeGreaterThan(CR80.width - 1e-6);
    expect(fit.height).toBeGreaterThan(CR80.height - 1e-6);
    // it must overflow on at least one axis — that's what "no white border" requires
    expect(fit.x <= 1e-6 || fit.y <= 1e-6).toBe(true);
  });

  it('"cover" and "contain" agree exactly when the source already matches CR80', () => {
    const contain = computeCr80Fit(CR80.width, CR80.height, 'contain');
    const cover = computeCr80Fit(CR80.width, CR80.height, 'cover');
    expect(cover).toEqual(contain);
  });
});

describe('computeA4Layout', () => {
  it('places front and back side by side, fully inside the sheet', () => {
    const layout = computeA4Layout();
    expect(layout.back.x).toBeGreaterThan(layout.front.x + CR80.width);
    expect(layout.front.y).toBe(layout.back.y);
    expect(layout.front.x).toBeGreaterThanOrEqual(0);
    expect(layout.back.x + CR80.width).toBeLessThanOrEqual(A4_SHEET.width);
    expect(layout.front.y + CR80.height).toBeLessThanOrEqual(A4_SHEET.height);
  });
});
