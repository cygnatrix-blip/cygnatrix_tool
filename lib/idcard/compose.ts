'use client';

import { CR80, A4_SHEET } from '@/config/cr80';
import type { PixelRect } from './region';

export type Cr80FitMode = 'contain' | 'cover' | 'stretch';

/**
 * Pure: where a `srcW × srcH` image lands inside a CR80 canvas.
 *  - "contain": scales to fit entirely inside the card, padding with a thin
 *    white margin if the source's own proportions don't exactly match CR80 —
 *    nothing is ever cropped off, but a border can show.
 *  - "cover": scales to fill the card completely, cropping a sliver off two
 *    opposite edges if needed — no white margin, but risks trimming into
 *    edge content (a QR code or a line of text near the border).
 *  - "stretch" (default): scales width and height independently to fill the
 *    card exactly — no margin and nothing cropped, at the cost of a mild,
 *    even squeeze/stretch when the source's proportions don't match CR80.
 *    For a small ID card (a face photo plus mostly text and a QR code, both
 *    still fully legible when evenly stretched) this is usually the best
 *    trade-off — never losing information beats a perfectly-proportioned
 *    photo on a card this size.
 * No canvas — testable.
 */
export function computeCr80Fit(srcW: number, srcH: number, mode: Cr80FitMode = 'stretch'): PixelRect {
  if (mode === 'stretch') {
    return { x: 0, y: 0, width: CR80.width, height: CR80.height };
  }
  const scale = mode === 'cover' ? Math.max(CR80.width / srcW, CR80.height / srcH) : Math.min(CR80.width / srcW, CR80.height / srcH);
  const width = srcW * scale;
  const height = srcH * scale;
  return { x: (CR80.width - width) / 2, y: (CR80.height - height) / 2, width, height };
}

export function renderToCr80(source: CanvasImageSource, srcW: number, srcH: number, mode: Cr80FitMode = 'stretch'): HTMLCanvasElement {
  const fit = computeCr80Fit(srcW, srcH, mode);
  const canvas = document.createElement('canvas');
  canvas.width = CR80.width;
  canvas.height = CR80.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create a drawing canvas.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CR80.width, CR80.height);
  // "cover" draws larger than the canvas on purpose — drawImage clips to the
  // canvas bounds automatically, which is exactly the crop-to-fill behaviour.
  // "stretch" always draws the whole source into exactly CR80.width×height,
  // which is a non-uniform scale whenever the source aspect isn't 1011:638.
  ctx.drawImage(source, fit.x, fit.y, fit.width, fit.height);
  return canvas;
}

export interface A4Layout {
  front: { x: number; y: number };
  back: { x: number; y: number };
}

/** Pure: front + back CR80 cards centred side by side on the A4 sheet. Testable. */
export function computeA4Layout(): A4Layout {
  const totalW = CR80.width * 2 + A4_SHEET.gapPx;
  const x0 = (A4_SHEET.width - totalW) / 2;
  const y0 = (A4_SHEET.height - CR80.height) / 2;
  return {
    front: { x: x0, y: y0 },
    back: { x: x0 + CR80.width + A4_SHEET.gapPx, y: y0 },
  };
}

/** Front + back, already CR80-sized, tiled on one A4 sheet with cut guides. */
export function renderA4Sheet(front: CanvasImageSource, back: CanvasImageSource): HTMLCanvasElement {
  const layout = computeA4Layout();
  const canvas = document.createElement('canvas');
  canvas.width = A4_SHEET.width;
  canvas.height = A4_SHEET.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create a drawing canvas.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, A4_SHEET.width, A4_SHEET.height);

  ctx.drawImage(front, layout.front.x, layout.front.y, CR80.width, CR80.height);
  ctx.drawImage(back, layout.back.x, layout.back.y, CR80.width, CR80.height);

  ctx.save();
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(layout.front.x + 0.5, layout.front.y + 0.5, CR80.width - 1, CR80.height - 1);
  ctx.strokeRect(layout.back.x + 0.5, layout.back.y + 0.5, CR80.width - 1, CR80.height - 1);
  ctx.restore();

  return canvas;
}
