/**
 * Best-effort "whiten the background" cleanup for a photographed or scanned
 * signature on paper. Pure pixel math (no ML/segmentation model — that would
 * need a large dependency and still be unreliable for this) operating on raw
 * RGBA bytes, so the core transform is unit-testable without a canvas.
 *
 * Approach: treat the brightest band of pixels in the crop as "paper" and
 * stretch the whole brightness range so that band maps to pure white, then
 * push anything still darker than a threshold (the ink) further toward black
 * for contrast. This handles the common case — a fairly uniform paper tone
 * that's off-white/creased/unevenly lit — without needing to find edges or
 * detect the pen stroke explicitly.
 */

export interface SignatureCleanupOptions {
  /** Percentile (0-100) of pixel brightness treated as the paper background. Default 92. */
  whitePercentile?: number;
  /** Luminance (0-255) below which a pixel is treated as ink and darkened further. Default 150. */
  inkThreshold?: number;
  /** How much extra darkening to apply to ink pixels, 0-1. Default 0.6. */
  inkBoost?: number;
}

const DEFAULTS: Required<SignatureCleanupOptions> = {
  whitePercentile: 92,
  inkThreshold: 150,
  inkBoost: 0.6,
};

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Sample up to `maxSamples` pixels' luminance to estimate the percentile cheaply on large images. */
function estimateWhiteReference(rgba: Uint8ClampedArray, pixelCount: number, percentile: number, maxSamples = 20_000): number {
  const stride = Math.max(1, Math.floor(pixelCount / maxSamples));
  const samples: number[] = [];
  for (let i = 0; i < pixelCount; i += stride) {
    const o = i * 4;
    samples.push(luminance(rgba[o] as number, rgba[o + 1] as number, rgba[o + 2] as number));
  }
  samples.sort((a, b) => a - b);
  const idx = Math.min(samples.length - 1, Math.max(0, Math.floor((percentile / 100) * samples.length)));
  return samples[idx] as number;
}

/**
 * Mutates `rgba` in place (RGBA, 4 bytes/pixel) applying the whiten+contrast
 * transform. Returns the same array for convenience.
 */
export function cleanupSignaturePixels(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  opts: SignatureCleanupOptions = {},
): Uint8ClampedArray {
  const { whitePercentile, inkThreshold, inkBoost } = { ...DEFAULTS, ...opts };
  const pixelCount = width * height;
  if (pixelCount === 0) return rgba;

  const whiteRef = Math.max(1, estimateWhiteReference(rgba, pixelCount, whitePercentile));
  const scale = 255 / whiteRef;

  for (let i = 0; i < pixelCount; i += 1) {
    const o = i * 4;
    const r = rgba[o] as number;
    const g = rgba[o + 1] as number;
    const b = rgba[o + 2] as number;
    const lum = luminance(r, g, b);

    // Stretch so the estimated paper tone becomes pure white.
    let factor = scale;
    if (lum < inkThreshold) {
      // Ink pixels: stretch AND push further down for contrast, proportional
      // to how far below the threshold they already are.
      const darkness = 1 - lum / inkThreshold; // 0 at threshold, →1 for very dark ink
      factor = scale * (1 - inkBoost * darkness);
    }

    rgba[o] = clampByte(r * factor);
    rgba[o + 1] = clampByte(g * factor);
    rgba[o + 2] = clampByte(b * factor);
    // alpha (o+3) untouched
  }

  return rgba;
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/** Canvas wrapper: clean up a decoded image bitmap and return a JPEG blob. */
export async function cleanupSignatureImage(
  bitmap: ImageBitmap,
  opts?: SignatureCleanupOptions,
): Promise<{ blob: Blob; width: number; height: number }> {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create a drawing canvas.');
  ctx.drawImage(bitmap, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  cleanupSignaturePixels(imageData.data, canvas.width, canvas.height, opts);
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new Error('The cleaned-up signature could not be encoded.');
  return { blob, width: bitmap.width, height: bitmap.height };
}
