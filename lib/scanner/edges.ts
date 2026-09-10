/**
 * Lightweight edge detection for document-boundary finding. Pure typed-array
 * maths (no DOM), so it runs in the detection worker and is unit-testable.
 *
 * Grayscale → separable Gaussian blur → Sobel gradients. Tuned for finding one
 * big rectangle rather than fine detail.
 */

export interface Gray {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export function toGray(rgba: Uint8ClampedArray, width: number, height: number): Gray {
  const out = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; i < out.length; i += 1, p += 4) {
    // Rec. 601 luma.
    out[i] = (rgba[p]! * 0.299 + rgba[p + 1]! * 0.587 + rgba[p + 2]! * 0.114) | 0;
  }
  return { data: out, width, height };
}

/** Separable 1-D Gaussian (radius derived from sigma), clamped at the borders. */
export function gaussianBlur(src: Gray, sigma = 1.4): Gray {
  const radius = Math.max(1, Math.ceil(sigma * 3));
  const kernel = new Float32Array(radius * 2 + 1);
  let sum = 0;
  for (let i = -radius; i <= radius; i += 1) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + radius] = v;
    sum += v;
  }
  for (let i = 0; i < kernel.length; i += 1) kernel[i]! /= sum;

  const { width, height, data } = src;
  const tmp = new Float32Array(width * height);
  const out = new Uint8ClampedArray(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let acc = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const xx = Math.min(width - 1, Math.max(0, x + k));
        acc += data[y * width + xx]! * kernel[k + radius]!;
      }
      tmp[y * width + x] = acc;
    }
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let acc = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const yy = Math.min(height - 1, Math.max(0, y + k));
        acc += tmp[yy * width + x]! * kernel[k + radius]!;
      }
      out[y * width + x] = acc;
    }
  }
  return { data: out, width, height };
}

export interface Gradient {
  gx: Float32Array;
  gy: Float32Array;
  mag: Float32Array;
  width: number;
  height: number;
}

/** 3×3 Sobel gradients + magnitude. Borders are left at zero. */
export function sobel(src: Gray): Gradient {
  const { width, height, data: g } = src;
  const gx = new Float32Array(width * height);
  const gy = new Float32Array(width * height);
  const mag = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const dx =
        -g[i - width - 1]! - 2 * g[i - 1]! - g[i + width - 1]! +
        g[i - width + 1]! + 2 * g[i + 1]! + g[i + width + 1]!;
      const dy =
        -g[i - width - 1]! - 2 * g[i - width]! - g[i - width + 1]! +
        g[i + width - 1]! + 2 * g[i + width]! + g[i + width + 1]!;
      gx[i] = dx;
      gy[i] = dy;
      mag[i] = Math.hypot(dx, dy);
    }
  }
  return { gx, gy, mag, width, height };
}

