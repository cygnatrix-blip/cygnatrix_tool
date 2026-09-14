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

function rowIsBlank(data: Uint8ClampedArray, width: number, y: number, x0: number, x1: number, threshold: number): boolean {
  let blank = 0;
  for (let x = x0; x <= x1; x += 1) {
    if (pixelIsBlank(data, (y * width + x) * 4, threshold)) blank += 1;
  }
  return blank >= (x1 - x0 + 1) * BLANK_LINE_RATIO;
}

function colIsBlank(data: Uint8ClampedArray, width: number, x: number, y0: number, y1: number, threshold: number): boolean {
  let blank = 0;
  for (let y = y0; y <= y1; y += 1) {
    if (pixelIsBlank(data, (y * width + x) * 4, threshold)) blank += 1;
  }
  return blank >= (y1 - y0 + 1) * BLANK_LINE_RATIO;
}

/**
 * Pure: the bounds of the actual content inside an RGBA raster, found by
 * shaving off blank (near-white) rows and columns from each edge.
 *
 * This is what lets a rough selection still fill the card exactly. Every fit
 * mode draws precisely what it is given, so a blank margin left inside a crop
 * box — page white around a card printed on a PDF, or desk/background around a
 * photographed card — would otherwise be stretched right along with the card
 * and show up as a white band. Trimming it first means the card itself is what
 * gets stretched to the card's edges.
 *
 * Falls back to the full rect when the scan collapses (an entirely blank
 * image), so a misfire can never produce a sliver.
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
  while (top < bottom && rowIsBlank(data, width, top, 0, width - 1, threshold)) top += 1;
  while (bottom > top && rowIsBlank(data, width, bottom, 0, width - 1, threshold)) bottom -= 1;

  let left = 0;
  let right = width - 1;
  while (left < right && colIsBlank(data, width, left, top, bottom, threshold)) left += 1;
  while (right > left && colIsBlank(data, width, right, top, bottom, threshold)) right -= 1;

  const kept: PixelRect = { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
  if (kept.width < width * MIN_KEPT_FRACTION || kept.height < height * MIN_KEPT_FRACTION) return full;
  return kept;
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
