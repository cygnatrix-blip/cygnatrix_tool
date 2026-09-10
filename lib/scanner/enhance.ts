'use client';

/**
 * Post-de-warp cleanup filters. Each mode takes a canvas and returns a new one.
 *
 *  - original : untouched
 *  - color    : gray-world white balance + contrast stretch + light sharpen
 *  - auto     : color, then a gentle brightening — the "clean scan" look
 *  - grey     : luma
 *  - bw       : adaptive threshold (Bradley/Wellner), a crisp black-on-white page
 */

export type EnhanceMode = 'auto' | 'color' | 'grey' | 'bw' | 'original';

export function enhance(source: HTMLCanvasElement, mode: EnhanceMode): HTMLCanvasElement {
  if (mode === 'original') return source;

  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create a drawing canvas.');
  ctx.drawImage(source, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  if (mode === 'bw') {
    adaptiveThreshold(d, canvas.width, canvas.height);
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  if (mode === 'grey') {
    for (let i = 0; i < d.length; i += 4) {
      const y = (d[i]! * 0.299 + d[i + 1]! * 0.587 + d[i + 2]! * 0.114) | 0;
      d[i] = d[i + 1] = d[i + 2] = y;
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  // color / auto
  grayWorldWhiteBalance(d);
  contrastStretch(d, mode === 'auto' ? 0.004 : 0.01, mode === 'auto' ? 12 : 0);
  ctx.putImageData(img, 0, 0);
  sharpen(ctx, canvas);
  return canvas;
}

function grayWorldWhiteBalance(d: Uint8ClampedArray): void {
  let r = 0;
  let g = 0;
  let b = 0;
  const n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) {
    r += d[i]!;
    g += d[i + 1]!;
    b += d[i + 2]!;
  }
  r /= n;
  g /= n;
  b /= n;
  const gray = (r + g + b) / 3;
  const kr = gray / (r || 1);
  const kg = gray / (g || 1);
  const kb = gray / (b || 1);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = d[i]! * kr;
    d[i + 1] = d[i + 1]! * kg;
    d[i + 2] = d[i + 2]! * kb;
  }
}

/** Linear map so the `clip` darkest/brightest luma fractions hit 0/255, plus a brightness lift. */
function contrastStretch(d: Uint8ClampedArray, clip: number, lift: number): void {
  const hist = new Uint32Array(256);
  const n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) {
    const y = (d[i]! * 0.299 + d[i + 1]! * 0.587 + d[i + 2]! * 0.114) | 0;
    hist[y]! += 1;
  }
  const cut = n * clip;
  let lo = 0;
  let hi = 255;
  let acc = 0;
  for (let v = 0; v < 256; v += 1) {
    acc += hist[v]!;
    if (acc > cut) {
      lo = v;
      break;
    }
  }
  acc = 0;
  for (let v = 255; v >= 0; v -= 1) {
    acc += hist[v]!;
    if (acc > cut) {
      hi = v;
      break;
    }
  }
  const range = Math.max(1, hi - lo);
  const scale = 255 / range;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = (d[i]! - lo) * scale + lift;
    d[i + 1] = (d[i + 1]! - lo) * scale + lift;
    d[i + 2] = (d[i + 2]! - lo) * scale + lift;
  }
}

function sharpen(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  const w = canvas.width;
  const h = canvas.height;
  const src = ctx.getImageData(0, 0, w, h);
  const s = src.data;
  const out = ctx.createImageData(w, h);
  const o = out.data;
  const amount = 0.6;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c += 1) {
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
          o[i + c] = s[i + c]!;
          continue;
        }
        const center = s[i + c]!;
        const lap =
          center * 4 -
          s[i - 4 + c]! -
          s[i + 4 + c]! -
          s[i - w * 4 + c]! -
          s[i + w * 4 + c]!;
        o[i + c] = center + amount * lap;
      }
      o[i + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
}

/**
 * Bradley adaptive threshold via an integral image: a pixel is white unless it
 * is more than `t`% darker than the mean of its neighbourhood.
 */
function adaptiveThreshold(d: Uint8ClampedArray, w: number, h: number): void {
  const gray = new Float64Array(w * h);
  for (let i = 0, p = 0; i < gray.length; i += 1, p += 4) {
    gray[i] = d[p]! * 0.299 + d[p + 1]! * 0.587 + d[p + 2]! * 0.114;
  }
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 1; y <= h; y += 1) {
    let rowSum = 0;
    for (let x = 1; x <= w; x += 1) {
      rowSum += gray[(y - 1) * w + (x - 1)]!;
      integral[y * (w + 1) + x] = integral[(y - 1) * (w + 1) + x]! + rowSum;
    }
  }
  const S = Math.max(8, Math.floor(Math.min(w, h) / 12));
  const half = S >> 1;
  const T = 0.86; // keep 86% of the local mean

  for (let y = 0; y < h; y += 1) {
    const y0 = Math.max(0, y - half);
    const y1 = Math.min(h - 1, y + half);
    for (let x = 0; x < w; x += 1) {
      const x0 = Math.max(0, x - half);
      const x1 = Math.min(w - 1, x + half);
      const count = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum =
        integral[(y1 + 1) * (w + 1) + (x1 + 1)]! -
        integral[y0 * (w + 1) + (x1 + 1)]! -
        integral[(y1 + 1) * (w + 1) + x0]! +
        integral[y0 * (w + 1) + x0]!;
      const i = y * w + x;
      const v = gray[i]! * count <= sum * T ? 0 : 255;
      const p = i * 4;
      d[p] = d[p + 1] = d[p + 2] = v;
      d[p + 3] = 255;
    }
  }
}
