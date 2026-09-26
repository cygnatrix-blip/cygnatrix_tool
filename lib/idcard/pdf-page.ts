'use client';

import { loadPdfDocument, passwordExceptionKind } from '@/lib/pdf/pdfjs';

export interface RenderedPdfPage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export type PdfRenderOutcome =
  | { status: 'ok'; pages: RenderedPdfPage[] }
  | { status: 'password'; kind: 'required' | 'incorrect' };

/** Only the first couple of pages can hold the two sides of a card. */
const MAX_PAGES = 2;

/**
 * Renders the first pages of a PDF at a high scale (default 3× — well above
 * what a 300 DPI CR80 crop of a page region needs).
 *
 * Both sides of a card are not always on one page: an e-Aadhaar prints them
 * side by side in the bottom quarter of a single page, while an official
 * Ayushman download puts the front on page 1 and the back on page 2. Rendering
 * up to two pages lets the caller handle either without guessing.
 *
 * Reads the file fresh each call rather than caching an ArrayBuffer, because
 * pdf.js transfers/detaches the buffer it's given — required for the password
 * retry flow, where the same source file is re-read on every attempt.
 */
export async function renderPdfPages(
  file: Blob,
  opts: { scale?: number; password?: string } = {},
): Promise<PdfRenderOutcome> {
  const scale = opts.scale ?? 3;
  const data = await file.arrayBuffer();
  try {
    const doc = await loadPdfDocument(data, opts.password);
    const count = Math.min(doc.numPages, MAX_PAGES);
    const pages: RenderedPdfPage[] = [];
    for (let n = 1; n <= count; n += 1) {
      const page = await doc.getPage(n);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Your browser could not create a drawing canvas.');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push({ canvas, width: canvas.width, height: canvas.height });
    }
    await doc.destroy();
    return { status: 'ok', pages };
  } catch (e) {
    const kind = passwordExceptionKind(e);
    if (kind) return { status: 'password', kind };
    throw e;
  }
}
