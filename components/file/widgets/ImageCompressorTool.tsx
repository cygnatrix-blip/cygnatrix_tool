'use client';

import { useState } from 'react';
import { zipSync } from 'fflate';
import { FILE_LIMITS } from '@/config/site';
import { useFileTool } from '@/lib/hooks/useFileTool';
import { downloadBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { DropZone } from '@/components/file/DropZone';
import { FileList } from '@/components/file/FileList';
import { ProcessButton, ProgressIndicator } from '@/components/file/ProcessBar';
import { SizeComparison } from '@/components/file/SizeComparison';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';

const L = FILE_LIMITS.image;

interface Done {
  name: string;
  blob: Blob;
  original: number;
  size: number;
}

export function ImageCompressorTool() {
  const ft = useFileTool({
    toolSlug: 'compress-image',
    category: 'image',
    accept: ['jpeg', 'png', 'webp'],
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: L.maxFiles,
    multiple: true,
  });
  const [quality, setQuality] = useState(80);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Done[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (!ft.validFiles.length) return;
    setBusy(true);
    setProgress(0);
    setResults(null);
    setErr(null);
    try {
      const { compressImageFile } = await import('@/lib/image/compress');
      const out: Done[] = [];
      for (let i = 0; i < ft.validFiles.length; i += 1) {
        const mf = ft.validFiles[i]!;
        const r = await compressImageFile(mf.file, { quality: quality / 100 });
        out.push({ name: mf.file.name, blob: r.blob, original: r.originalSize, size: r.newSize });
        setProgress(((i + 1) / ft.validFiles.length) * 100);
      }
      setResults(out);
      const saved = out.reduce((s, r) => s + Math.max(0, r.original - r.size), 0);
      track('tool_completed', { toolSlug: 'compress-image', category: 'image', meta: { count: out.length, saved } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong while compressing your images. Please try again.');
      track('tool_failed', { toolSlug: 'compress-image', category: 'image' });
    } finally {
      setBusy(false);
    }
  };

  const downloadZip = async () => {
    if (!results) return;
    const entries: Record<string, Uint8Array> = {};
    for (const r of results) entries[r.name] = new Uint8Array(await r.blob.arrayBuffer());
    downloadBlob(new Blob([zipSync(entries) as BlobPart], { type: 'application/zip' }), 'compressed-images.zip');
  };

  return (
    <div>
      <DropZone
        onFiles={ft.addFiles}
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        hint={`JPG, PNG or WebP · up to ${L.maxFiles} files, ${L.maxFileSizeMB} MB each`}
        disabled={busy}
      />
      <FileList files={ft.files} onRemove={ft.removeFile} />

      {ft.validFiles.length > 0 && (
        <div className="mt-4 card p-5">
          <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200" htmlFor="q">
            Quality: {quality} <span className="text-ink-400">(lower = smaller file)</span>
          </label>
          <input id="q" type="range" min={20} max={95} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-brand-600" />
          <ProcessButton onClick={run} busy={busy}>
            Compress {ft.validFiles.length} image{ft.validFiles.length > 1 ? 's' : ''}
          </ProcessButton>
        </div>
      )}

      {busy && <ProgressIndicator value={progress} label="Compressing…" />}
      {err && <Alert tone="error" className="mt-4">{err}</Alert>}

      {results && (
        <div className="mt-4 space-y-3">
          <Alert tone="success">Done. Review the savings below.</Alert>
          <div className="space-y-3">
            {results.map((r) => (
              <div key={r.name} className="rounded-xl border border-ink-200 p-3 dark:border-ink-800">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{r.name}</span>
                  <Button size="sm" variant="secondary" onClick={() => downloadBlob(r.blob, r.name)}>
                    Download
                  </Button>
                </div>
                <SizeComparison original={r.original} updated={r.size} />
              </div>
            ))}
          </div>
          {results.length > 1 && <Button onClick={downloadZip}>Download all as ZIP</Button>}
        </div>
      )}
    </div>
  );
}
