import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { runsFromTextContent } from '@/lib/pdf/text-runs';
import { fracPointToPdf, pdfPointToFrac, type Rotation } from '@/lib/pdf/edit';

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer;
}

describe('pdfPointToFrac', () => {
  const W = 200;
  const H = 100;

  it('is the exact inverse of fracPointToPdf for every rotation', () => {
    for (const rot of [0, 90, 180, 270] as Rotation[]) {
      const cases: [number, number][] = [
        [0.1, 0.2],
        [0.5, 0.5],
        [0.9, 0.75],
      ];
      for (const [fx, fy] of cases) {
        const p = fracPointToPdf(rot, W, H, fx, fy);
        const back = pdfPointToFrac(rot, W, H, p.x, p.y);
        expect(back.fx).toBeCloseTo(fx, 6);
        expect(back.fy).toBeCloseTo(fy, 6);
      }
    }
  });
});

describe('runsFromTextContent', () => {
  it('turns pdf.js text items into fractional bounding boxes', () => {
    // One item: 24pt text whose baseline starts at (60, 700) on a 600×800 page.
    const content = {
      items: [
        {
          str: 'Invoice total',
          transform: [24, 0, 0, 24, 60, 700],
          width: 150,
          height: 24,
          fontName: 'g_d0_f1',
        },
        { str: '   ', transform: [24, 0, 0, 24, 0, 0], width: 5, height: 24, fontName: 'g_d0_f1' },
      ],
      styles: { g_d0_f1: { fontFamily: 'serif' } },
    };

    const runs = runsFromTextContent(content, { page: 3, pageW: 600, pageH: 800, rotation: 0 });
    expect(runs).toHaveLength(1); // whitespace-only item skipped
    const r = runs[0]!;
    expect(r.page).toBe(3);
    expect(r.text).toBe('Invoice total');
    expect(r.sizePt).toBeCloseTo(24, 1);
    expect(r.font).toBe('serif');
    expect(r.x).toBeCloseTo(60 / 600, 3);
    expect(r.w).toBeCloseTo(150 / 600, 3);
    // top of the box is above the baseline: (800 - (700 + 0.82*24)) / 800
    expect(r.y).toBeCloseTo((800 - (700 + 0.82 * 24)) / 800, 3);
  });

  it('classifies mono and bold fonts from the style family string', () => {
    const content = {
      items: [{ str: 'x', transform: [10, 0, 0, 10, 0, 0], width: 6, height: 10, fontName: 'f1' }],
      styles: { f1: { fontFamily: 'Courier New Bold, monospace' } },
    };
    const [r] = runsFromTextContent(content, { page: 1, pageW: 100, pageH: 100, rotation: 0 });
    expect(r!.font).toBe('mono');
    expect(r!.bold).toBe(true);
  });
});

describe('extractTextRuns (integration)', () => {
  it('reads a run back from a real PDF via pdf.js', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([600, 800]);
    page.drawText('Hello World', { x: 50, y: 700, size: 24, font });
    const bytes = await doc.save();

    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdf = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, useWorkerFetch: false })
      .promise;
    const p = await pdf.getPage(1);
    const view = p.view as number[];
    const content = await p.getTextContent();
    const runs = runsFromTextContent(content as never, {
      page: 1,
      pageW: (view[2] ?? 0) - (view[0] ?? 0),
      pageH: (view[3] ?? 0) - (view[1] ?? 0),
      rotation: 0,
    });
    await pdf.destroy();

    const hit = runs.find((r) => r.text.includes('Hello'));
    expect(hit).toBeTruthy();
    expect(hit!.sizePt).toBeGreaterThan(18);
    expect(hit!.sizePt).toBeLessThan(30);
    expect(hit!.x).toBeGreaterThan(0.03);
    expect(hit!.x).toBeLessThan(0.2);
    expect(hit!.y).toBeGreaterThan(0);
    expect(hit!.y).toBeLessThan(0.25);
  });
});
