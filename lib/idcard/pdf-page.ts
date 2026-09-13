'use client';

import { loadPdfDocument, passwordExceptionKind } from '@/lib/pdf/pdfjs';

export interface RenderedPdfPage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export type PdfRenderOutcome =
  | { status: 'ok'; page: RenderedPdfPage }
  | { status: 'password'; kind: 'required' | 'incorrect' };

/**
 * Renders page 1 of a PDF at a high scale (default 3× — well above what a 300
 * DPI CR80 crop of a small page region needs). Reads the file fresh each call
 * rather than caching an ArrayBuffer, because pdf.js transfers/detaches the
 * buffer it's given — required for the password retry flow, where the same
 * source file is re-read on every attempt.
 */
export async function renderPdfPage1(
  file: Blob,
  opts: { scale?: number; password?: string } = {},
): Promise<PdfRenderOutcome> {
  const scale = opts.scale ?? 3;
  const data = await file.arrayBuffer();
  try {
    const doc = await loadPdfDocument(data, opts.password);
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser could not create a drawing canvas.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    await doc.destroy();
    return { status: 'ok', page: { canvas, width: canvas.width, height: canvas.height } };
  } catch (e) {
    const kind = passwordExceptionKind(e);
    if (kind) return { status: 'password', kind };
    throw e;
  }
}
