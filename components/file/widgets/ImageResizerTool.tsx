'use client';

import { useEffect, useMemo, useState } from 'react';
import { FILE_LIMITS } from '@/config/site';
import { useFileTool } from '@/lib/hooks/useFileTool';
import { decodeImage } from '@/lib/image/canvas';
import { convertImage } from '@/lib/image/convert';
import { resolveTargetSize } from '@/lib/image/resize';
import { downloadBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { sniffKind, mimeFor } from '@/lib/security/file-validation';
import { DropZone } from '@/components/file/DropZone';
import { FileList } from '@/components/file/FileList';
import { ProcessButton, ProgressIndicator } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { NumberField, SegmentedControl } from '@/components/calculator/shell';

const L = FILE_LIMITS.image;

interface ResizedResult {
  name: string;
  blob: Blob;
  width: number;
  height: number;
}

export function ImageResizerTool() {
  const ft = useFileTool({
    toolSlug: 'resize-image',
    category: 'image',
    accept: ['jpeg', 'png', 'webp'],
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: L.maxFiles,
    multiple: true,
  });
  const [source, setSource] = useState<{ width: number; height: number } | null>(null);
  const [mode, setMode] = useState<'dimensions' | 'percentage'>('dimensions');
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [pct, setPct] = useState(50);
  const [lock, setLock] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResizedResult[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const firstFile = ft.validFiles[0]?.file ?? null;

  // The first image drives the live "new size" preview — the same settings
  // (especially percentage mode) still apply correctly to every other image,
  // each scaled from its own original dimensions.
  useEffect(() => {
    setResults(null);
    setSource(null);
    if (!firstFile) return;
    decodeImage(firstFile)
      .then(({ width: w, height: h, bitmap }) => {
        bitmap.close();
        setSource({ width: w, height: h });
        setWidth(w);
        setHeight(h);
      })
      .catch(() => setErr('This image could not be read.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstFile]);

  const target = useMemo(() => {
    if (!source) return null;
    try {
      return resolveTargetSize(source, { mode, width, height, percentage: pct, lockAspect: lock });
    } catch {
      return null;
    }
  }, [source, mode, width, height, pct, lock]);

  const run = async () => {
    if (ft.validFiles.length === 0) return;
    setBusy(true);
    setErr(null);
    setResults(null);
    setProgress(0);
    try {
      const out: ResizedResult[] = [];
      for (let i = 0; i < ft.validFiles.length; i += 1) {
        const file = ft.validFiles[i]!.file;
        const kind = (await sniffKind(file)) ?? 'png';
        const mime = mimeFor(kind) as 'image/jpeg' | 'image/png' | 'image/webp';
        const r = await convertImage(file, {
          to: mime,
          quality: mime === 'image/png' ? undefined : 0.92,
          resize: { mode, width, height, percentage: pct, lockAspect: lock },
        });
        out.push({
          name: r.name.replace(/(\.\w+)$/, `-${r.width}x${r.height}$1`),
          blob: r.blob,
          width: r.width,
          height: r.height,
        });
        setProgress(((i + 1) / ft.validFiles.length) * 100);
      }
      setResults(out);
      track('tool_completed', { toolSlug: 'resize-image', category: 'image', meta: { count: out.length } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong while resizing your images. Please try again.');
      track('tool_failed', { toolSlug: 'resize-image', category: 'image' });
    } finally {
      setBusy(false);
    }
  };

  const downloadZip = async () => {
    if (!results) return;
    const { zipSync } = await import('fflate');
    const entries: Record<string, Uint8Array> = {};
    for (const r of results) entries[r.name] = new Uint8Array(await r.blob.arrayBuffer());
    downloadBlob(new Blob([zipSync(entries) as BlobPart], { type: 'application/zip' }), 'resized-images.zip');
  };

  return (
    <div>
      <DropZone
        onFiles={ft.addFiles}
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        hint={`Up to ${L.maxFiles} images, ${L.maxFileSizeMB} MB each`}
        disabled={busy}
      />
      <FileList files={ft.files} onRemove={ft.removeFile} />

      {ft.validFiles.length > 0 && source && (
        <div className="mt-4 card p-5">
          <p className="mb-4 text-sm text-ink-500">
            First image: <strong className="text-ink-800 dark:text-ink-100">{source.width} × {source.height}</strong> px
            {ft.validFiles.length > 1 && ' — these settings apply to all images, each scaled from its own size'}
          </p>
          <SegmentedControl
            label="Resize by"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'dimensions', label: 'Pixels' },
              { value: 'percentage', label: 'Percentage' },
            ]}
          />
          {mode === 'dimensions' ? (
            <>
              <NumberField label="Width" suffix="px" value={width} onChange={(v) => { setWidth(v); if (lock && source) setHeight(Math.round(v / (source.width / source.height))); }} min={1} max={20000} />
              <NumberField label="Height" suffix="px" value={height} onChange={(v) => { setHeight(v); if (lock && source) setWidth(Math.round(v * (source.width / source.height))); }} min={1} max={20000} />
            </>
          ) : (
            <NumberField label="Scale" suffix="%" value={pct} onChange={setPct} min={1} max={400} step={1} slider />
          )}
          <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
            <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} className="accent-brand-600" />
            Lock aspect ratio
          </label>
          {target && (
            <p className="mt-3 text-sm text-ink-500">
              New size (first image): <strong className="text-brand-700 dark:text-brand-400">{target.width} × {target.height}</strong> px
            </p>
          )}
          <ProcessButton onClick={run} busy={busy}>
            Resize {ft.validFiles.length} image{ft.validFiles.length === 1 ? '' : 's'}
          </ProcessButton>
        </div>
      )}

      {busy && <ProgressIndicator value={progress} label="Resizing…" />}
      {err && <Alert tone="error" className="mt-4">{err}</Alert>}

      {results && (
        <div className="mt-4 space-y-3">
          <Alert tone="success">Resized {results.length} image{results.length === 1 ? '' : 's'}.</Alert>
          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.name} className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 px-3 py-2.5 text-sm dark:border-ink-800">
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                <span className="shrink-0 text-xs text-ink-400">{r.width} × {r.height}px</span>
                <Button size="sm" variant="secondary" onClick={() => downloadBlob(r.blob, r.name)}>
                  Download
                </Button>
              </li>
            ))}
          </ul>
          {results.length > 1 && <Button onClick={downloadZip}>Download all as ZIP</Button>}
        </div>
      )}
    </div>
  );
}
