'use client';

import { CR80, A4_SHEET } from '@/config/cr80';

const PT_PER_MM = 72 / 25.4;
const mmToPt = (mm: number) => mm * PT_PER_MM;

export interface A4PdfLayoutPt {
  pageWidth: number;
  pageHeight: number;
  cardWidth: number;
  cardHeight: number;
  /** PDF coordinates: origin is the bottom-left of the page. */
  front: { x: number; y: number };
  back: { x: number; y: number };
}

/**
 * Pure: where the two cards sit on the A4 page, in PDF points.
 *
 * Placing them by physical size rather than by pixels is what makes the sheet
 * print true — a card comes out 85.6 × 54 mm whatever the printer's DPI, with
 * no reliance on "print at 100%" scaling a raster correctly. Testable.
 */
export function computeA4PdfLayout(): A4PdfLayoutPt {
  const pageWidth = mmToPt(A4_SHEET.widthMM);
  const pageHeight = mmToPt(A4_SHEET.heightMM);
  const cardWidth = mmToPt(CR80.widthMM);
  const cardHeight = mmToPt(CR80.heightMM);
  const gap = mmToPt(A4_SHEET.gapMM);

  const x0 = (pageWidth - (cardWidth * 2 + gap)) / 2;
  // PDF's origin is bottom-left, so a top margin counts down from the height.
  const y = pageHeight - mmToPt(A4_SHEET.topMarginMM) - cardHeight;

  return {
    pageWidth,
    pageHeight,
    cardWidth,
    cardHeight,
    front: { x: x0, y },
    back: { x: x0 + cardWidth + gap, y },
  };
}

async function canvasToJpegBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.94));
  if (!blob) throw new Error('Could not encode the card for the print sheet.');
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * An A4 PDF with the front and back at exact CR80 size, plus dashed cut guides
 * drawn as vectors so they stay crisp at any zoom or print resolution.
 */
export async function buildA4SheetPdf(front: HTMLCanvasElement, back: HTMLCanvasElement): Promise<Blob> {
  const { PDFDocument, rgb } = await import('pdf-lib');
  const layout = computeA4PdfLayout();

  const doc = await PDFDocument.create();
  const page = doc.addPage([layout.pageWidth, layout.pageHeight]);

  const [frontImg, backImg] = await Promise.all([
    doc.embedJpg(await canvasToJpegBytes(front)),
    doc.embedJpg(await canvasToJpegBytes(back)),
  ]);

  const guide = rgb(0.6, 0.6, 0.6);
  for (const [img, pos] of [[frontImg, layout.front], [backImg, layout.back]] as const) {
    page.drawImage(img, { x: pos.x, y: pos.y, width: layout.cardWidth, height: layout.cardHeight });
    page.drawRectangle({
      x: pos.x,
      y: pos.y,
      width: layout.cardWidth,
      height: layout.cardHeight,
      borderColor: guide,
      borderWidth: 0.5,
      borderDashArray: [3, 2],
    });
  }

  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}
