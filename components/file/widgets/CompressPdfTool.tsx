'use client';

import { useState } from 'react';
import { FILE_LIMITS } from '@/config/site';
import { useFileTool } from '@/lib/hooks/useFileTool';
import type { CompressLevel } from '@/lib/pdf/compress';
import { downloadBlob, bytesToBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { DropZone } from '@/components/file/DropZone';
import { FileList } from '@/components/file/FileList';
import { ProcessButton, ProgressIndicator, DownloadButton } from '@/components/file/ProcessBar';
import { SizeComparison } from '@/components/file/SizeComparison';
import { Alert } from '@/components/ui/primitives';
import { SegmentedControl } from '@/components/calculator/shell';

const L = FILE_LIMITS.pdf;

export function CompressPdfTool() {
  const ft = useFileTool({
    toolSlug: 'compress-pdf',
    category: 'pdf',
    accept: ['pdf'],
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: 1,
    multiple: false,
  });
  const [level, setLevel] = useState<CompressLevel>('balanced');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; original: number; size: number; rasterised: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const file = ft.validFiles[0]?.file ?? null;

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    setResult(null);
    setErr(null);
    try {
      const buf = await file.arrayBuffer();
      const { compressPdf } = await import('@/lib/pdf/compress');
      const r = await compressPdf(buf, level, (done, total) => setProgress((done / total) * 100));
      setResult({ blob: bytesToBlob(r.bytes, 'application/pdf'), original: r.originalSize, size: r.newSize, rasterised: r.rasterised });
      track('tool_completed', { toolSlug: 'compress-pdf', category: 'pdf', meta: { level, saved: Math.max(0, r.originalSize - r.newSize) } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong while compressing your file. Please try again.');
      track('tool_failed', { toolSlug: 'compress-pdf', category: 'pdf' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <DropZone onFiles={ft.addFiles} accept="application/pdf,.pdf" multiple={false} hint={`One PDF, up to ${L.maxFileSizeMB} MB`} disabled={busy} />
      <FileList files={ft.files} onRemove={ft.removeFile} />

      {file && (
        <div className="mt-4 card p-5">
          <SegmentedControl
            label="Compression level"
            value={level}
            onChange={setLevel}
            options={[
              { value: 'light', label: 'Light (keeps text)' },
              { value: 'balanced', label: 'Balanced' },
              { value: 'strong', label: 'Strong' },
            ]}
          />
          <p className="text-xs text-ink-400">
            {level === 'light'
              ? 'Removes metadata and rewrites the file. Text stays selectable.'
              : 'Downsamples image-heavy pages. Best for scans and photo PDFs; may rasterise text.'}
          </p>
          <ProcessButton onClick={run} busy={busy}>
            Compress PDF
          </ProcessButton>
        </div>
      )}

      {busy && <ProgressIndicator value={progress} label="Compressing pages…" />}
      {err && <Alert tone="error" className="mt-4">{err}</Alert>}

      {result && (
        <div className="mt-4 space-y-3">
          <SizeComparison original={result.original} updated={result.size} />
          {result.size >= result.original && (
            <Alert tone="warning">
              This PDF is already well optimised — compression could not make it meaningfully smaller. The
              original is unchanged.
            </Alert>
          )}
          {result.rasterised && (
            <Alert tone="info">Image-heavy pages were rasterised, so text on those pages is now part of the image.</Alert>
          )}
          <DownloadButton onClick={() => downloadBlob(result.blob, (file?.name ?? 'document').replace(/\.pdf$/i, '') + '-compressed.pdf')}>
            Download compressed PDF
          </DownloadButton>
        </div>
      )}
    </div>
  );
}
