'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import { FILE_LIMITS } from '@/config/site';
import { useFileTool } from '@/lib/hooks/useFileTool';
import { downloadBlob, bytesToBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { DropZone } from '@/components/file/DropZone';
import { FileList } from '@/components/file/FileList';
import { ProcessButton, ProgressIndicator, DownloadButton } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import type { RotateStep } from '@/lib/pdf/rotate';

const L = FILE_LIMITS.pdf;

interface Thumb {
  pageNumber: number;
  url: string;
}

export function RotatePdfTool() {
  const ft = useFileTool({
    toolSlug: 'rotate-pdf',
    category: 'pdf',
    accept: ['pdf'],
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: 1,
    multiple: false,
  });
  const file = ft.validFiles[0]?.file ?? null;

  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [loadingThumbs, setLoadingThumbs] = useState(false);
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOutput(null);
    setRotations({});
    setThumbs((prev) => {
      prev.forEach((t) => URL.revokeObjectURL(t.url));
      return [];
    });
    if (!file) return;

    let cancelled = false;
    setLoadingThumbs(true);
    (async () => {
      try {
        const [{ pdfToImages }, buf] = await Promise.all([import('@/lib/pdf/to-images'), file.arrayBuffer()]);
        const pages = await pdfToImages(buf, { dpi: 55, quality: 0.7, mime: 'image/jpeg' });
        if (cancelled) return;
        setThumbs(pages.map((p) => ({ pageNumber: p.pageNumber, url: URL.createObjectURL(p.blob) })));
      } catch {
        if (!cancelled) setError('This PDF could not be read. It may be password-protected or damaged.');
      } finally {
        if (!cancelled) setLoadingThumbs(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const rotateOne = (pageNumber: number, delta: RotateStep | -90) => {
    setRotations((prev) => ({ ...prev, [pageNumber]: ((prev[pageNumber] ?? 0) + delta + 360) % 360 }));
  };

  const rotateAll = (delta: RotateStep) => {
    setRotations((prev) => {
      const next: Record<number, number> = { ...prev };
      for (const t of thumbs) next[t.pageNumber] = ((prev[t.pageNumber] ?? 0) + delta + 360) % 360;
      return next;
    });
  };

  const run = async () => {
    if (!file) return;
    const map = new Map<number, RotateStep>();
    for (const [page, deg] of Object.entries(rotations)) {
      if (deg) map.set(Number(page), deg as RotateStep);
    }
    if (map.size === 0) {
      setError('Rotate at least one page first.');
      return;
    }
    setBusy(true);
    setError(null);
    setOutput(null);
    try {
      const [{ rotatePdf }, buf] = await Promise.all([import('@/lib/pdf/rotate'), file.arrayBuffer()]);
      const bytes = await rotatePdf(buf, map);
      setOutput(bytesToBlob(bytes, 'application/pdf'));
      track('tool_completed', { toolSlug: 'rotate-pdf', category: 'pdf', meta: { pages: map.size } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while rotating this PDF. Please try again.');
      track('tool_failed', { toolSlug: 'rotate-pdf', category: 'pdf' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <DropZone onFiles={ft.addFiles} accept="application/pdf,.pdf" multiple={false} hint={`One PDF, up to ${L.maxFileSizeMB} MB`} disabled={busy} />
      <FileList files={ft.files} onRemove={ft.removeFile} />

      {loadingThumbs && <ProgressIndicator value={50} label="Loading pages…" />}

      {thumbs.length > 0 && (
        <div className="mt-4 card p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Rotate all pages:</span>
            <Button size="sm" variant="secondary" onClick={() => rotateAll(90)}>
              <RotateCw className="h-4 w-4" /> 90°
            </Button>
            <Button size="sm" variant="secondary" onClick={() => rotateAll(180)}>
              180°
            </Button>
            <Button size="sm" variant="secondary" onClick={() => rotateAll(270)}>
              <RotateCcw className="h-4 w-4" /> 270°
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {thumbs.map((t) => (
              <div key={t.pageNumber} className="rounded-xl border border-ink-200 p-2 dark:border-ink-800">
                <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-ink-50 dark:bg-ink-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.url}
                    alt={`Page ${t.pageNumber}`}
                    className="max-h-full max-w-full transition-transform duration-200"
                    style={{ transform: `rotate(${rotations[t.pageNumber] ?? 0}deg)` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-ink-400">Page {t.pageNumber}</span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      aria-label={`Rotate page ${t.pageNumber} left`}
                      onClick={() => rotateOne(t.pageNumber, -90)}
                      className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Rotate page ${t.pageNumber} right`}
                      onClick={() => rotateOne(t.pageNumber, 90)}
                      className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <ProcessButton onClick={run} busy={busy}>
            Save rotated PDF
          </ProcessButton>
        </div>
      )}

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      {output && (
        <div className="mt-4 space-y-3">
          <Alert tone="success">Your rotated PDF is ready.</Alert>
          <div className="flex flex-wrap gap-2">
            <DownloadButton onClick={() => downloadBlob(output, 'rotated.pdf')}>Download rotated.pdf</DownloadButton>
          </div>
        </div>
      )}
    </div>
  );
}
