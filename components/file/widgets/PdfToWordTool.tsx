'use client';

import { useState } from 'react';
import { FILE_LIMITS } from '@/config/site';
import { useFileTool } from '@/lib/hooks/useFileTool';
import { downloadBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { DropZone } from '@/components/file/DropZone';
import { FileList } from '@/components/file/FileList';
import { ProcessButton, ProgressIndicator, DownloadButton } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';

const L = FILE_LIMITS.pdf;

export function PdfToWordTool() {
  const ft = useFileTool({
    toolSlug: 'pdf-to-word',
    category: 'pdf',
    accept: ['pdf'],
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: 1,
    multiple: false,
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; isScanned: boolean; words: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const file = ft.validFiles[0]?.file ?? null;
  const baseName = (file?.name ?? 'document').replace(/\.pdf$/i, '');

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    setResult(null);
    setErr(null);
    try {
      const buf = await file.arrayBuffer();
      // docx (~200 KB) + pdf.js load only on demand, not in the page bundle.
      const { pdfToDocx } = await import('@/lib/pdf/to-docx');
      const r = await pdfToDocx(buf, (done, total) => setProgress((done / total) * 100));
      setResult({ blob: r.blob, isScanned: r.isScanned, words: r.wordCount });
      track('tool_completed', { toolSlug: 'pdf-to-word', category: 'pdf', meta: { words: r.wordCount, scanned: r.isScanned } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong while converting your file. Please try again.');
      track('tool_failed', { toolSlug: 'pdf-to-word', category: 'pdf' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Alert tone="info" className="mb-4">
        Best for text-based PDFs. Scanned pages, complex layouts, tables and embedded graphics may not
        convert well, and images of text cannot be made editable without OCR.
      </Alert>

      <DropZone onFiles={ft.addFiles} accept="application/pdf,.pdf" multiple={false} hint={`One PDF, up to ${L.maxFileSizeMB} MB`} disabled={busy} />
      <FileList files={ft.files} onRemove={ft.removeFile} />

      {file && !result && (
        <ProcessButton onClick={run} busy={busy}>
          Convert to Word
        </ProcessButton>
      )}
      {busy && <ProgressIndicator value={progress} label="Extracting text…" />}
      {err && <Alert tone="error" className="mt-4">{err}</Alert>}

      {result && (
        <div className="mt-4 space-y-3">
          {result.isScanned ? (
            <Alert tone="warning" title="No text layer found">
              This PDF appears to be scanned or image-based, so no editable text could be extracted. The
              downloaded document explains this.
            </Alert>
          ) : (
            <Alert tone="success">Extracted about {result.words.toLocaleString('en-IN')} words into an editable document.</Alert>
          )}
          <DownloadButton onClick={() => downloadBlob(result.blob, `${baseName}.docx`)}>Download {baseName}.docx</DownloadButton>
        </div>
      )}
    </div>
  );
}
