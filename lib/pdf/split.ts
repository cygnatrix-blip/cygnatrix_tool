'use client';

import { PDFDocument } from 'pdf-lib';
import { zipSync } from 'fflate';

export type SplitMode = 'every' | 'select' | 'ranges';

export interface SplitOutput {
  name: string;
  bytes: Uint8Array;
  pages: number[];
}

async function extractPages(source: PDFDocument, pageNums: number[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  out.setProducer('Cygnatrix Tools');
  const indices = pageNums.map((n) => n - 1);
  const copied = await out.copyPages(source, indices);
  copied.forEach((p) => out.addPage(p));
  return out.save({ useObjectStreams: true });
}

export async function splitPdf(
  data: ArrayBuffer,
  opts: { mode: SplitMode; baseName: string; groups: number[][]; oneFilePerRange?: boolean },
): Promise<SplitOutput[]> {
  const source = await PDFDocument.load(data);
  const total = source.getPageCount();
  const base = opts.baseName.replace(/\.pdf$/i, '') || 'document';
  const outputs: SplitOutput[] = [];

  if (opts.mode === 'every') {
    for (let i = 1; i <= total; i += 1) {
      outputs.push({ name: `${base}-page-${i}.pdf`, bytes: await extractPages(source, [i]), pages: [i] });
    }
    return outputs;
  }

  const groups = opts.groups.filter((g) => g.length > 0);
  if (groups.length === 0) throw new Error('No valid pages selected.');

  if (opts.mode === 'ranges' && opts.oneFilePerRange) {
    for (const group of groups) {
      const label = group.length === 1 ? `${group[0]}` : `${group[0]}-${group.at(-1)}`;
      outputs.push({ name: `${base}-${label}.pdf`, bytes: await extractPages(source, group), pages: group });
    }
    return outputs;
  }

  const merged = [...new Set(groups.flat())].sort((a, b) => a - b);
  outputs.push({ name: `${base}-extracted.pdf`, bytes: await extractPages(source, merged), pages: merged });
  return outputs;
}

export function zipOutputs(outputs: SplitOutput[], zipName: string): { blob: Blob; name: string } {
  const files: Record<string, Uint8Array> = {};
  outputs.forEach((o) => {
    files[o.name] = o.bytes;
  });
  const zipped = zipSync(files, { level: 6 });
  return { blob: new Blob([zipped as BlobPart], { type: 'application/zip' }), name: zipName };
}
