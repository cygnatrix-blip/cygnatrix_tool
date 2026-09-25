'use client';

import type { PixelRect } from './region';

/**
 * A pixel counts as blank when every channel is near-white. Checking the
 * darkest channel (rather than average brightness) is what keeps a coloured
 * band out of it — the orange header on an Ayushman card is bright overall,
 * but its blue channel is low, so it is never mistaken for margin.
 */
const BLANK_CHANNEL_MIN = 244;
/** A stray speck or JPEG noise shouldn't save an otherwise-blank line. */
const BLANK_LINE_RATIO = 0.99;
/** Below this the trim is treated as a misfire (e.g. an all-blank image). */
const MIN_KEPT_FRACTION = 0.1;

function pixelIsBlank(data: Uint8ClampedArray, i: number, threshold: number): boolean {
  const r = data[i] ?? 0;
  const g = data[i + 1] ?? 0;
  const b = data[i + 2] ?? 0;
  return Math.min(r, g, b) >= threshold;
}

function rowIsBlank(data: Uint8ClampedArray, width: number, y: number, threshold: number): boolean {
  let blank = 0;
  for (let x = 0; x < width; x += 1) {
    if (pixelIsBlank(data, (y * width + x) * 4, threshold)) blank += 1;
  }
  return blank >= width * BLANK_LINE_RATIO;
}

function colIsBlank(data: Uint8ClampedArray, width: number, height: number, x: number, threshold: number): boolean {
  let blank = 0;
  for (let y = 0; y < height; y += 1) {
    if (pixelIsBlank(data, (y * width + x) * 4, threshold)) blank += 1;
  }
  return blank >= height * BLANK_LINE_RATIO;
}

/**
 * Pure: the region worth keeping inside an RGBA raster.
 *
 * Only removes **letterboxing** — blank bands on one axis with the content
 * running edge to edge on the other. That is the shape background padding
 * takes when a card of one proportion is placed in a frame of another, and
 * stretching it along with the card is what produced visible white bands.
 *
 * A blank margin on all four sides is deliberately left alone: that is a
 * border, and a card's own design often has one (the Ayushman back is white
 * with a quiet margin around its text and QR code). Shaving it off and then
 * stretching makes the card bleed off every edge, which reads as the content
 * being cropped. Background can look identical to a design margin pixel for
 * pixel, so when it is ambiguous the card is left intact — a visible border
 * the user can crop away beats silently destroying the card's own layout.
 */
export function findContentBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  threshold = BLANK_CHANNEL_MIN,
): PixelRect {
  const full: PixelRect = { x: 0, y: 0, width, height };
  if (width < 1 || height < 1) return full;

  let top = 0;
  let bottom = height - 1;
  while (top < bottom && rowIsBlank(data, width, top, threshold)) top += 1;
  while (bottom > top && rowIsBlank(data, width, bottom, threshold)) bottom -= 1;

  let left = 0;
  let right = width - 1;
  while (left < right && colIsBlank(data, width, height, left, threshold)) left += 1;
  while (right > left && colIsBlank(data, width, height, right, threshold)) right -= 1;

  const banded = { top: top > 0, bottom: bottom < height - 1, left: left > 0, right: right < width - 1 };

  if (banded.top && banded.bottom && !banded.left && !banded.right) {
    const kept: PixelRect = { x: 0, y: top, width, height: bottom - top + 1 };
    return kept.height < height * MIN_KEPT_FRACTION ? full : kept;
  }
  if (banded.left && banded.right && !banded.top && !banded.bottom) {
    const kept: PixelRect = { x: left, y: 0, width: right - left + 1, height };
    return kept.width < width * MIN_KEPT_FRACTION ? full : kept;
  }
  return full;
}

/** Returns the source untouched when there is no blank margin to remove. */
export function trimBlankBorder(source: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = source.getContext('2d', { willReadFrequently: true });
  if (!ctx) return source;
  const { data } = ctx.getImageData(0, 0, source.width, source.height);
  const bounds = findContentBounds(data, source.width, source.height);
  if (bounds.x === 0 && bounds.y === 0 && bounds.width === source.width && bounds.height === source.height) {
    return source;
  }

  const out = document.createElement('canvas');
  out.width = bounds.width;
  out.height = bounds.height;
  const outCtx = out.getContext('2d');
  if (!outCtx) return source;
  outCtx.drawImage(source, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);
  return out;
}
