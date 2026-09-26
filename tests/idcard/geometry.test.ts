import { describe, expect, it } from 'vitest';
import { fracBoxToPixels } from '@/lib/idcard/region';
import { computeCr80Fit, computeA4Layout } from '@/lib/idcard/compose';
import { computeA4PdfLayout } from '@/lib/idcard/sheet-pdf';
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

  it('"cover" fills the card completely, drawing past the edges instead of padding', () => {
    const fit = computeCr80Fit(500, 1000, 'cover'); // much taller than CR80's ~1.58:1
    expect(fit.width).toBeGreaterThan(CR80.width - 1e-6);
    expect(fit.height).toBeGreaterThan(CR80.height - 1e-6);
    // it must overflow on at least one axis — that's what "no white border" requires
    expect(fit.x <= 1e-6 || fit.y <= 1e-6).toBe(true);
  });

  it('no mode can ever leave a white band, whatever the source shape', () => {
    // The hard requirement: every mode covers the full card. A "contain" mode
    // used to break this by padding the shape difference with white.
    for (const mode of ['stretch', 'cover'] as const) {
      for (const [w, h] of [[500, 1000], [3000, 100], [1275, 642], [CR80.width, CR80.height]]) {
        const fit = computeCr80Fit(w!, h!, mode);
        expect(fit.x).toBeLessThanOrEqual(1e-6);
        expect(fit.y).toBeLessThanOrEqual(1e-6);
        expect(fit.x + fit.width).toBeGreaterThan(CR80.width - 1e-6);
        expect(fit.y + fit.height).toBeGreaterThan(CR80.height - 1e-6);
      }
    }
  });

  it('"stretch" always fills the exact canvas, regardless of source shape', () => {
    expect(computeCr80Fit(500, 1000, 'stretch')).toEqual({ x: 0, y: 0, width: CR80.width, height: CR80.height });
    expect(computeCr80Fit(3000, 100, 'stretch')).toEqual({ x: 0, y: 0, width: CR80.width, height: CR80.height });
  });

  it('is the default mode', () => {
    expect(computeCr80Fit(500, 1000)).toEqual(computeCr80Fit(500, 1000, 'stretch'));
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

  it('sits the cards at the top of the sheet, not the middle', () => {
    const layout = computeA4Layout();
    expect(layout.front.y).toBe(A4_SHEET.topMarginPx);
    // well above the centre, leaving the rest of the page free
    expect(layout.front.y + CR80.height).toBeLessThan(A4_SHEET.height / 2);
  });

  it('centres the pair across the width', () => {
    const layout = computeA4Layout();
    const leftGap = layout.front.x;
    const rightGap = A4_SHEET.width - (layout.back.x + CR80.width);
    expect(leftGap).toBeCloseTo(rightGap, 5);
  });
});

describe('computeA4PdfLayout', () => {
  it('uses A4 in points', () => {
    const l = computeA4PdfLayout();
    expect(l.pageWidth).toBeCloseTo(595.28, 1);
    expect(l.pageHeight).toBeCloseTo(841.89, 1);
  });

  it('sizes each card to a true 85.6 × 54 mm so it prints at the real size', () => {
    const l = computeA4PdfLayout();
    expect(l.cardWidth).toBeCloseTo((85.6 / 25.4) * 72, 3);
    expect(l.cardHeight).toBeCloseTo((54 / 25.4) * 72, 3);
  });

  it('places the cards at the top of the page in PDF coordinates', () => {
    const l = computeA4PdfLayout();
    // PDF's origin is bottom-left, so "at the top" means a high y.
    const topGap = l.pageHeight - (l.front.y + l.cardHeight);
    expect(topGap).toBeCloseTo((A4_SHEET.topMarginMM / 25.4) * 72, 3);
    expect(l.front.y).toBeGreaterThan(l.pageHeight / 2);
    expect(l.front.y).toBe(l.back.y);
  });

  it('keeps both cards inside the page with the pair centred', () => {
    const l = computeA4PdfLayout();
    expect(l.front.x).toBeGreaterThan(0);
    expect(l.back.x + l.cardWidth).toBeLessThanOrEqual(l.pageWidth);
    expect(l.front.x).toBeCloseTo(l.pageWidth - (l.back.x + l.cardWidth), 5);
  });
});
