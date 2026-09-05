'use client';

import { useState } from 'react';
import { FILE_LIMITS } from '@/config/site';
import { formatBytes } from '@/lib/format';
import { downloadBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { TARGET_SIZE_PRESETS, type CompressToTargetResult } from '@/lib/image/compress-to-target';
import { DropZone } from '@/components/file/DropZone';
import { ProgressIndicator } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/calculator/shell';
import { cn } from '@/lib/cn';

const L = FILE_LIMITS.image;

interface Row {
  id: string;
  file: File;
  status: 'pending' | 'done' | 'error';
  result?: CompressToTargetResult;
  error?: string;
}

let counter = 0;

export function CompressToSizeTool({ initialTargetKB = 100 }: { initialTargetKB?: number } = {}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [targetKB, setTargetKB] = useState(initialTargetKB);
  const [minKB, setMinKB] = useState<number | ''>('');
  const [mime, setMime] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const addFiles = (files: File[]) => {
    const room = L.maxFiles - rows.length;
    const slice = files.slice(0, Math.max(0, room));
    setRows((prev) => [
      ...prev,
      ...slice.map((file) => ({ id: `c${Date.now()}-${counter++}`, file, status: 'pending' as const })),
    ]);
  };

  const run = async () => {
    const pending = rows.filter((r) => r.status === 'pending');
    if (pending.length === 0) return;
    const targetBytes = Math.round(targetKB * 1024);
    const minBytes = minKB === '' ? undefined : Math.round(minKB * 1024);
    if (minBytes !== undefined && minBytes > targetBytes) {
      return; // guarded by disabling the button below
    }

    setBusy(true);
    setProgress(0);
    try {
      const { compressToTargetSize } = await import('@/lib/image/compress-to-target');
      for (let i = 0; i < pending.length; i += 1) {
        const row = pending[i]!;
        try {
          const result = await compressToTargetSize(row.file, {
            targetBytes,
            minBytes,
            mime,
            onProgress: (f) => setProgress(((i + f) / pending.length) * 100),
          });
          setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: 'done', result } : r)));
        } catch (e) {
          setRows((prev) =>
            prev.map((r) =>
              r.id === row.id ? { ...r, status: 'error', error: e instanceof Error ? e.message : 'Compression failed.' } : r,
            ),
          );
        }
      }
      track('tool_completed', { toolSlug: 'compress-to-size', category: 'image', meta: { files: pending.length, targetKB } });
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = async () => {
    const done = rows.filter((r) => r.status === 'done' && r.result);
    if (done.length === 0) return;
    const ext = mime === 'image/jpeg' ? 'jpg' : 'webp';
    if (done.length === 1) {
      downloadBlob(done[0]!.result!.blob, done[0]!.file.name.replace(/\.[^.]+$/, `.${ext}`));
      return;
    }
    const { zipSync } = await import('fflate');
    const files: Record<string, Uint8Array> = {};
    for (const r of done) {
      const name = r.file.name.replace(/\.[^.]+$/, `.${ext}`);
      files[name] = new Uint8Array(await r.result!.blob.arrayBuffer());
    }
    downloadBlob(new Blob([zipSync(files, { level: 6 }) as BlobPart], { type: 'application/zip' }), 'compressed-images.zip');
  };

  const invalidRange = minKB !== '' && minKB > targetKB;
  const pendingCount = rows.filter((r) => r.status === 'pending').length;
  const doneCount = rows.filter((r) => r.status === 'done').length;

  return (
    <div>
      <DropZone
        onFiles={addFiles}
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        hint={`Up to ${L.maxFiles} images, ${L.maxFileSizeMB} MB each`}
        disabled={busy}
      />

      {rows.length > 0 && (
        <div className="mt-4 card p-5">
          <p className="mb-1.5 text-sm font-medium text-ink-700 dark:text-ink-200">Target file size</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {TARGET_SIZE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setTargetKB(Math.round(p.bytes / 1024))}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                  Math.round(p.bytes / 1024) === targetKB
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                    : 'border-ink-200 text-ink-600 hover:border-brand-300 dark:border-ink-700 dark:text-ink-300',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="target" className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
                Custom target (KB)
              </label>
              <input
                id="target"
                type="number"
                min={1}
                value={targetKB}
                onChange={(e) => setTargetKB(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950"
              />
            </div>
            <div>
              <label htmlFor="min" className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
                Minimum size (KB) — optional
              </label>
              <input
                id="min"
                type="number"
                min={0}
                placeholder="No minimum"
                value={minKB}
                onChange={(e) => setMinKB(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950"
              />
              {invalidRange && <p className="mt-1 text-xs text-red-600">Minimum can’t be larger than the target.</p>}
            </div>
          </div>

          <SegmentedControl
            label="Output format"
            value={mime}
            onChange={setMime}
            options={[
              { value: 'image/jpeg', label: 'JPG' },
              { value: 'image/webp', label: 'WebP' },
            ]}
          />

          {pendingCount > 0 && (
            <Button size="lg" className="mt-2 w-full sm:w-auto" onClick={run} disabled={busy || invalidRange}>
              Compress {pendingCount} image{pendingCount === 1 ? '' : 's'} to {targetKB} KB
            </Button>
          )}
        </div>
      )}

      {busy && <ProgressIndicator value={progress} label="Searching for the right quality…" />}

      {rows.length > 0 && (
        <ul className="mt-4 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 px-3 py-2.5 text-sm dark:border-ink-800">
              <span className="min-w-0 flex-1 truncate">{r.file.name}</span>
              {r.status === 'pending' && <span className="shrink-0 text-xs text-ink-400">{formatBytes(r.file.size)}</span>}
              {r.status === 'error' && <span className="shrink-0 text-xs text-red-600">{r.error}</span>}
              {r.status === 'done' && r.result && (
                <span className="shrink-0 text-right text-xs text-ink-500">
                  <span className={r.result.metTarget ? 'font-medium text-brand-600' : 'font-medium text-amber-600'}>
                    {r.result.metTarget ? '✓ ' : '≈ '}
                    {r.result.summary}
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {doneCount > 0 && (
        <div className="mt-4">
          <Alert tone={rows.every((r) => r.status !== 'done' || r.result?.metTarget) ? 'success' : 'warning'} className="mb-3">
            {doneCount} image{doneCount === 1 ? '' : 's'} processed.{' '}
            {rows.some((r) => r.result && !r.result.metTarget) &&
              'Some could not hit the exact target even after shrinking — see the note next to each file.'}
          </Alert>
          <Button size="lg" onClick={downloadAll}>
            {doneCount === 1 ? 'Download image' : `Download ${doneCount} images as ZIP`}
          </Button>
        </div>
      )}
    </div>
  );
}
