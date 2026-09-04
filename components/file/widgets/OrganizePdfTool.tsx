'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { FILE_LIMITS } from '@/config/site';
import { useFileTool } from '@/lib/hooks/useFileTool';
import { downloadBlob, bytesToBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { DropZone } from '@/components/file/DropZone';
import { FileList } from '@/components/file/FileList';
import { ProcessButton, ProgressIndicator, DownloadButton } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';

const L = FILE_LIMITS.pdf;

interface WorkingPage {
  /** 1-based page number in the *original* source document — stable across reordering. */
  original: number;
  url: string;
  selected: boolean;
}

export function OrganizePdfTool() {
  const ft = useFileTool({
    toolSlug: 'organize-pdf',
    category: 'pdf',
    accept: ['pdf'],
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: 1,
    multiple: false,
  });
  const file = ft.validFiles[0]?.file ?? null;

  const [pages, setPages] = useState<WorkingPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<{ blob: Blob; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOutput(null);
    setPages((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
    if (!file) return;

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [{ pdfToImages }, buf] = await Promise.all([import('@/lib/pdf/to-images'), file.arrayBuffer()]);
        const rendered = await pdfToImages(buf, { dpi: 55, quality: 0.7, mime: 'image/jpeg' });
        if (cancelled) return;
        setPages(rendered.map((p) => ({ original: p.pageNumber, url: URL.createObjectURL(p.blob), selected: false })));
      } catch (e) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error('organize-pdf: failed to render thumbnails', e);
          const { describePdfLoadError } = await import('@/lib/pdf/pdfjs');
          setError(describePdfLoadError(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const move = (index: number, dir: -1 | 1) => {
    setPages((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target]!, copy[index]!];
      return copy;
    });
  };

  const remove = (index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSelect = (index: number) => {
    setPages((prev) => prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p)));
  };

  const save = async () => {
    if (!file) return;
    if (pages.length === 0) {
      setError('At least one page must remain.');
      return;
    }
    setBusy(true);
    setError(null);
    setOutput(null);
    try {
      const [{ organizePdf }, buf] = await Promise.all([import('@/lib/pdf/organize'), file.arrayBuffer()]);
      const bytes = await organizePdf(buf, pages.map((p) => p.original));
      setOutput({ blob: bytesToBlob(bytes, 'application/pdf'), name: 'organized.pdf' });
      track('tool_completed', { toolSlug: 'organize-pdf', category: 'pdf', meta: { action: 'reorder', pages: pages.length } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      track('tool_failed', { toolSlug: 'organize-pdf', category: 'pdf' });
    } finally {
      setBusy(false);
    }
  };

  const extract = async () => {
    if (!file) return;
    const selected = pages.filter((p) => p.selected).map((p) => p.original);
    if (selected.length === 0) {
      setError('Select at least one page to extract.');
      return;
    }
    setBusy(true);
    setError(null);
    setOutput(null);
    try {
      const [{ organizePdf }, buf] = await Promise.all([import('@/lib/pdf/organize'), file.arrayBuffer()]);
      const bytes = await organizePdf(buf, selected);
      setOutput({ blob: bytesToBlob(bytes, 'application/pdf'), name: 'extracted.pdf' });
      track('tool_completed', { toolSlug: 'organize-pdf', category: 'pdf', meta: { action: 'extract', pages: selected.length } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      track('tool_failed', { toolSlug: 'organize-pdf', category: 'pdf' });
    } finally {
      setBusy(false);
    }
  };

  const selectedCount = pages.filter((p) => p.selected).length;

  return (
    <div>
      <DropZone onFiles={ft.addFiles} accept="application/pdf,.pdf" multiple={false} hint={`One PDF, up to ${L.maxFileSizeMB} MB`} disabled={busy} />
      <FileList files={ft.files} onRemove={ft.removeFile} />

      {loading && <ProgressIndicator value={50} label="Loading pages…" />}

      {pages.length > 0 && (
        <div className="mt-4 card p-5">
          <p className="mb-4 text-sm text-ink-500">
            Drag order with the arrows, remove pages with ✕, or tick pages to extract into a separate file.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pages.map((p, i) => (
              <div
                key={`${p.original}-${i}`}
                className={
                  'relative rounded-xl border p-2 transition ' +
                  (p.selected ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/30' : 'border-ink-200 dark:border-ink-800')
                }
              >
                <label className="absolute left-3 top-3 z-10">
                  <input
                    type="checkbox"
                    checked={p.selected}
                    onChange={() => toggleSelect(i)}
                    className="h-5 w-5 accent-brand-600"
                    aria-label={`Select page ${p.original} for extraction`}
                  />
                </label>
                <button
                  type="button"
                  aria-label={`Remove page ${p.original}`}
                  onClick={() => remove(i)}
                  className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1 text-ink-400 hover:text-red-600 dark:bg-ink-900/90"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-ink-50 dark:bg-ink-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`Page ${p.original}`} className="max-h-full max-w-full" />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-ink-400">
                    #{i + 1} <span className="text-ink-300">(orig. p{p.original})</span>
                  </span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      aria-label={`Move page ${i + 1} earlier`}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      className="rounded-md p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-800"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move page ${i + 1} later`}
                      disabled={i === pages.length - 1}
                      onClick={() => move(i, 1)}
                      className="rounded-md p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-800"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <ProcessButton onClick={save} busy={busy}>
              Save {pages.length} page{pages.length === 1 ? '' : 's'} as new PDF
            </ProcessButton>
            {selectedCount > 0 && (
              <Button size="lg" variant="secondary" className="mt-4" onClick={extract} disabled={busy}>
                Extract {selectedCount} selected page{selectedCount === 1 ? '' : 's'}
              </Button>
            )}
          </div>
        </div>
      )}

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      {output && (
        <div className="mt-4 space-y-3">
          <Alert tone="success">Your PDF is ready.</Alert>
          <DownloadButton onClick={() => downloadBlob(output.blob, output.name)}>Download {output.name}</DownloadButton>
        </div>
      )}
    </div>
  );
}
