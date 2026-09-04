'use client';

import { useState } from 'react';
import { FILE_LIMITS } from '@/config/site';
import { useFileTool } from '@/lib/hooks/useFileTool';
import { downloadBlob, bytesToBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { DropZone } from '@/components/file/DropZone';
import { FileList } from '@/components/file/FileList';
import { ProcessButton, ProgressIndicator, DownloadButton } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { SegmentedControl } from '@/components/calculator/shell';
import type { Orientation, PageSizeOption } from '@/lib/pdf/image-to-pdf';

const L = FILE_LIMITS.image;

export function ImageToPdfTool() {
  const ft = useFileTool({
    toolSlug: 'image-to-pdf',
    category: 'pdf',
    accept: ['jpeg', 'png', 'webp'],
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: L.maxFiles,
    multiple: true,
  });
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [marginMm, setMarginMm] = useState(10);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [output, setOutput] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (ft.validFiles.length === 0) {
      setError('Add at least one image.');
      return;
    }
    setBusy(true);
    setProgress(0);
    setOutput(null);
    setError(null);
    try {
      const { imagesToPdf } = await import('@/lib/pdf/image-to-pdf');
      const marginPt = (marginMm / 25.4) * 72;
      const bytes = await imagesToPdf(
        ft.validFiles.map((mf) => mf.file),
        { pageSize, orientation, marginPt },
        (done, total) => setProgress((done / total) * 100),
      );
      setOutput(bytesToBlob(bytes, 'application/pdf'));
      track('tool_completed', { toolSlug: 'image-to-pdf', category: 'pdf', meta: { images: ft.validFiles.length } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while building the PDF. Please try again.');
      track('tool_failed', { toolSlug: 'image-to-pdf', category: 'pdf' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <DropZone
        onFiles={ft.addFiles}
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        hint={`Up to ${L.maxFiles} images, ${L.maxFileSizeMB} MB each — order below becomes page order`}
        disabled={busy}
      />
      <FileList files={ft.files} onRemove={ft.removeFile} onMove={ft.moveFile} reorderable />

      {ft.validFiles.length > 0 && (
        <div className="mt-4 card p-5">
          <SegmentedControl
            label="Page size"
            value={pageSize}
            onChange={setPageSize}
            options={[
              { value: 'a4', label: 'A4' },
              { value: 'letter', label: 'Letter' },
              { value: 'fit', label: 'Fit to image' },
            ]}
          />
          {pageSize !== 'fit' && (
            <>
              <SegmentedControl
                label="Orientation"
                value={orientation}
                onChange={setOrientation}
                options={[
                  { value: 'portrait', label: 'Portrait' },
                  { value: 'landscape', label: 'Landscape' },
                ]}
              />
              <div className="mb-1">
                <label htmlFor="margin" className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
                  Margin: {marginMm} mm
                </label>
                <input
                  id="margin"
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={marginMm}
                  onChange={(e) => setMarginMm(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>
            </>
          )}

          <ProcessButton onClick={run} busy={busy}>
            Create PDF from {ft.validFiles.length} image{ft.validFiles.length === 1 ? '' : 's'}
          </ProcessButton>
        </div>
      )}

      {busy && <ProgressIndicator value={progress} label="Building PDF…" />}
      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      {output && (
        <div className="mt-4 space-y-3">
          <Alert tone="success">Your PDF is ready — {ft.validFiles.length} page{ft.validFiles.length === 1 ? '' : 's'}.</Alert>
          <div className="flex flex-wrap gap-2">
            <DownloadButton onClick={() => downloadBlob(output, 'images.pdf')}>Download images.pdf</DownloadButton>
            <button
              type="button"
              onClick={() => {
                setOutput(null);
                ft.reset();
              }}
              className="text-sm text-ink-500 underline"
            >
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
