'use client';

/**
 * Lazy pdf.js loader. The worker is bundled as an asset by Next and served from
 * our own origin (CSP-safe). Import this only from client components.
 */
import type { PDFDocumentProxy } from 'pdfjs-dist';

let libPromise: Promise<typeof import('pdfjs-dist')> | null = null;

export async function getPdfjs() {
  if (!libPromise) {
    libPromise = import('pdfjs-dist').then((pdfjs) => {
      // Next bundles this as a same-origin asset (CSP-safe worker-src 'self').
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return libPromise;
}

export async function loadPdfDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfjs();
  return pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true }).promise;
}

/** A PDF with no extractable text on any sampled page is almost certainly a scan. */
export async function hasTextLayer(doc: PDFDocumentProxy, sample = 3): Promise<boolean> {
  const pagesToCheck = Math.min(sample, doc.numPages);
  for (let i = 1; i <= pagesToCheck; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it) => ('str' in it ? it.str : '')).join('').trim();
    if (text.length > 8) return true;
  }
  return false;
}
