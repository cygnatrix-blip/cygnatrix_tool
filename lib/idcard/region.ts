'use client';

import type { FracBox } from '@/config/idcard-pdf-presets';

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Pure: a fractional box (0..1, of a `srcW × srcH` source) → a pixel rect. No canvas — testable. */
export function fracBoxToPixels(box: FracBox, srcW: number, srcH: number): PixelRect {
  return {
    x: box.x * srcW,
    y: box.y * srcH,
    width: Math.max(1, box.w * srcW),
    height: Math.max(1, box.h * srcH),
  };
}

/** Crop a rectangular region out of a source canvas/image at its native resolution. */
export function cropRegion(source: CanvasImageSource, srcW: number, srcH: number, box: FracBox): HTMLCanvasElement {
  const rect = fracBoxToPixels(box, srcW, srcH);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(rect.width);
  canvas.height = Math.round(rect.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create a drawing canvas.');
  ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}
