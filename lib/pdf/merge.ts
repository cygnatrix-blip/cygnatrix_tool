'use client';

import { PDFDocument } from 'pdf-lib';

export interface MergeSource {
  name: string;
  data: ArrayBuffer;
}

export async function mergePdfs(
  sources: MergeSource[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  if (sources.length < 2) throw new Error('Add at least two PDF files to merge.');

  const out = await PDFDocument.create();
  out.setProducer('Cygnatrix Tools');
  out.setCreator('Cygnatrix Tools');

  for (let i = 0; i < sources.length; i += 1) {
    const src = sources[i]!;
    let doc: PDFDocument;
    try {
      doc = await PDFDocument.load(src.data, { ignoreEncryption: false });
    } catch {
      throw new Error(`“${src.name}” could not be read. It may be password-protected or damaged.`);
    }
    const pages = await out.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => out.addPage(p));
    onProgress?.(i + 1, sources.length);
  }

  return out.save({ useObjectStreams: true });
}
