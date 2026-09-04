'use client';

import { PDFDocument, type PDFImage } from 'pdf-lib';
import { decodeImage, drawToBlob } from '@/lib/image/canvas';

export type PageSizeOption = 'a4' | 'letter' | 'fit';
export type Orientation = 'portrait' | 'landscape';

export interface ImageToPdfOptions {
  pageSize: PageSizeOption;
  orientation: Orientation;
  /** Margin in points (72pt = 1in) applied on all sides. Ignored for 'fit'. */
  marginPt: number;
}

// Points at 72 DPI.
const A4: [number, number] = [595.28, 841.89];
const LETTER: [number, number] = [612, 792];
/** "Fit to image" renders 1 image px = 1pt / (96/72) so a 96 DPI photo prints near life-size. */
const FIT_DPI = 96;

function pageDimensions(size: PageSizeOption, orientation: Orientation): [number, number] | null {
  if (size === 'fit') return null;
  const [w, h] = size === 'a4' ? A4 : LETTER;
  return orientation === 'landscape' ? [h, w] : [w, h];
}

export async function imagesToPdf(
  files: File[],
  opts: ImageToPdfOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  if (files.length === 0) throw new Error('Add at least one image.');

  const doc = await PDFDocument.create();
  doc.setProducer('Cygnatrix Tools');
  doc.setCreator('Cygnatrix Tools');

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i]!;
    let decoded;
    try {
      decoded = await decodeImage(file);
    } catch {
      throw new Error(`"${file.name}" could not be read as an image.`);
    }

    // Normalise to JPEG so pdf-lib can always embed it, regardless of source format.
    const jpegBlob = await drawToBlob(decoded.bitmap, {
      width: decoded.width,
      height: decoded.height,
      mime: 'image/jpeg',
      quality: 0.92,
    });
    decoded.bitmap.close();
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    const embedded: PDFImage = await doc.embedJpg(jpegBytes);

    const fixed = pageDimensions(opts.pageSize, opts.orientation);
    const imgRatio = embedded.width / embedded.height;

    let pageW: number;
    let pageH: number;
    if (fixed) {
      [pageW, pageH] = fixed;
    } else {
      // Fit-to-image: page matches the photo's own aspect ratio at FIT_DPI.
      pageW = (embedded.width / FIT_DPI) * 72;
      pageH = (embedded.height / FIT_DPI) * 72;
    }

    const page = doc.addPage([pageW, pageH]);
    const margin = fixed ? Math.max(0, opts.marginPt) : 0;
    const availW = Math.max(1, pageW - margin * 2);
    const availH = Math.max(1, pageH - margin * 2);
    const availRatio = availW / availH;

    let drawW: number;
    let drawH: number;
    if (imgRatio > availRatio) {
      drawW = availW;
      drawH = availW / imgRatio;
    } else {
      drawH = availH;
      drawW = availH * imgRatio;
    }

    page.drawImage(embedded, {
      x: (pageW - drawW) / 2,
      y: (pageH - drawH) / 2,
      width: drawW,
      height: drawH,
    });

    onProgress?.(i + 1, files.length);
  }

  return doc.save();
}
