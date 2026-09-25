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
const BLANK_MAX_INK = 0.01;
/**
 * How much of a line must be inked for it to read as the card's own edge.
 * Measured on real cards: an Ayushman front's coloured band runs the full
 * width (~100%), while the back's first inked line inside its margin is text
 * or a QR code (1–5%). Anything sparse is content, and the blank around it is
 * the card's own quiet margin, not background.
 */
const EDGE_DENSITY_MIN = 0.5;
/** Below this the trim is treated as a misfire (e.g. an all-blank image). */
const MIN_KEPT_FRACTION = 0.1;

function pixelIsBlank(data: Uint8ClampedArray, i: number, threshold: number): boolean {
  const r = data[i] ?? 0;
  const g = data[i + 1] ?? 0;
  const b = data[i + 2] ?? 0;
  return Math.min(r, g, b) >= threshold;
}

function rowInk(data: Uint8ClampedArray, width: number, y: number, threshold: number): number {
  let ink = 0;
  for (let x = 0; x < width; x += 1) {
    if (!pixelIsBlank(data, (y * width + x) * 4, threshold)) ink += 1;
  }
  return ink / width;
}

function colInk(data: Uint8ClampedArray, width: number, height: number, x: number, threshold: number): number {
  let ink = 0;
  for (let y = 0; y < height; y += 1) {
    if (!pixelIsBlank(data, (y * width + x) * 4, threshold)) ink += 1;
  }
  return ink / height;
}

/**
 * Pure: the region worth keeping inside an RGBA raster.
 *
 * Blank background and a card's own quiet margin are identical pixel for
 * pixel, so the two are told apart by what the trim would stop *at*. A side is
 * only pulled in when the first inked line there spans most of that edge —
 * the signature of the card's own boundary, like the coloured band running the
 * full width of an Ayushman front. When the boundary is sparse it is text or a
 * QR code, meaning the blank around it belongs to the card's design; pulling
 * in to it and then stretching would make the content bleed off the edge and
 * read as cropped. Each side is decided independently.
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
  while (top < bottom && rowInk(data, width, top, threshold) <= BLANK_MAX_INK) top += 1;
  while (bottom > top && rowInk(data, width, bottom, threshold) <= BLANK_MAX_INK) bottom -= 1;

  let left = 0;
  let right = width - 1;
  while (left < right && colInk(data, width, height, left, threshold) <= BLANK_MAX_INK) left += 1;
  while (right > left && colInk(data, width, height, right, threshold) <= BLANK_MAX_INK) right -= 1;

  if (top > 0 && rowInk(data, width, top, threshold) < EDGE_DENSITY_MIN) top = 0;
  if (bottom < height - 1 && rowInk(data, width, bottom, threshold) < EDGE_DENSITY_MIN) bottom = height - 1;
  if (left > 0 && colInk(data, width, height, left, threshold) < EDGE_DENSITY_MIN) left = 0;
  if (right < width - 1 && colInk(data, width, height, right, threshold) < EDGE_DENSITY_MIN) right = width - 1;

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
