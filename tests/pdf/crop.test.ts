import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import { cropPdf } from '@/lib/pdf/crop';
import { fracBoxToPdf } from '@/lib/pdf/edit';

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer;
}

async function makePdf(opts: { pages?: number; size?: [number, number]; rotate?: number } = {}): Promise<ArrayBuffer> {
  const { pages = 2, size = [400, 600], rotate = 0 } = opts;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i += 1) {
    const page = doc.addPage(size);
    if (rotate) page.setRotation(degrees(rotate));
    page.drawText(`Page ${i + 1}`, { x: 20, y: size[1] - 40, size: 12, font });
  }
  return toArrayBuffer(await doc.save());
}

describe('cropPdf', () => {
  it('sets the crop box for the requested page and leaves others at full size', async () => {
    const src = await makePdf({ pages: 2, size: [400, 600] });
    const bytes = await cropPdf(src, { 1: { x: 0.25, y: 0.1, w: 0.5, h: 0.5 } });

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(2);

    const p1 = doc.getPage(0).getCropBox();
    expect(p1.x).toBeCloseTo(100, 3);
    expect(p1.y).toBeCloseTo(240, 3);
    expect(p1.width).toBeCloseTo(200, 3);
    expect(p1.height).toBeCloseTo(300, 3);

    // Untouched page keeps a crop box matching the full media box.
    const p2 = doc.getPage(1).getCropBox();
    const media2 = doc.getPage(1).getMediaBox();
    expect(p2.width).toBeCloseTo(media2.width, 3);
    expect(p2.height).toBeCloseTo(media2.height, 3);
  });

  it('accounts for page rotation using the same geometry as the PDF editor', async () => {
    const [pw, ph] = [400, 600];
    const src = await makePdf({ pages: 1, size: [pw, ph], rotate: 90 });
    const box = { x: 0.1, y: 0.2, w: 0.6, h: 0.5 };
    const bytes = await cropPdf(src, { 1: box });

    const doc = await PDFDocument.load(bytes);
    const got = doc.getPage(0).getCropBox();
    const expected = fracBoxToPdf(90, pw, ph, box.x, box.y, box.w, box.h);
    expect(got.x).toBeCloseTo(expected.x, 3);
    expect(got.y).toBeCloseTo(expected.y, 3);
    expect(got.width).toBeCloseTo(expected.width, 3);
    expect(got.height).toBeCloseTo(expected.height, 3);
  });

  it('ignores a degenerate (near-zero) crop box on one page while still cropping a valid one', async () => {
    const src = await makePdf({ pages: 2, size: [400, 600] });
    const bytes = await cropPdf(src, {
      1: { x: 0.5, y: 0.5, w: 0.001, h: 0.5 }, // degenerate — ignored
      2: { x: 0.1, y: 0.1, w: 0.5, h: 0.5 }, // valid — applied
    });
    const doc = await PDFDocument.load(bytes);

    const box1 = doc.getPage(0).getCropBox();
    const media1 = doc.getPage(0).getMediaBox();
    expect(box1.width).toBeCloseTo(media1.width, 3);

    const box2 = doc.getPage(1).getCropBox();
    expect(box2.width).toBeCloseTo(200, 3);
    expect(box2.height).toBeCloseTo(300, 3);
  });

  it('throws when no page in the map produces a usable crop', async () => {
    const src = await makePdf({ pages: 1 });
    await expect(cropPdf(src, { 1: { x: 0, y: 0, w: 0.001, h: 0.001 } })).rejects.toThrow(/no crop/i);
    await expect(cropPdf(src, { 9: { x: 0, y: 0, w: 1, h: 1 } })).rejects.toThrow(/no crop/i);
  });
});
