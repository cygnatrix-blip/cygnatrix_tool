'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { ExamFileSpec } from '@/config/exam-presets';
import { formatBytes } from '@/lib/format';
import { DropZone } from '@/components/file/DropZone';
import { ImageCropFrame } from '@/components/file/ImageCropFrame';
import { ProcessButton } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { track } from '@/lib/analytics/client';
import type { ExamProcessResult } from '@/lib/image/exam-photo';

/**
 * One crop → resize → compress-to-range step, used for any spec shaped like
 * {width, height, dpi, minKB, maxKB} — the exam tool's photo/signature steps
 * and the ID-card tool's photo/signature steps share this exact shape.
 */

export function RequirementRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-sm">
      <span className="text-ink-600 dark:text-ink-300">{label}</span>
      <span className={cn('flex items-center gap-1.5 font-medium', ok ? 'text-brand-600' : 'text-red-600')}>
        {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {detail}
      </span>
    </div>
  );
}

export interface ExamFileStepOutput {
  blob: Blob;
  filename: string;
}

export function ExamFileStep({
  title,
  spec,
  isSignature,
  toolSlug,
  onDone,
}: {
  title: string;
  spec: ExamFileSpec;
  isSignature: boolean;
  /** Used only for analytics — identifies which tool completed a step. */
  toolSlug: string;
  onDone: (out: ExamFileStepOutput | null) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ExamProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const aspect = spec.width / spec.height;

  const addFile = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError(null);
    setResult(null);
    onDone(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    setFile(f);
    setPreviewUrl(url);
  };

  const process = async () => {
    if (!file || !crop) return;
    setBusy(true);
    setError(null);
    try {
      const { decodeImage } = await import('@/lib/image/canvas');
      const { processExamImage } = await import('@/lib/image/exam-photo');
      const decoded = await decodeImage(file);
      const r = await processExamImage(decoded.bitmap, {
        crop,
        targetWidth: spec.width,
        targetHeight: spec.height,
        minBytes: spec.minKB * 1024,
        maxBytes: spec.maxKB * 1024,
        isSignature,
      });
      decoded.bitmap.close();
      setResult(r);
      const filename = `${isSignature ? 'signature' : 'photo'}.jpg`;
      onDone({ blob: r.blob, filename });
      track('tool_completed', { toolSlug, category: 'image', meta: { part: isSignature ? 'signature' : 'photo' } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong processing this image. Please try again.');
      onDone(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-5">
      <h3 className="mb-1 text-base font-semibold text-ink-900 dark:text-ink-100">{title}</h3>
      <p className="mb-4 text-xs text-ink-400">
        Required: {spec.width}×{spec.height}px, {spec.minKB}–{spec.maxKB} KB, {spec.format.toUpperCase()}, {spec.background} background
      </p>

      {!file && (
        <DropZone onFiles={addFile} accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple={false} hint="Any photo, JPG/PNG/WebP" />
      )}

      {file && previewUrl && natural && (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
          <ImageCropFrame
            src={previewUrl}
            naturalWidth={natural.w}
            naturalHeight={natural.h}
            aspectRatio={aspect}
            onCropChange={setCrop}
          />
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <ProcessButton onClick={process} busy={busy}>
              Process {isSignature ? 'signature' : 'photo'}
            </ProcessButton>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setResult(null);
                onDone(null);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }}
              className="text-xs text-ink-400 underline"
            >
              Choose a different image
            </button>
          </div>
        </div>
      )}

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-ink-200 p-4 dark:border-ink-800">
          <RequirementRow label="Width" ok={result.meetsWidth} detail={`${result.width}px`} />
          <RequirementRow label="Height" ok={result.meetsHeight} detail={`${result.height}px`} />
          <RequirementRow label="File size" ok={result.meetsSize} detail={formatBytes(result.bytes)} />
          <p className="mt-2 text-xs text-ink-400">{result.summary}</p>
          {!result.passesAll && (
            <p className="mt-2 text-xs text-amber-600">
              Couldn’t hit every requirement at these exact dimensions — this is the closest possible result.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
