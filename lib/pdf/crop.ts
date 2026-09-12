'use client';

/**
 * Crop PDF pages by setting each page's CropBox — the same lossless technique
 * Adobe Acrobat's crop tool uses. Content, text and vector quality are
 * untouched; PDF viewers and printers simply clip to the new box. This is
 * fast, keeps text selectable, and (unlike rasterizing) never enlarges the
 * file.
 *
 * Geometry contract matches lib/pdf/edit.ts: a crop box is expressed as
 * fractions (0..1) of the *displayed* page (pdf.js render, page rotation
 * already applied, origin top-left) — {@link fracBoxToPdf} converts to PDF
 * user-space points, accounting for /Rotate.
 */

import { PDFDocument } from 'pdf-lib';
import { fracBoxToPdf, type Rotation } from './edit';

export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Keyed by 1-based page number. A page absent from the map is left uncropped. */
export type CropMap = Record<number, CropBox>;

export async function cropPdf(data: ArrayBuffer, boxes: CropMap): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data);
  const pages = doc.getPages();
  doc.setProducer('Cygnatrix Tools');

  let applied = 0;
  for (const [key, box] of Object.entries(boxes)) {
    const pageNumber = Number(key);
    const page = pages[pageNumber - 1];
    if (!page) continue;
    if (box.w <= 0.01 || box.h <= 0.01) continue; // degenerate box — ignore rather than blank the page

    const { width: pw, height: ph } = page.getSize();
    const rotation = ((((page.getRotation().angle % 360) + 360) % 360) || 0) as Rotation;
    const rect = fracBoxToPdf(rotation, pw, ph, box.x, box.y, box.w, box.h);
    if (rect.width < 1 || rect.height < 1) continue;
    page.setCropBox(rect.x, rect.y, rect.width, rect.height);
    applied += 1;
  }
  if (applied === 0) throw new Error('No crop was applied — adjust the crop area first.');

  return doc.save();
}
