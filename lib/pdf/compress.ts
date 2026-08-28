'use client';

import { PDFDocument } from 'pdf-lib';
import { pdfToImages } from './to-images';

export type CompressLevel = 'light' | 'balanced' | 'strong';

interface LevelSettings {
  dpi: number;
  quality: number;
  rasterise: boolean;
}

const LEVELS: Record<CompressLevel, LevelSettings> = {
  light: { dpi: 150, quality: 0.82, rasterise: false },
  balanced: { dpi: 144, quality: 0.7, rasterise: true },
  strong: { dpi: 110, quality: 0.55, rasterise: true },
};

export interface CompressResult {
  bytes: Uint8Array;
  originalSize: number;
  newSize: number;
  rasterised: boolean;
}

/**
 * Best-effort in-browser PDF compression.
 *  - light: strip metadata, rewrite with object streams (keeps text selectable).
 *  - balanced/strong: additionally rasterise pages to downsampled JPEGs.
 * There is no Ghostscript in the browser, so this is a pragmatic approximation.
 */
export async function compressPdf(
  data: ArrayBuffer,
  level: CompressLevel,
  onProgress?: (done: number, total: number) => void,
): Promise<CompressResult> {
  const originalSize = data.byteLength;
  const settings = LEVELS[level];

  // Always: metadata strip + object streams.
  const stripped = await PDFDocument.load(data.slice(0));
  stripped.setTitle('');
  stripped.setAuthor('');
  stripped.setSubject('');
  stripped.setKeywords([]);
  stripped.setProducer('Cygnatrix Tools');
  stripped.setCreator('Cygnatrix Tools');

  if (!settings.rasterise) {
    const bytes = await stripped.save({ useObjectStreams: true });
    return { bytes, originalSize, newSize: bytes.byteLength, rasterised: false };
  }

  // Rasterise every page and rebuild.
  const images = await pdfToImages(
    data.slice(0),
    { dpi: settings.dpi, quality: settings.quality, mime: 'image/jpeg' },
    onProgress,
  );

  const rebuilt = await PDFDocument.create();
  rebuilt.setProducer('Cygnatrix Tools');
  for (const img of images) {
    const jpg = await rebuilt.embedJpg(await img.blob.arrayBuffer());
    const page = rebuilt.addPage([img.width, img.height]);
    page.drawImage(jpg, { x: 0, y: 0, width: img.width, height: img.height });
  }

  const bytes = await rebuilt.save({ useObjectStreams: true });

  // If rasterising made it bigger, fall back to the stripped-but-intact version.
  if (bytes.byteLength >= originalSize) {
    const fallback = await stripped.save({ useObjectStreams: true });
    if (fallback.byteLength < bytes.byteLength) {
      return { bytes: fallback, originalSize, newSize: fallback.byteLength, rasterised: false };
    }
  }
  return { bytes, originalSize, newSize: bytes.byteLength, rasterised: true };
}
