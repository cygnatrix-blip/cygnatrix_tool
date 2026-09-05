'use client';

import { useState } from 'react';
import { Search, CheckCircle2, XCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { EXAM_PRESETS, EXAM_CATEGORIES, type ExamFileSpec, type ExamPreset } from '@/config/exam-presets';
import { formatBytes } from '@/lib/format';
import { downloadBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { DropZone } from '@/components/file/DropZone';
import { ImageCropFrame } from '@/components/file/ImageCropFrame';
import { ProcessButton } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { ExamProcessResult } from '@/lib/image/exam-photo';

function PresetPicker({ value, onChange }: { value: ExamPreset | null; onChange: (p: ExamPreset) => void }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q ? EXAM_PRESETS.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) : EXAM_PRESETS;

  return (
    <div className="card p-5">
      <label htmlFor="exam-search" className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
        Find your exam
      </label>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 dark:border-ink-700 dark:bg-ink-950">
        <Search className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
        <input
          id="exam-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by exam name or category…"
          className="h-11 w-full bg-transparent text-sm outline-none"
        />
      </div>

      {EXAM_CATEGORIES.map((category) => {
        const inCategory = filtered.filter((p) => p.category === category);
        if (inCategory.length === 0) return null;
        return (
          <div key={category} className="mb-4 last:mb-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">{category}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {inCategory.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange(p)}
                  className={cn(
                    'rounded-xl border p-3 text-left text-sm transition',
                    value?.id === p.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                      : 'border-ink-200 hover:border-brand-300 dark:border-ink-700',
                  )}
                >
                  <span className="block font-medium text-ink-900 dark:text-ink-100">{p.name}</span>
                  <span className="mt-0.5 block text-xs text-ink-400">
                    Photo {p.photo.width}×{p.photo.height}px · {p.photo.minKB}–{p.photo.maxKB} KB
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && <p className="py-6 text-center text-sm text-ink-400">No exam matches “{query}”.</p>}
    </div>
  );
}

function VerificationNotice({ preset }: { preset: ExamPreset }) {
  return (
    <Alert tone="warning" className="mb-4">
      <span className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          <strong className="font-semibold">
            {preset.placeholder ? 'Example spec — not a real exam requirement.' : `Specs shown as of ${preset.verifiedOn}.`}
          </strong>{' '}
          {preset.placeholder ? (
            <>This preset exists to demonstrate the tool and uses placeholder numbers. It is not sourced from any official notification — do not use it for a real application.</>
          ) : (
            <>
              Exam authorities change requirements without much notice. Always confirm these dimensions and sizes against{' '}
              {preset.officialUrl ? (
                <a href={preset.officialUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  the official notification <ExternalLink className="inline h-3 w-3" />
                </a>
              ) : (
                'the official notification'
              )}{' '}
              before you submit your application.
            </>
          )}
        </span>
      </span>
    </Alert>
  );
}

function RequirementRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
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

interface StepOutput {
  blob: Blob;
  filename: string;
}

function ExamFileStep({
  title,
  spec,
  isSignature,
  onDone,
}: {
  title: string;
  spec: ExamFileSpec;
  isSignature: boolean;
  onDone: (out: StepOutput | null) => void;
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
      track('tool_completed', { toolSlug: 'exam-photo', category: 'image', meta: { part: isSignature ? 'signature' : 'photo' } });
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

export function ExamPhotoTool() {
  const [preset, setPreset] = useState<ExamPreset | null>(null);
  const [photoOut, setPhotoOut] = useState<StepOutput | null>(null);
  const [signatureOut, setSignatureOut] = useState<StepOutput | null>(null);

  const canDownloadZip = photoOut && signatureOut;

  const downloadAll = async () => {
    if (!photoOut || !signatureOut) return;
    const { zipSync } = await import('fflate');
    const files: Record<string, Uint8Array> = {
      [photoOut.filename]: new Uint8Array(await photoOut.blob.arrayBuffer()),
      [signatureOut.filename]: new Uint8Array(await signatureOut.blob.arrayBuffer()),
    };
    downloadBlob(new Blob([zipSync(files, { level: 6 }) as BlobPart], { type: 'application/zip' }), 'exam-photo-signature.zip');
  };

  return (
    <div className="space-y-4">
      <PresetPicker
        value={preset}
        onChange={(p) => {
          setPreset(p);
          setPhotoOut(null);
          setSignatureOut(null);
        }}
      />

      {preset && (
        <>
          <VerificationNotice preset={preset} />
          <div className="grid gap-4 sm:grid-cols-2">
            <ExamFileStep title="Photo" spec={preset.photo} isSignature={false} onDone={setPhotoOut} />
            <ExamFileStep title="Signature" spec={preset.signature} isSignature onDone={setSignatureOut} />
          </div>

          {photoOut && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => downloadBlob(photoOut.blob, photoOut.filename)}>
                Download photo
              </Button>
              {signatureOut && (
                <Button variant="secondary" onClick={() => downloadBlob(signatureOut.blob, signatureOut.filename)}>
                  Download signature
                </Button>
              )}
              {canDownloadZip && <Button onClick={downloadAll}>Download both as ZIP</Button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
