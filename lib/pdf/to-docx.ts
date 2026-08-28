'use client';

import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { loadPdfDocument, hasTextLayer } from './pdfjs';

export interface ToDocxResult {
  blob: Blob;
  isScanned: boolean;
  pageCount: number;
  wordCount: number;
}

interface Line {
  y: number;
  text: string;
  height: number;
}

/**
 * Extract the text layer of a PDF and rebuild it as a .docx. Groups text items
 * into lines by vertical position, lines into paragraphs by vertical gaps, and
 * promotes noticeably larger lines to headings. This is not OCR — a scanned PDF
 * yields no text and we say so in the output.
 */
export async function pdfToDocx(
  data: ArrayBuffer,
  onProgress?: (done: number, total: number) => void,
): Promise<ToDocxResult> {
  const doc = await loadPdfDocument(data.slice(0));
  const hasText = await hasTextLayer(doc);
  const paragraphs: Paragraph[] = [];
  const allHeights: number[] = [];
  let wordCount = 0;

  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();

    const lines: Line[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const transform = item.transform as number[];
      const y = Math.round(transform[5] ?? 0);
      const height = item.height || Math.hypot(transform[2] ?? 0, transform[3] ?? 0) || 10;

      const existing = lines.find((l) => Math.abs(l.y - y) <= 3);
      if (existing) {
        existing.text += (existing.text.endsWith(' ') || item.str.startsWith(' ') ? '' : ' ') + item.str;
        existing.height = Math.max(existing.height, height);
      } else {
        lines.push({ y, text: item.str, height });
      }
    }

    lines.sort((a, b) => b.y - a.y);
    allHeights.push(...lines.map((l) => l.height));
    const sorted = [...allHeights].sort((a, b) => a - b);
    const medianHeight = sorted.length ? sorted[Math.floor(sorted.length / 2)] ?? 10 : 10;

    let buffer: string[] = [];
    const flushParagraph = () => {
      if (buffer.length === 0) return;
      const text = buffer.join(' ').replace(/\s+/g, ' ').trim();
      if (text) {
        wordCount += text.split(/\s+/).filter(Boolean).length;
        paragraphs.push(new Paragraph({ children: [new TextRun(text)], spacing: { after: 160 } }));
      }
      buffer = [];
    };

    let prevY: number | null = null;
    for (const line of lines) {
      const isHeading = line.height > medianHeight * 1.35 && line.text.length <= 120;
      const bigGap = prevY !== null && prevY - line.y > medianHeight * 1.9;

      if (isHeading) {
        flushParagraph();
        const text = line.text.replace(/\s+/g, ' ').trim();
        wordCount += text.split(/\s+/).filter(Boolean).length;
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text, bold: true })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
          }),
        );
      } else {
        if (bigGap) flushParagraph();
        buffer.push(line.text);
      }
      prevY = line.y;
    }
    flushParagraph();

    if (p < doc.numPages) {
      paragraphs.push(new Paragraph({ text: '', pageBreakBefore: true }));
    }
    onProgress?.(p, doc.numPages);
  }

  const pageCount = doc.numPages;
  await doc.destroy();

  if (!hasText || wordCount === 0) {
    paragraphs.length = 0;
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text:
              'This PDF does not contain an extractable text layer, so no editable text could be produced. ' +
              'It appears to be a scanned document or built from page images. Converting it would require ' +
              'optical character recognition (OCR), which this browser-based tool does not perform.',
            italics: true,
          }),
        ],
      }),
    );
  }

  const out = new Document({ sections: [{ children: paragraphs }] });
  const blob = await Packer.toBlob(out);
  return { blob, isScanned: !hasText, pageCount, wordCount };
}
