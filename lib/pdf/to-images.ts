'use client';

import { loadPdfDocument } from './pdfjs';

export interface RenderedPage {
  pageNumber: number;
  blob: Blob;
  width: number;
  height: number;
}

export interface ToImagesOptions {
  dpi: number;
  quality: number; // 0..1 for JPEG
  mime: 'image/jpeg' | 'image/png';
  pages?: number[]; // 1-based; default all
}

const BASE_DPI = 72;

export async function pdfToImages(
  data: ArrayBuffer,
  opts: ToImagesOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<RenderedPage[]> {
  const doc = await loadPdfDocument(data.slice(0));
  const pageNums = opts.pages?.length ? opts.pages : range(1, doc.numPages);
  const scale = opts.dpi / BASE_DPI;
  const results: RenderedPage[] = [];

  for (let i = 0; i < pageNums.length; i += 1) {
    const pageNumber = pageNums[i]!;
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser could not create a drawing canvas.');

    if (opts.mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to encode page image.'))),
        opts.mime,
        opts.mime === 'image/jpeg' ? opts.quality : undefined,
      );
    });

    results.push({ pageNumber, blob, width: canvas.width, height: canvas.height });
    canvas.width = 0;
    canvas.height = 0;
    onProgress?.(i + 1, pageNums.length);
  }

  await doc.destroy();
  return results;
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
