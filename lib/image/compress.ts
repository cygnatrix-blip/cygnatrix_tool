'use client';

import imageCompression from 'browser-image-compression';
import type { ImageMime } from './canvas';

export interface CompressImageOptions {
  quality: number; // 0..1
  maxWidthOrHeight?: number;
  targetSizeMB?: number;
  outputMime?: ImageMime;
}

export interface CompressedImage {
  name: string;
  blob: Blob;
  originalSize: number;
  newSize: number;
}

/**
 * Compress an image in a Web Worker (browser-image-compression). Falls back
 * gracefully to the original file if compression would enlarge it.
 */
export async function compressImageFile(
  file: File,
  opts: CompressImageOptions,
): Promise<CompressedImage> {
  const compressed = await imageCompression(file, {
    initialQuality: Math.min(1, Math.max(0.1, opts.quality)),
    maxSizeMB: opts.targetSizeMB ?? Number.MAX_SAFE_INTEGER,
    maxWidthOrHeight: opts.maxWidthOrHeight,
    useWebWorker: true,
    fileType: opts.outputMime,
    alwaysKeepResolution: !opts.maxWidthOrHeight,
  });

  const blob: Blob = compressed.size < file.size ? compressed : file;
  return {
    name: file.name,
    blob,
    originalSize: file.size,
    newSize: blob.size,
  };
}
