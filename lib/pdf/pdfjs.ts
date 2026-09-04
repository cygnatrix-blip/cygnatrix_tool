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

/**
 * Turn a pdf.js load failure into a clear, actionable message instead of a raw
 * technical string (or a misleading generic guess). pdf.js tags its own
 * exceptions with a stable `.name`, so we can tell "this needs a password"
 * apart from "this file is genuinely broken" instead of assuming one or the
 * other for every failure.
 */
export function describePdfLoadError(e: unknown, fallback?: string): string {
  const name = e instanceof Error ? e.name : undefined;
  if (name === 'PasswordException') {
    return 'This PDF is password-protected. Remove the password first with our Protect / Unlock PDF tool, then try again.';
  }
  if (name === 'InvalidPDFException') {
    return 'This doesn’t look like a valid PDF. It may be corrupted, or a different file type renamed to .pdf.';
  }
  if (e instanceof Error && e.message) return e.message;
  return fallback ?? 'This PDF could not be read. It may be corrupted or in an unsupported format.';
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
