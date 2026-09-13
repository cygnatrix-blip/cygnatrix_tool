'use client';

import { useState } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { ID_CARD_PRESETS, type IdCardPreset } from '@/config/id-card-presets';
import { downloadBlob } from '@/lib/download';
import { ExamFileStep, type ExamFileStepOutput } from '@/components/file/ExamFileStep';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

function PresetPicker({ value, onChange }: { value: IdCardPreset | null; onChange: (p: IdCardPreset) => void }) {
  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-medium text-ink-700 dark:text-ink-200">Which document is this for?</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {ID_CARD_PRESETS.map((p) => (
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
            <span className="block font-medium text-ink-900 dark:text-ink-100">{p.shortLabel}</span>
            <span className="mt-0.5 block text-xs text-ink-400">
              Photo {p.photo.width}×{p.photo.height}px · {p.photo.minKB}–{p.photo.maxKB} KB
              {p.signature ? ' · + signature' : ''}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PresetNotice({ preset }: { preset: IdCardPreset }) {
  return (
    <Alert tone="info" className="mb-4">
      <span className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          <strong className="font-semibold">{preset.name}</strong> — checked {preset.verifiedOn}. {preset.note}{' '}
          Portals change requirements without much notice, so confirm on{' '}
          <a href={preset.officialUrl} target="_blank" rel="noopener noreferrer" className="underline">
            the official site <ExternalLink className="inline h-3 w-3" />
          </a>{' '}
          before submitting.
        </span>
      </span>
    </Alert>
  );
}

export function IdCardPhotoTool() {
  const [preset, setPreset] = useState<IdCardPreset | null>(null);
  const [photoOut, setPhotoOut] = useState<ExamFileStepOutput | null>(null);
  const [signatureOut, setSignatureOut] = useState<ExamFileStepOutput | null>(null);

  const needsSignature = Boolean(preset?.signature);
  const canDownloadZip = photoOut && (!needsSignature || signatureOut);

  const downloadAll = async () => {
    if (!photoOut) return;
    const { zipSync } = await import('fflate');
    const files: Record<string, Uint8Array> = {
      [photoOut.filename]: new Uint8Array(await photoOut.blob.arrayBuffer()),
    };
    if (signatureOut) files[signatureOut.filename] = new Uint8Array(await signatureOut.blob.arrayBuffer());
    downloadBlob(new Blob([zipSync(files, { level: 6 }) as BlobPart], { type: 'application/zip' }), `${preset?.id ?? 'id-card'}.zip`);
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
          <PresetNotice preset={preset} />
          <div className={cn('grid gap-4', preset.signature && 'sm:grid-cols-2')}>
            <ExamFileStep title="Photo" spec={preset.photo} isSignature={false} toolSlug="id-card-photo" onDone={setPhotoOut} />
            {preset.signature && (
              <ExamFileStep title="Signature" spec={preset.signature} isSignature toolSlug="id-card-photo" onDone={setSignatureOut} />
            )}
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
              {canDownloadZip && preset.signature && <Button onClick={downloadAll}>Download both as ZIP</Button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
