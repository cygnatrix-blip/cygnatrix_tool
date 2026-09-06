import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import { applyPdfEdits, fracPointToPdf, type Annotation } from '@/lib/pdf/edit';

// 1×1 transparent-ish PNG.
const PNG_1PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer;
}

async function makePdf(pages = 2, rotate = 0): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i += 1) {
    const page = doc.addPage([420, 595]);
    if (rotate) page.setRotation(degrees(rotate));
    page.drawText(`Original page ${i + 1}`, { x: 40, y: 540, size: 12, font });
  }
  return toArrayBuffer(await doc.save());
}

async function extractText(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, useWorkerFetch: false }).promise;
  let out = '';
  for (let i = 1; i <= doc.numPages; i += 1) {
    const content = await (await doc.getPage(i)).getTextContent();
    out += content.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n';
  }
  await doc.destroy();
  return out;
}

describe('applyPdfEdits', () => {
  it('stamps text, boxes, ink and an image without changing page count', async () => {
    const src = await makePdf(2);
    const annotations: Annotation[] = [
      { id: '1', page: 1, type: 'text', x: 0.1, y: 0.1, text: 'APPROVED', sizePt: 20, color: '#ff0000', font: 'sans', bold: true },
      { id: '2', page: 1, type: 'whiteout', x: 0.1, y: 0.3, w: 0.3, h: 0.05, color: '#ffffff' },
      { id: '3', page: 1, type: 'highlight', x: 0.1, y: 0.4, w: 0.4, h: 0.03, color: '#ffff00', opacity: 0.35 },
      { id: '4', page: 2, type: 'rect', x: 0.2, y: 0.2, w: 0.3, h: 0.2, color: '#0000ff', outline: true, strokePt: 2 },
      { id: '5', page: 2, type: 'draw', points: [{ x: 0.1, y: 0.1 }, { x: 0.3, y: 0.2 }, { x: 0.5, y: 0.1 }], color: '#00aa00', strokePt: 3 },
      { id: '6', page: 2, type: 'image', x: 0.6, y: 0.6, w: 0.2, h: 0.1, data: PNG_1PX },
    ];

    const { bytes, warnings } = await applyPdfEdits(src, annotations);
    expect(warnings).toHaveLength(0);

    const reopened = await PDFDocument.load(bytes);
    expect(reopened.getPageCount()).toBe(2);

    const text = await extractText(bytes);
    expect(text).toContain('APPROVED');
    expect(text).toContain('Original page 1');
  });

  it('converts the rupee sign to "Rs." and warns about characters it cannot draw', async () => {
    const src = await makePdf(1);
    const { bytes, warnings } = await applyPdfEdits(src, [
      { id: 'a', page: 1, type: 'text', x: 0.1, y: 0.5, text: '₹1,200 paid 你好', sizePt: 14, color: '#000000', font: 'sans', bold: false },
    ]);
    const text = await extractText(bytes);
    expect(text).toContain('Rs.1,200');
    expect(warnings.join(' ')).toMatch(/你|好/);
  });

  it('skips empty text and returns the document unchanged', async () => {
    const src = await makePdf(3);
    const { bytes, warnings } = await applyPdfEdits(src, [
      { id: 'x', page: 2, type: 'text', x: 0.2, y: 0.2, text: '   ', sizePt: 12, color: '#000000', font: 'sans', bold: false },
    ]);
    expect(warnings).toHaveLength(0);
    const reopened = await PDFDocument.load(bytes);
    expect(reopened.getPageCount()).toBe(3);
  });

  it('throws when an annotation points at a missing page', async () => {
    const src = await makePdf(1);
    await expect(
      applyPdfEdits(src, [
        { id: 'z', page: 5, type: 'whiteout', x: 0.1, y: 0.1, w: 0.2, h: 0.2, color: '#ffffff' },
      ]),
    ).rejects.toThrow(/page 5/);
  });

  it('applies edits to a rotated page and keeps the original content readable', async () => {
    const src = await makePdf(1, 90);
    const { bytes } = await applyPdfEdits(src, [
      { id: 'r', page: 1, type: 'text', x: 0.1, y: 0.1, text: 'SIGNED', sizePt: 16, color: '#000000', font: 'sans', bold: false },
    ]);
    const text = await extractText(bytes);
    expect(text).toContain('SIGNED');
    expect(text).toContain('Original page 1');
  });
});

describe('fracPointToPdf', () => {
  const W = 200;
  const H = 100;

  it('maps corners for an unrotated page (origin bottom-left)', () => {
    expect(fracPointToPdf(0, W, H, 0, 0)).toEqual({ x: 0, y: 100 });
    expect(fracPointToPdf(0, W, H, 1, 1)).toEqual({ x: 200, y: 0 });
    expect(fracPointToPdf(0, W, H, 0.5, 0.5)).toEqual({ x: 100, y: 50 });
  });

  it('maps corners for 90, 180 and 270 degree rotations', () => {
    expect(fracPointToPdf(90, W, H, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(fracPointToPdf(90, W, H, 1, 1)).toEqual({ x: 200, y: 100 });
    expect(fracPointToPdf(180, W, H, 0, 0)).toEqual({ x: 200, y: 0 });
    expect(fracPointToPdf(270, W, H, 1, 1)).toEqual({ x: 0, y: 0 });
  });
});
