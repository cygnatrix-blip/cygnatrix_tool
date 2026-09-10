'use client';

import { PDFDocument } from 'pdf-lib';

export interface ScanPage {
  /** Processed page image, JPEG or PNG. */
  blob: Blob;
  width: number;
  height: number;
}

/**
 * One PDF page per scan, sized to the image's aspect ratio so the page is filled
 * edge to edge. Images are placed at ~150 DPI equivalent.
 */
export async function scansToPdf(pages: ScanPage[]): Promise<Uint8Array> {
  if (pages.length === 0) throw new Error('Add at least one page.');
  const doc = await PDFDocument.create();
  doc.setProducer('Cygnatrix Tools');
  doc.setCreator('Cygnatrix Tools');
  const DPI = 150;

  for (const page of pages) {
    const bytes = new Uint8Array(await page.blob.arrayBuffer());
    const image =
      page.blob.type === 'image/png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const wPt = (image.width / DPI) * 72;
    const hPt = (image.height / DPI) * 72;
    const p = doc.addPage([wPt, hPt]);
    p.drawImage(image, { x: 0, y: 0, width: wPt, height: hPt });
  }
  return doc.save();
}
