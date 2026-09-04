'use client';

import { PDFDocument } from 'pdf-lib';

/**
 * One primitive powers all three Organize actions:
 *  - reorder: pass every original page number, in the new order
 *  - delete:  pass every page number except the ones removed, in original order
 *  - extract: pass only the selected page numbers, in original order — as a new file
 * `order` is 1-based, referencing pages in the source document.
 */
export async function organizePdf(data: ArrayBuffer, order: number[]): Promise<Uint8Array> {
  if (order.length === 0) throw new Error('Keep at least one page.');
  const source = await PDFDocument.load(data);
  const total = source.getPageCount();
  for (const n of order) {
    if (!Number.isInteger(n) || n < 1 || n > total) {
      throw new Error(`Page ${n} does not exist in this document.`);
    }
  }

  const out = await PDFDocument.create();
  out.setProducer('Cygnatrix Tools');
  const copied = await out.copyPages(
    source,
    order.map((n) => n - 1),
  );
  copied.forEach((p) => out.addPage(p));
  return out.save();
}
