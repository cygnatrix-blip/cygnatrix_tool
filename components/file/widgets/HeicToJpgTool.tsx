'use client';

import { useState } from 'react';
import { FILE_LIMITS } from '@/config/site';
import { formatBytes, percentReduction } from '@/lib/format';
import { downloadBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { DropZone } from '@/components/file/DropZone';
import { ProcessButton, ProgressIndicator } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';

const L = FILE_LIMITS.image;

interface Row {
  id: string;
  name: string;
  file: File;
  status: 'pending' | 'done' | 'error';
  result?: { blob: Blob; name: string; originalSize: number; newSize: number };
  error?: string;
}

let counter = 0;

export function HeicToJpgTool() {
  const [rows, setRows] = useState<Row[]>([]);
  const [quality, setQuality] = useState(0.85);
  const [preserveExif, setPreserveExif] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const addFiles = (files: File[]) => {
    const accepted = files.filter((f) => /\.(heic|heif)$/i.test(f.name) || /heic|heif/i.test(f.type));
    const rejected = files.length - accepted.length;
    const room = L.maxFiles - rows.length;
    const slice = accepted.slice(0, Math.max(0, room));
    setRows((prev) => [
      ...prev,
      ...slice.map((file) => ({ id: `h${Date.now()}-${counter++}`, name: file.name, file, status: 'pending' as const })),
    ]);
    if (rejected > 0) {
      track('tool_failed', { toolSlug: 'heic-to-jpg', category: 'image', meta: { rejected } });
    }
  };

  const run = async () => {
    const pending = rows.filter((r) => r.status === 'pending');
    if (pending.length === 0) return;
    setBusy(true);
    setProgress(0);
    try {
      const { heicToJpg } = await import('@/lib/image/heic');
      for (let i = 0; i < pending.length; i += 1) {
        const row = pending[i]!;
        try {
          const result = await heicToJpg(row.file, { quality, preserveExif });
          setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: 'done', result } : r)));
        } catch (e) {
          setRows((prev) =>
            prev.map((r) =>
              r.id === row.id
                ? { ...r, status: 'error', error: e instanceof Error ? e.message : 'Conversion failed.' }
                : r,
            ),
          );
        }
        setProgress(((i + 1) / pending.length) * 100);
      }
      track('tool_completed', { toolSlug: 'heic-to-jpg', category: 'image', meta: { files: pending.length } });
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = async () => {
    const done = rows.filter((r) => r.status === 'done' && r.result);
    if (done.length === 0) return;
    if (done.length === 1) {
      downloadBlob(done[0]!.result!.blob, done[0]!.result!.name);
      return;
    }
    const { zipSync } = await import('fflate');
    const files: Record<string, Uint8Array> = {};
    for (const r of done) files[r.result!.name] = new Uint8Array(await r.result!.blob.arrayBuffer());
    const zipped = zipSync(files, { level: 6 });
    downloadBlob(new Blob([zipped as BlobPart], { type: 'application/zip' }), 'converted-images.zip');
  };

  const pendingCount = rows.filter((r) => r.status === 'pending').length;
  const doneCount = rows.filter((r) => r.status === 'done').length;

  return (
    <div>
      <DropZone
        onFiles={addFiles}
        accept=".heic,.heif,image/heic,image/heif"
        hint={`Up to ${L.maxFiles} HEIC/HEIF photos, ${L.maxFileSizeMB} MB each`}
        disabled={busy}
      />

      {rows.length > 0 && (
        <div className="mt-4 card p-5">
          <div className="mb-4">
            <label htmlFor="q" className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
              JPG quality: {Math.round(quality * 100)}
            </label>
            <input
              id="q"
              type="range"
              min={0.4}
              max={1}
              step={0.05}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
            <input
              type="checkbox"
              checked={preserveExif}
              onChange={(e) => setPreserveExif(e.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            Preserve EXIF metadata (date, camera, GPS if present) where possible
          </label>
          <p className="mt-1 text-xs text-ink-400">
            Off by default for privacy. Best-effort — some photos may convert without EXIF regardless.
          </p>

          {pendingCount > 0 && (
            <ProcessButton onClick={run} busy={busy}>
              Convert {pendingCount} photo{pendingCount === 1 ? '' : 's'}
            </ProcessButton>
          )}
        </div>
      )}

      {busy && <ProgressIndicator value={progress} label="Converting…" />}

      {rows.length > 0 && (
        <ul className="mt-4 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 px-3 py-2.5 text-sm dark:border-ink-800">
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              {r.status === 'pending' && <span className="text-xs text-ink-400">Waiting…</span>}
              {r.status === 'error' && <span className="text-xs text-red-600">{r.error}</span>}
              {r.status === 'done' && r.result && (
                <span className="text-xs text-ink-500">
                  {formatBytes(r.result.originalSize)} → {formatBytes(r.result.newSize)} (
                  {percentReduction(r.result.originalSize, r.result.newSize)}% smaller)
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {doneCount > 0 && (
        <div className="mt-4">
          <Alert tone="success" className="mb-3">
            {doneCount} photo{doneCount === 1 ? '' : 's'} converted.
          </Alert>
          <Button size="lg" onClick={downloadAll}>
            {doneCount === 1 ? 'Download JPG' : `Download ${doneCount} JPGs as ZIP`}
          </Button>
        </div>
      )}
    </div>
  );
}
