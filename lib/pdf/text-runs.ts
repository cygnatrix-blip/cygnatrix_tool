'use client';

/**
 * Read a PDF's existing text as discrete runs (a line fragment with a position,
 * size and rough font) so the editor's "Edit text" mode can offer a click target
 * over each one: click → cover it with a background-matched box + drop an
 * editable text field pre-filled with the same words, size and font.
 *
 * True in-place text editing (re-flowing the original glyphs) is not possible in
 * a PDF; this "cover and re-type" flow is what every browser PDF editor does.
 */

import type { FontFamily, Rotation } from './edit';
import { pdfPointToFrac } from './edit';

export interface TextRun {
  /** 1-based page number. */
  page: number;
  text: string;
  /** bbox as fractions of the displayed (rotation-applied) page, top-left origin. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** font size in PDF points. */
  sizePt: number;
  font: FontFamily;
  bold: boolean;
}

interface RawItem {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
  fontName?: string;
}
interface RawTextContent {
  items: unknown[];
  styles?: Record<string, { fontFamily?: string } | undefined>;
}

function classifyFont(fontFamily: string | undefined): { font: FontFamily; bold: boolean } {
  const s = (fontFamily ?? '').toLowerCase();
  const bold = /bold|black|heavy|semibold|\bsb\b/.test(s);
  let font: FontFamily = 'sans';
  if (/mono|courier|consol|typewriter/.test(s)) font = 'mono';
  else if (/times|georgia|garamond|roman|minion|serif|book antiqua|cambria/.test(s) && !/sans/.test(s)) {
    font = 'serif';
  }
  return { font, bold };
}

/**
 * Pure geometry + classification step, split out so it can be unit-tested with a
 * text-content object from any pdf.js build.
 */
export function runsFromTextContent(
  content: RawTextContent,
  opts: { page: number; pageW: number; pageH: number; rotation: Rotation },
): TextRun[] {
  const { page, pageW, pageH, rotation } = opts;
  const styles = content.styles ?? {};
  const runs: TextRun[] = [];

  for (const raw of content.items as RawItem[]) {
    if (!raw || typeof raw.str !== 'string' || raw.str.trim() === '') continue;
    const t = raw.transform ?? [1, 0, 0, 1, 0, 0];
    const originX = t[4] ?? 0;
    const baselineY = t[5] ?? 0;
    const sizePt = Math.hypot(t[2] ?? 0, t[3] ?? 0) || raw.height || 10;
    const width = raw.width || sizePt * raw.str.length * 0.5;

    // PDF-space box (origin bottom-left): baseline sits ~22% above the descender.
    const a = pdfPointToFrac(rotation, pageW, pageH, originX, baselineY - sizePt * 0.22);
    const b = pdfPointToFrac(rotation, pageW, pageH, originX + width, baselineY + sizePt * 0.82);
    const { font, bold } = classifyFont(styles[raw.fontName ?? '']?.fontFamily);

    runs.push({
      page,
      text: raw.str,
      x: Math.min(a.fx, b.fx),
      y: Math.min(a.fy, b.fy),
      w: Math.abs(a.fx - b.fx),
      h: Math.abs(a.fy - b.fy),
      sizePt,
      font,
      bold,
    });
  }
  return runs;
}

/** Browser entry: pull text runs for the given 1-based page numbers. */
export async function extractTextRuns(
  data: ArrayBuffer,
  pageNumbers: number[],
): Promise<TextRun[]> {
  const { getPdfjs } = await import('./pdfjs');
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({ data: data.slice(0), isEvalSupported: false, useSystemFonts: true })
    .promise;
  const out: TextRun[] = [];
  try {
    for (const n of pageNumbers) {
      if (!Number.isInteger(n) || n < 1 || n > doc.numPages) continue;
      const pageProxy = await doc.getPage(n);
      const view = pageProxy.view as number[];
      const pageW = (view[2] ?? 0) - (view[0] ?? 0);
      const pageH = (view[3] ?? 0) - (view[1] ?? 0);
      const rotation = ((((pageProxy.rotate ?? 0) % 360) + 360) % 360) as Rotation;
      const content = (await pageProxy.getTextContent()) as unknown as RawTextContent;
      out.push(...runsFromTextContent(content, { page: n, pageW, pageH, rotation }));
      pageProxy.cleanup();
    }
  } finally {
    await doc.destroy();
  }
  return out;
}
