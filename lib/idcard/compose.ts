'use client';

import { CR80, A4_SHEET } from '@/config/cr80';
import type { PixelRect } from './region';

/**
 * Pure: where a `srcW × srcH` image lands inside a CR80 canvas, scaled to fit
 * without cropping (a slightly-off crop from the source PDF/photo still
 * prints whole, just with a thin white margin, rather than losing an edge of
 * the card). No canvas — testable.
 */
export function computeCr80Fit(srcW: number, srcH: number): PixelRect {
  const scale = Math.min(CR80.width / srcW, CR80.height / srcH);
  const width = srcW * scale;
  const height = srcH * scale;
  return { x: (CR80.width - width) / 2, y: (CR80.height - height) / 2, width, height };
}

export function renderToCr80(source: CanvasImageSource, srcW: number, srcH: number): HTMLCanvasElement {
  const fit = computeCr80Fit(srcW, srcH);
  const canvas = document.createElement('canvas');
  canvas.width = CR80.width;
  canvas.height = CR80.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create a drawing canvas.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CR80.width, CR80.height);
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
