'use client';

import { useEffect, useMemo, useState } from 'react';
import { zipSync } from 'fflate';
import { FILE_LIMITS } from '@/config/site';
import { useFileTool } from '@/lib/hooks/useFileTool';
import { pdfToImages, type RenderedPage } from '@/lib/pdf/to-images';
import { downloadBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { DropZone } from '@/components/file/DropZone';
import { FileList } from '@/components/file/FileList';
import { ProcessButton, ProgressIndicator } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/calculator/shell';

const L = FILE_LIMITS.pdf;

export function PdfToJpgTool() {
  const ft = useFileTool({
    toolSlug: 'pdf-to-jpg',
    category: 'pdf',
    accept: ['pdf'],
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: 1,
    multiple: false,
  });
  const [dpi, setDpi] = useState<'96' | '150' | '300'>('150');
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState<RenderedPage[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const file = ft.validFiles[0]?.file ?? null;
  const baseName = (file?.name ?? 'document').replace(/\.pdf$/i, '');

  const previews = useMemo(() => (pages ? pages.map((p) => URL.createObjectURL(p.blob)) : []), [pages]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    setPages(null);
    setErr(null);
    try {
      const buf = await file.arrayBuffer();
      const rendered = await pdfToImages(
        buf,
        { dpi: Number(dpi), quality: quality / 100, mime: 'image/jpeg' },
        (done, total) => setProgress((done / total) * 100),
      );
      setPages(rendered);
      track('tool_completed', { toolSlug: 'pdf-to-jpg', category: 'pdf', meta: { pages: rendered.length, dpi } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong while converting your file. Please try again.');
      track('tool_failed', { toolSlug: 'pdf-to-jpg', category: 'pdf' });
    } finally {
      setBusy(false);
    }
  };

  const downloadZip = async () => {
    if (!pages) return;
    const entries: Record<string, Uint8Array> = {};
    for (const p of pages) {
      entries[`${baseName}-${p.pageNumber}.jpg`] = new Uint8Array(await p.blob.arrayBuffer());
    }
    downloadBlob(new Blob([zipSync(entries) as BlobPart], { type: 'application/zip' }), `${baseName}-images.zip`);
  };

  return (
    <div>
      <DropZone onFiles={ft.addFiles} accept="application/pdf,.pdf" multiple={false} hint={`One PDF, up to ${L.maxFileSizeMB} MB`} disabled={busy} />
      <FileList files={ft.files} onRemove={ft.removeFile} />

      {file && (
        <div className="mt-4 card p-5">
          <SegmentedControl
            label="Resolution"
            value={dpi}
            onChange={setDpi}
            options={[
              { value: '96', label: '96 DPI (screen)' },
              { value: '150', label: '150 DPI' },
              { value: '300', label: '300 DPI (print)' },
            ]}
          />
          <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200" htmlFor="q">
            JPG quality: {quality}
          </label>
          <input id="q" type="range" min={40} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-brand-600" />
          <ProcessButton onClick={run} busy={busy}>
            Convert to JPG
          </ProcessButton>
        </div>
      )}

      {busy && <ProgressIndicator value={progress} label="Rendering pages…" />}
      {err && <Alert tone="error" className="mt-4">{err}</Alert>}

      {pages && (
        <div className="mt-4 space-y-3">
          <Alert tone="success">{pages.length} page{pages.length > 1 ? 's' : ''} converted.</Alert>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {pages.map((p, i) => (
              <button
                key={p.pageNumber}
                type="button"
                onClick={() => downloadBlob(p.blob, `${baseName}-${p.pageNumber}.jpg`)}
                className="overflow-hidden rounded-lg border border-ink-200 text-left text-xs hover:border-brand-400 dark:border-ink-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previews[i]} alt={`Page ${p.pageNumber}`} className="aspect-[3/4] w-full object-cover" />
                <span className="block px-2 py-1 text-ink-500">Page {p.pageNumber} · download</span>
              </button>
            ))}
          </div>
          {pages.length > 1 && <Button onClick={downloadZip}>Download all as ZIP</Button>}
        </div>
      )}
    </div>
  );
}
