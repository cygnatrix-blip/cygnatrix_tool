'use client';

import { decodeImage, drawToBlob, extensionFor, swapExtension, type ImageMime } from './canvas';
import { resolveTargetSize, type ResizeSpec } from './resize';

export interface ConvertOptions {
  to: ImageMime;
  quality?: number;
  background?: string;
  resize?: ResizeSpec;
}

export interface ConvertedImage {
  name: string;
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  newSize: number;
}

/**
 * The single engine behind Compress, Resize, JPG↔PNG, PNG→JPG and the WebP
 * converter. A from/to model means new format pairs need no new code.
 */
export async function convertImage(file: File, opts: ConvertOptions): Promise<ConvertedImage> {
  const { bitmap, width, height } = await decodeImage(file);

  const target = opts.resize
    ? resolveTargetSize({ width, height }, opts.resize)
    : { width, height };

  const blob = await drawToBlob(bitmap, {
    width: target.width,
    height: target.height,
    mime: opts.to,
    quality: opts.quality,
    background: opts.background,
  });
  bitmap.close();

  return {
    name: swapExtension(file.name, extensionFor(opts.to)),
    blob,
    width: target.width,
    height: target.height,
    originalSize: file.size,
    newSize: blob.size,
  };
}
