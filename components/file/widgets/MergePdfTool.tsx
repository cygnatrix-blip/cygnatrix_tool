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

const L = FILE_LIMITS.pdf;

export function MergePdfTool() {
  const ft = useFileTool({
    toolSlug: 'merge-pdf',
    category: 'pdf',
    accept: ['pdf'],
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: L.maxFiles,
    multiple: true,
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [output, setOutput] = useState<Blob | null>(null);

  const run = async () => {
    if (ft.validFiles.length < 2) {
      ft.setError('Add at least two valid PDF files to merge.');
      return;
    }
    setBusy(true);
    setProgress(0);
    setOutput(null);
    ft.setError(null);
    try {
      // pdf-lib (~250 KB) is loaded only now, on demand — not in the page bundle.
      const { mergePdfs } = await import('@/lib/pdf/merge');
      const sources = await Promise.all(
        ft.validFiles.map(async (mf) => ({ name: mf.file.name, data: await mf.file.arrayBuffer() })),
      );
      const bytes = await mergePdfs(sources, (done, total) => setProgress((done / total) * 100));
      setOutput(bytesToBlob(bytes, 'application/pdf'));
      track('tool_completed', { toolSlug: 'merge-pdf', category: 'pdf', meta: { files: sources.length } });
    } catch (e) {
      ft.setError(e instanceof Error ? e.message : 'Something went wrong while merging your files. Please try again.');
      track('tool_failed', { toolSlug: 'merge-pdf', category: 'pdf' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <DropZone
        onFiles={ft.addFiles}
        accept="application/pdf,.pdf"
        hint={`Up to ${L.maxFiles} PDFs, ${L.maxFileSizeMB} MB each`}
        disabled={busy}
      />
      <FileList files={ft.files} onRemove={ft.removeFile} onMove={ft.moveFile} reorderable />

      {ft.error && (
        <Alert tone="error" className="mt-4">
          {ft.error}
        </Alert>
      )}

      {ft.validFiles.length >= 2 && !output && (
        <ProcessButton onClick={run} busy={busy} disabled={busy}>
          Merge {ft.validFiles.length} PDFs
        </ProcessButton>
      )}
      {busy && <ProgressIndicator value={progress} label="Merging pages…" />}

      {output && (
        <div className="mt-4 space-y-3">
          <Alert tone="success">Your merged PDF is ready.</Alert>
          <div className="flex flex-wrap gap-2">
            <DownloadButton onClick={() => downloadBlob(output, 'merged.pdf')}>Download merged.pdf</DownloadButton>
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
