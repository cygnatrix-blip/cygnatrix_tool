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
import { ProcessButton, DownloadButton } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { NumberField, SegmentedControl } from '@/components/calculator/shell';

const L = FILE_LIMITS.image;

export function ImageResizerTool() {
  const ft = useFileTool({
    toolSlug: 'resize-image',
    category: 'image',
    accept: ['jpeg', 'png', 'webp'],
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: 1,
    multiple: false,
  });
  const [source, setSource] = useState<{ width: number; height: number } | null>(null);
  const [mode, setMode] = useState<'dimensions' | 'percentage'>('dimensions');
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [pct, setPct] = useState(50);
  const [lock, setLock] = useState(true);
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<{ blob: Blob; name: string; w: number; h: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const file = ft.validFiles[0]?.file ?? null;

  // Stable object URL for the preview; revoked when the output changes or unmounts.
  const previewUrl = useMemo(() => (output ? URL.createObjectURL(output.blob) : null), [output]);
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    setOutput(null);
    setSource(null);
    if (!file) return;
    decodeImage(file)
      .then(({ width: w, height: h, bitmap }) => {
        bitmap.close();
        setSource({ width: w, height: h });
        setWidth(w);
        setHeight(h);
      })
      .catch(() => setErr('This image could not be read.'));
  }, [file]);

  const target = useMemo(() => {
    if (!source) return null;
    try {
      return resolveTargetSize(source, { mode, width, height, percentage: pct, lockAspect: lock });
    } catch {
      return null;
    }
  }, [source, mode, width, height, pct, lock]);

  const run = async () => {
    if (!file || !source) return;
    setBusy(true);
    setErr(null);
    setOutput(null);
    try {
      const kind = (await sniffKind(file)) ?? 'png';
      const mime = mimeFor(kind) as 'image/jpeg' | 'image/png' | 'image/webp';
      const r = await convertImage(file, {
        to: mime,
        quality: mime === 'image/png' ? undefined : 0.92,
        resize: { mode, width, height, percentage: pct, lockAspect: lock },
      });
      setOutput({ blob: r.blob, name: r.name.replace(/(\.\w+)$/, `-${r.width}x${r.height}$1`), w: r.width, h: r.height });
      track('tool_completed', { toolSlug: 'resize-image', category: 'image', meta: { w: r.width, h: r.height } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong while resizing your image. Please try again.');
      track('tool_failed', { toolSlug: 'resize-image', category: 'image' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <DropZone onFiles={ft.addFiles} accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple={false} hint={`One image, up to ${L.maxFileSizeMB} MB`} disabled={busy} />
      <FileList files={ft.files} onRemove={ft.removeFile} />

      {file && source && (
        <div className="mt-4 card p-5">
          <p className="mb-4 text-sm text-ink-500">
            Original: <strong className="text-ink-800 dark:text-ink-100">{source.width} × {source.height}</strong> px
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
              New size: <strong className="text-brand-700 dark:text-brand-400">{target.width} × {target.height}</strong> px
            </p>
          )}
          <ProcessButton onClick={run} busy={busy}>
            Resize image
          </ProcessButton>
        </div>
      )}

      {err && <Alert tone="error" className="mt-4">{err}</Alert>}

      {output && (
        <div className="mt-4 space-y-3">
          <Alert tone="success">Resized to {output.w} × {output.h} px.</Alert>
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Resized preview" className="max-h-64 rounded-xl border border-ink-200 dark:border-ink-800" />
          )}
          <DownloadButton onClick={() => downloadBlob(output.blob, output.name)}>Download image</DownloadButton>
        </div>
      )}
    </div>
  );
}
