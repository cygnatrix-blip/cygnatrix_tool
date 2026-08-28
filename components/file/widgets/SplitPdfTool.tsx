'use client';

import { useEffect, useState } from 'react';
import { FILE_LIMITS } from '@/config/site';
import { useFileTool } from '@/lib/hooks/useFileTool';
import { parsePageRanges } from '@/lib/pdf/ranges';
import type { SplitMode, SplitOutput } from '@/lib/pdf/split';
import { downloadBlob, bytesToBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { DropZone } from '@/components/file/DropZone';
import { FileList } from '@/components/file/FileList';
import { ProcessButton, ProgressIndicator } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/calculator/shell';

const L = FILE_LIMITS.pdf;

export function SplitPdfTool() {
  const ft = useFileTool({
    toolSlug: 'split-pdf',
    category: 'pdf',
    accept: ['pdf'],
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: 1,
    multiple: false,
  });
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [mode, setMode] = useState<SplitMode>('ranges');
  const [ranges, setRanges] = useState('1-1');
  const [perRange, setPerRange] = useState(true);
  const [busy, setBusy] = useState(false);
  const [outputs, setOutputs] = useState<SplitOutput[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const file = ft.validFiles[0]?.file ?? null;

  useEffect(() => {
    setOutputs(null);
    setPageCount(null);
    if (!file) return;
    Promise.all([file.arrayBuffer(), import('pdf-lib')])
      .then(([buf, { PDFDocument }]) => PDFDocument.load(buf))
      .then((doc) => {
        const count = doc.getPageCount();
        setPageCount(count);
        setRanges(`1-${Math.min(count, 1)}`);
      })
      .catch(() => setErr('This PDF could not be read. It may be password-protected or damaged.'));
  }, [file]);

  const parsed = pageCount ? parsePageRanges(ranges, pageCount) : null;

  const run = async () => {
    if (!file || !pageCount) return;
    setBusy(true);
    setErr(null);
    setOutputs(null);
    try {
      const buf = await file.arrayBuffer();
      const groups =
        mode === 'every'
          ? []
          : parsePageRanges(ranges, pageCount).groups;
      if (mode !== 'every' && groups.length === 0) {
        setErr('Enter valid pages or ranges.');
        setBusy(false);
        return;
      }
      const { splitPdf } = await import('@/lib/pdf/split');
      const result = await splitPdf(buf, {
        mode,
        baseName: file.name,
        groups,
        oneFilePerRange: mode === 'ranges' && perRange,
      });
      setOutputs(result);
      track('tool_completed', { toolSlug: 'split-pdf', category: 'pdf', meta: { mode, parts: result.length } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong while splitting your file. Please try again.');
      track('tool_failed', { toolSlug: 'split-pdf', category: 'pdf' });
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = async () => {
    if (!outputs) return;
    const { zipOutputs } = await import('@/lib/pdf/split');
    const { blob, name } = zipOutputs(outputs, (file?.name ?? 'document').replace(/\.pdf$/i, '') + '-split.zip');
    downloadBlob(blob, name);
  };

  return (
    <div>
      <DropZone onFiles={ft.addFiles} accept="application/pdf,.pdf" multiple={false} hint={`One PDF, up to ${L.maxFileSizeMB} MB`} disabled={busy} />
      <FileList files={ft.files} onRemove={ft.removeFile} />

      {file && pageCount && (
        <div className="mt-4 card p-5">
          <p className="mb-4 text-sm text-ink-500">
            <strong className="text-ink-800 dark:text-ink-100">{pageCount}</strong> pages detected.
          </p>
          <SegmentedControl
            label="Split mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'ranges', label: 'Page ranges' },
              { value: 'select', label: 'Extract pages' },
              { value: 'every', label: 'Every page' },
            ]}
          />
          {mode !== 'every' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200" htmlFor="ranges">
                Pages / ranges
              </label>
              <input
                id="ranges"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder="e.g. 1-3, 5, 8-10"
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950"
              />
              {parsed && parsed.errors.length > 0 && (
                <p className="mt-1 text-xs text-red-600">{parsed.errors.join(' ')}</p>
              )}
              {parsed && parsed.errors.length === 0 && (
                <p className="mt-1 text-xs text-ink-400">{parsed.pages.length} pages selected.</p>
              )}
              {mode === 'ranges' && (
                <label className="mt-3 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                  <input type="checkbox" checked={perRange} onChange={(e) => setPerRange(e.target.checked)} className="accent-brand-600" />
                  One file per range
                </label>
              )}
            </div>
          )}

          <ProcessButton onClick={run} busy={busy}>
            Split PDF
          </ProcessButton>
        </div>
      )}

      {busy && <ProgressIndicator value={50} label="Splitting…" />}
      {err && <Alert tone="error" className="mt-4">{err}</Alert>}

      {outputs && (
        <div className="mt-4 space-y-3">
          <Alert tone="success">{outputs.length} file{outputs.length > 1 ? 's' : ''} ready.</Alert>
          <div className="space-y-2">
            {outputs.map((o) => (
              <div key={o.name} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-800">
                <span className="truncate">{o.name} <span className="text-ink-400">· {o.pages.length}p</span></span>
                <Button size="sm" variant="secondary" onClick={() => downloadBlob(bytesToBlob(o.bytes, 'application/pdf'), o.name)}>
                  Download
                </Button>
              </div>
            ))}
          </div>
          {outputs.length > 1 && (
            <Button onClick={downloadAll}>Download all as ZIP</Button>
          )}
        </div>
      )}
    </div>
  );
}
