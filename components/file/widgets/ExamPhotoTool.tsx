'use client';

import { useState } from 'react';
import { Search, ExternalLink, AlertTriangle } from 'lucide-react';
import { EXAM_PRESETS, EXAM_CATEGORIES, type ExamPreset } from '@/config/exam-presets';
import { downloadBlob } from '@/lib/download';
import { ExamFileStep, type ExamFileStepOutput } from '@/components/file/ExamFileStep';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

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

export function ExamPhotoTool() {
  const [preset, setPreset] = useState<ExamPreset | null>(null);
  const [photoOut, setPhotoOut] = useState<ExamFileStepOutput | null>(null);
  const [signatureOut, setSignatureOut] = useState<ExamFileStepOutput | null>(null);

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
            <ExamFileStep title="Photo" spec={preset.photo} isSignature={false} toolSlug="exam-photo" onDone={setPhotoOut} />
            <ExamFileStep title="Signature" spec={preset.signature} isSignature toolSlug="exam-photo" onDone={setSignatureOut} />
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
