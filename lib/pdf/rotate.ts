'use client';

import { PDFDocument, degrees } from 'pdf-lib';

export type RotateStep = 90 | 180 | 270;

/**
 * Rotate pages by a relative amount (added to whatever rotation the page already has).
 * `pages` is 1-based; omit to rotate every page.
 */
export async function rotatePdf(
  data: ArrayBuffer,
  rotations: Map<number, RotateStep> | RotateStep,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data);
  const pages = doc.getPages();

  pages.forEach((page, i) => {
    const pageNumber = i + 1;
    const delta = typeof rotations === 'number' ? rotations : rotations.get(pageNumber);
    if (!delta) return;
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + delta + 360) % 360));
  });

  return doc.save();
}
