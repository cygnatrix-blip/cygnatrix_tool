'use client';

import { useState } from 'react';
import { zipSync } from 'fflate';
import { FILE_LIMITS } from '@/config/site';
import { useFileTool } from '@/lib/hooks/useFileTool';
import { convertImage } from '@/lib/image/convert';
import { downloadBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { sniffKind } from '@/lib/security/file-validation';
import type { ImageMime } from '@/lib/image/canvas';
import type { FileKind } from '@/lib/security/file-validation';
import { DropZone } from '@/components/file/DropZone';
import { FileList } from '@/components/file/FileList';
import { ProcessButton, ProgressIndicator } from '@/components/file/ProcessBar';
import { SizeComparison } from '@/components/file/SizeComparison';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/calculator/shell';

const L = FILE_LIMITS.image;

interface Done {
  name: string;
  blob: Blob;
  original: number;
  size: number;
}

export interface ImageConverterConfig {
  toolSlug: string;
  accept: FileKind[];
  acceptAttr: string;
  /** Fixed output, or a chooser when null. */
  fixedTarget: ImageMime | null;
  targetChoices?: { value: ImageMime; label: string }[];
  showQuality: boolean;
  showBackground: boolean;
}

export function ImageConverterTool({ config }: { config: ImageConverterConfig }) {
  const ft = useFileTool({
    toolSlug: config.toolSlug,
    category: 'image',
    accept: config.accept,
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: L.maxFiles,
    multiple: true,
  });
  const [target, setTarget] = useState<ImageMime>(config.fixedTarget ?? config.targetChoices?.[0]?.value ?? 'image/webp');
  const [quality, setQuality] = useState(85);
  const [background, setBackground] = useState('#ffffff');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Done[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const effectiveTarget = config.fixedTarget ?? target;
  const lossy = effectiveTarget !== 'image/png';

  const run = async () => {
    if (!ft.validFiles.length) return;
    setBusy(true);
    setProgress(0);
    setResults(null);
    setErr(null);
    try {
      const out: Done[] = [];
      for (let i = 0; i < ft.validFiles.length; i += 1) {
        const mf = ft.validFiles[i]!;
        // Guard: converting a file to its own format is a no-op we still allow.
        const kind = await sniffKind(mf.file);
        void kind;
        const r = await convertImage(mf.file, {
          to: effectiveTarget,
          quality: lossy ? quality / 100 : undefined,
          background: config.showBackground ? background : undefined,
        });
        out.push({ name: r.name, blob: r.blob, original: r.originalSize, size: r.newSize });
        setProgress(((i + 1) / ft.validFiles.length) * 100);
      }
      setResults(out);
      track('tool_completed', { toolSlug: config.toolSlug, category: 'image', meta: { count: out.length, to: effectiveTarget } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong while converting your images. Please try again.');
      track('tool_failed', { toolSlug: config.toolSlug, category: 'image' });
    } finally {
      setBusy(false);
    }
  };

  const downloadZip = async () => {
    if (!results) return;
    const entries: Record<string, Uint8Array> = {};
    for (const r of results) entries[r.name] = new Uint8Array(await r.blob.arrayBuffer());
    downloadBlob(new Blob([zipSync(entries) as BlobPart], { type: 'application/zip' }), 'converted-images.zip');
  };

  return (
    <div>
      <DropZone onFiles={ft.addFiles} accept={config.acceptAttr} hint={`Up to ${L.maxFiles} files, ${L.maxFileSizeMB} MB each`} disabled={busy} />
      <FileList files={ft.files} onRemove={ft.removeFile} />

      {ft.validFiles.length > 0 && (
        <div className="mt-4 card p-5">
          {config.targetChoices && !config.fixedTarget && (
            <SegmentedControl label="Convert to" value={target} onChange={setTarget} options={config.targetChoices} />
          )}
          {config.showQuality && lossy && (
            <>
              <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200" htmlFor="q">
                Quality: {quality}
              </label>
              <input id="q" type="range" min={40} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-brand-600" />
            </>
          )}
          {config.showBackground && effectiveTarget === 'image/jpeg' && (
            <div className="mt-3">
              <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200" htmlFor="bg">
                Background for transparent areas
              </label>
              <input id="bg" type="color" value={background} onChange={(e) => setBackground(e.target.value)} className="h-9 w-16 rounded border border-ink-200 dark:border-ink-700" />
            </div>
          )}
          <ProcessButton onClick={run} busy={busy}>
            Convert {ft.validFiles.length} image{ft.validFiles.length > 1 ? 's' : ''}
          </ProcessButton>
        </div>
      )}

      {busy && <ProgressIndicator value={progress} label="Converting…" />}
      {err && <Alert tone="error" className="mt-4">{err}</Alert>}

      {results && (
        <div className="mt-4 space-y-3">
          <Alert tone="success">Converted {results.length} image{results.length > 1 ? 's' : ''}.</Alert>
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
