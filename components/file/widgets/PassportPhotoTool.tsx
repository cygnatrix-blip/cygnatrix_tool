'use client';

import { useState } from 'react';
import { Printer } from 'lucide-react';
import { PASSPORT_PRESETS, PRINT_SHEET, type PassportPreset } from '@/config/passport-presets';
import { DropZone } from '@/components/file/DropZone';
import { ImageCropFrame } from '@/components/file/ImageCropFrame';
import { ProcessButton, DownloadButton } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/calculator/shell';
import { downloadBlob } from '@/lib/download';
import { formatBytes } from '@/lib/format';
import { track } from '@/lib/analytics/client';
import type { CropRect } from '@/lib/image/exam-photo';

const SHEET_MAX_BYTES = 300 * 1024; // generous — the sheet is for print, not a form upload limit

export function PassportPhotoTool() {
  const [preset, setPreset] = useState<PassportPreset>(PASSPORT_PRESETS[0]!);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<{ blob: Blob; width: number; height: number; bytes: number } | null>(null);
  const [sheet, setSheet] = useState<{ blob: Blob; count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const aspect = preset.width / preset.height;

  const addFile = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError(null);
    setPhoto(null);
    setSheet(null);
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
    setSheet(null);
    try {
      const { decodeImage } = await import('@/lib/image/canvas');
      const { processExamImage } = await import('@/lib/image/exam-photo');
      const decoded = await decodeImage(file);
      const r = await processExamImage(decoded.bitmap, {
        crop,
        targetWidth: preset.width,
        targetHeight: preset.height,
        minBytes: 0,
        maxBytes: SHEET_MAX_BYTES,
      });
      decoded.bitmap.close();
      setPhoto({ blob: r.blob, width: r.width, height: r.height, bytes: r.bytes });
      track('tool_completed', { toolSlug: 'passport-photo', category: 'image', meta: { preset: preset.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong processing this photo. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const makeSheet = async () => {
    if (!photo) return;
    setBusy(true);
    setError(null);
    try {
      const { computeTileLayout, renderPassportSheet } = await import('@/lib/image/passport-sheet');
      const bitmap = await createImageBitmap(photo.blob);
      const layout = computeTileLayout({
        sheetWidth: PRINT_SHEET.width,
        sheetHeight: PRINT_SHEET.height,
        photoWidth: preset.width,
        photoHeight: preset.height,
        marginPx: PRINT_SHEET.marginPx,
        gapPx: PRINT_SHEET.gapPx,
      });
      if (layout.count === 0) throw new Error('This photo size doesn’t fit on a 4×6in sheet.');
      const canvas = renderPassportSheet(bitmap, {
        sheetWidth: PRINT_SHEET.width,
        sheetHeight: PRINT_SHEET.height,
        photoWidth: preset.width,
        photoHeight: preset.height,
        layout,
      });
      bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the print sheet.'))), 'image/png');
      });
      setSheet({ blob, count: layout.count });
      track('tool_completed', { toolSlug: 'passport-photo', category: 'image', meta: { sheet: layout.count } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong creating the print sheet. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <SegmentedControl
          label="Passport / visa photo size"
          value={preset.id}
          onChange={(id) => {
            const next = PASSPORT_PRESETS.find((p) => p.id === id) ?? PASSPORT_PRESETS[0]!;
            setPreset(next);
            setPhoto(null);
            setSheet(null);
          }}
          options={PASSPORT_PRESETS.map((p) => ({ value: p.id, label: p.name.replace(' Passport Photo', '').replace(' / Visa Photo', '').replace(' Visa Photo', '') }))}
        />
        <p className="text-xs text-ink-400">
          {preset.name} — {preset.physical} at {preset.dpi} DPI ({preset.width}×{preset.height}px), white background
        </p>
      </div>

      {!file && (
        <div className="card p-5">
          <DropZone onFiles={addFile} accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple={false} hint="A clear, front-facing photo against a plain light background" />
        </div>
      )}

      {file && previewUrl && natural && (
        <div className="card flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-start sm:justify-center">
          <ImageCropFrame src={previewUrl} naturalWidth={natural.w} naturalHeight={natural.h} aspectRatio={aspect} onCropChange={setCrop} />
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <ProcessButton onClick={process} busy={busy}>
              Create {preset.name.split(' ')[0]} photo
            </ProcessButton>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPhoto(null);
                setSheet(null);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }}
              className="text-xs text-ink-400 underline"
            >
              Choose a different photo
            </button>
          </div>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      {photo && (
        <div className="card p-5">
          <Alert tone="success" className="mb-4">
            Photo ready — {photo.width}×{photo.height}px, {formatBytes(photo.bytes)}.
          </Alert>
          <div className="flex flex-wrap gap-2">
            <DownloadButton onClick={() => downloadBlob(photo.blob, `passport-${preset.id}.jpg`)}>
              Download photo
            </DownloadButton>
            <Button variant="secondary" onClick={makeSheet} disabled={busy}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              Create 4×6in print sheet
            </Button>
          </div>
        </div>
      )}

      {sheet && (
        <div className="card p-5">
          <Alert tone="success" className="mb-4">
            Print sheet ready — {sheet.count} copies tiled on a 4×6in sheet with cut guides.
          </Alert>
          <DownloadButton onClick={() => downloadBlob(sheet.blob, `passport-print-sheet-${preset.id}.png`)}>
            Download print sheet
          </DownloadButton>
        </div>
      )}
    </div>
  );
}
