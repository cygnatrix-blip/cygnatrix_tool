'use client';

import type { PixelRect } from './region';

/**
 * Only a pixel clearly darker than paper counts as content. Measured on a real
 * white band from a card JPEG: it averages 250 but only 98% of its pixels are
 * a flat 255 — the rest is compression ringing and anti-aliasing sitting just
 * under white. Treating any non-white pixel as content left those bands in
 * place, so the gap between this and white is read as noise, not ink.
 *
 * Judged on the darkest channel rather than overall brightness, which is what
 * keeps a coloured band out of it — an Ayushman front's orange is bright, but
 * its blue channel is low, so it always registers as ink.
 */
const INK_CHANNEL_MAX = 200;
/** A stray speck shouldn't save an otherwise-blank line. */
const BLANK_MAX_INK = 0.01;
/** An inked run this thin at the very edge is a border line, not content. */
const FRAME_MAX_PX = 6;
/** Below this the trim is treated as a misfire (e.g. an all-blank image). */
const MIN_KEPT_FRACTION = 0.1;

/**
 * Judges the pixel as it will actually look once drawn, by compositing it onto
 * the white card first. This is what a transparent margin needs: its raw RGB is
 * (0,0,0), so reading it directly makes fully see-through padding look like
 * solid black ink — untrimmable — and it then renders as a white bar on the
 * finished card. Against white it correctly reads as blank.
 */
function pixelIsInk(data: Uint8ClampedArray, i: number, inkMax: number): boolean {
  const a = (data[i + 3] ?? 255) / 255;
  const r = (data[i] ?? 0) * a + 255 * (1 - a);
  const g = (data[i + 1] ?? 0) * a + 255 * (1 - a);
  const b = (data[i + 2] ?? 0) * a + 255 * (1 - a);
  return Math.min(r, g, b) < inkMax;
}

function rowInk(data: Uint8ClampedArray, width: number, y: number, inkMax: number): number {
  let ink = 0;
  for (let x = 0; x < width; x += 1) {
    if (pixelIsInk(data, (y * width + x) * 4, inkMax)) ink += 1;
  }
  return ink / width;
}

function colInk(data: Uint8ClampedArray, width: number, x: number, y0: number, y1: number, inkMax: number): number {
  let ink = 0;
  for (let y = y0; y <= y1; y += 1) {
    if (pixelIsInk(data, (y * width + x) * 4, inkMax)) ink += 1;
  }
  return ink / (y1 - y0 + 1);
}

/**
 * Walks in from one edge and returns how many lines to drop.
 *
 * A card image often carries a hairline frame drawn right on its outer edge.
 * Stopping at the first inked line would stop on that frame, leaving the whole
 * blank margin just inside it untouched — the card then keeps a white border no
 * matter what. So a thin inked run at the very edge is stepped over when blank
 * follows it. Ink that keeps going past `FRAME_MAX_PX` is real content sitting
 * at the edge, and nothing is dropped.
 */
function edgeOffset(lineInk: (i: number) => number, limit: number): number {
  let i = 0;
  while (i < limit && lineInk(i) > BLANK_MAX_INK && i < FRAME_MAX_PX) i += 1;
  if (i > 0 && (i >= limit || lineInk(i) > BLANK_MAX_INK)) return 0;
  while (i < limit && lineInk(i) <= BLANK_MAX_INK) i += 1;
  return i;
}

/**
 * Pure: the bounds of the inked content inside an RGBA raster.
 *
 * Every blank edge is removed, so the content reaches the card's edges with no
 * white left anywhere — the explicitly chosen behaviour, preferred over keeping
 * a print-safe margin. The consequence is accepted rather than overlooked:
 * content ends up flush with the edge, so a card printed and cut from this can
 * lose a hair of whatever sits at the boundary.
 *
 * Note this cannot distinguish background from a card's own quiet margin — they
 * are identical pixel for pixel — so a design margin is removed too. Attempts to
 * tell them apart by shape, and by how densely the boundary line is inked, both
 * misfired on real cards; filling completely is what was asked for and is at
 * least predictable.
 */
export function findContentBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  inkMax = INK_CHANNEL_MAX,
): PixelRect {
  const full: PixelRect = { x: 0, y: 0, width, height };
  if (width < 1 || height < 1) return full;

  const top = edgeOffset((i) => rowInk(data, width, i, inkMax), height);
  const bottomDrop = edgeOffset((i) => rowInk(data, width, height - 1 - i, inkMax), height);
  const bottom = height - 1 - bottomDrop;
  if (bottom <= top) return full;

  const left = edgeOffset((i) => colInk(data, width, i, top, bottom, inkMax), width);
  const rightDrop = edgeOffset((i) => colInk(data, width, width - 1 - i, top, bottom, inkMax), width);
  const right = width - 1 - rightDrop;
  if (right <= left) return full;

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
