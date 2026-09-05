'use client';

import { compressToTarget, type Encoder } from './compress-to-target-core';
import { cleanupSignaturePixels } from './signature-cleanup';

/** A crop window in the *source* image's own pixel coordinates. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExamProcessOptions {
  crop: CropRect;
  targetWidth: number;
  targetHeight: number;
  minBytes: number;
  maxBytes: number;
  /** Applies the paper-background whitening pass before compressing. */
  isSignature?: boolean;
}

export interface ExamProcessResult {
  blob: Blob;
  width: number;
  height: number;
  bytes: number;
  meetsWidth: boolean;
  meetsHeight: boolean;
  meetsSize: boolean;
  passesAll: boolean;
  summary: string;
}

/**
 * Crop + resize to the exact required pixel dimensions, then binary-search
 * JPEG quality (reusing the Phase 2A engine) to land inside [minBytes,
 * maxBytes]. Dimensions are a hard requirement for exam forms, so — unlike
 * the general Compress-to-Size tool — this never downscales past the exact
 * target size to chase a byte count; if the size can't be hit at the
 * required dimensions, it says so plainly instead of silently deviating from
 * the spec.
 */
export async function processExamImage(bitmap: ImageBitmap, opts: ExamProcessOptions): Promise<ExamProcessResult> {
  const canvas = document.createElement('canvas');
  canvas.width = opts.targetWidth;
  canvas.height = opts.targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create a drawing canvas.');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, opts.targetWidth, opts.targetHeight);
  ctx.drawImage(
    bitmap,
    opts.crop.x,
    opts.crop.y,
    opts.crop.width,
    opts.crop.height,
    0,
    0,
    opts.targetWidth,
    opts.targetHeight,
  );

  if (opts.isSignature) {
    const imageData = ctx.getImageData(0, 0, opts.targetWidth, opts.targetHeight);
    cleanupSignaturePixels(imageData.data, opts.targetWidth, opts.targetHeight, {});
    ctx.putImageData(imageData, 0, 0);
  }

  const encode: Encoder = async (quality) => {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode this image.'))), 'image/jpeg', quality);
    });
    return { bytes: blob.size, blob };
  };

  const result = await compressToTarget(encode, {
    targetBytes: opts.maxBytes,
    minBytes: opts.minBytes,
    originalWidth: opts.targetWidth,
    originalHeight: opts.targetHeight,
    maxDownscaleRounds: 0, // the pixel dimensions are a hard requirement — never shrink them
  });

  canvas.width = 0;
  canvas.height = 0;

  const meetsWidth = result.finalWidth === opts.targetWidth;
  const meetsHeight = result.finalHeight === opts.targetHeight;
  const meetsSize = result.finalBytes >= opts.minBytes && result.finalBytes <= opts.maxBytes;

  return {
    blob: result.blob,
    width: result.finalWidth,
    height: result.finalHeight,
    bytes: result.finalBytes,
    meetsWidth,
    meetsHeight,
    meetsSize,
    passesAll: meetsWidth && meetsHeight && meetsSize,
    summary: result.summary,
  };
}
