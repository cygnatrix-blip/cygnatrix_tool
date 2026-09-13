'use client';

import { useRef, useState } from 'react';
import { Lock, Printer, Image as ImageIcon, FileText } from 'lucide-react';
import { IDCARD_PDF_PRESETS, type FracBox, type IdCardKind } from '@/config/idcard-pdf-presets';
import { CR80 } from '@/config/cr80';
import type { Cr80FitMode } from '@/lib/idcard/compose';
import { DropZone } from '@/components/file/DropZone';
import { ProcessButton, DownloadButton, ProgressIndicator } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { downloadBlob } from '@/lib/download';
import { formatBytes } from '@/lib/format';
import { track } from '@/lib/analytics/client';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const FULL_BOX: FracBox = { x: 0, y: 0, w: 1, h: 1 };

type CornerId = 'tl' | 'tr' | 'br' | 'bl';
const CORNERS: CornerId[] = ['tl', 'tr', 'br', 'bl'];
function anchorFor(id: CornerId, box: FracBox) {
  switch (id) {
    case 'tl':
      return { x: box.x + box.w, y: box.y + box.h };
    case 'tr':
      return { x: box.x, y: box.y + box.h };
    case 'br':
      return { x: box.x, y: box.y };
    default:
      return { x: box.x + box.w, y: box.y };
  }
}

/** One draggable/resizable rectangle over a shared image stage. */
function RegionBox({
  stageRef,
  box,
  onChange,
  color,
  label,
}: {
  stageRef: React.RefObject<HTMLDivElement | null>;
  box: FracBox;
  onChange: (b: FracBox) => void;
  color: string;
  label: string;
}) {
  const gesture = useRef<
    null | { kind: 'move'; startFx: number; startFy: number; startBox: FracBox } | { kind: 'resize'; anchor: { x: number; y: number } }
  >(null);

  const fracAt = (e: React.PointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: clamp01((e.clientX - r.left) / r.width), y: clamp01((e.clientY - r.top) / r.height) };
  };
  const startMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const f = fracAt(e);
    gesture.current = { kind: 'move', startFx: f.x, startFy: f.y, startBox: box };
  };
  const startResize = (e: React.PointerEvent, id: CornerId) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    gesture.current = { kind: 'resize', anchor: anchorFor(id, box) };
  };
  const onMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const f = fracAt(e);
    if (g.kind === 'move') {
      onChange({
        x: clamp01(Math.min(g.startBox.x + (f.x - g.startFx), 1 - g.startBox.w)),
        y: clamp01(Math.min(g.startBox.y + (f.y - g.startFy), 1 - g.startBox.h)),
        w: g.startBox.w,
        h: g.startBox.h,
      });
    } else {
      const x = Math.min(g.anchor.x, f.x);
      const y = Math.min(g.anchor.y, f.y);
      const w = Math.min(Math.max(0.02, Math.abs(g.anchor.x - f.x)), 1 - x);
      const h = Math.min(Math.max(0.02, Math.abs(g.anchor.y - f.y)), 1 - y);
      onChange({ x: clamp01(x), y: clamp01(y), w, h });
    }
  };
  const onUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    gesture.current = null;
  };

  return (
    <div
      onPointerDown={startMove}
      onPointerMove={onMove}
      onPointerUp={onUp}
      className="absolute cursor-move border-2"
      style={{
        left: `${box.x * 100}%`,
        top: `${box.y * 100}%`,
        width: `${box.w * 100}%`,
        height: `${box.h * 100}%`,
        borderColor: color,
        background: `${color}22`,
        touchAction: 'none',
      }}
    >
      <span className="absolute -top-5 left-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: color }}>
        {label}
      </span>
      {CORNERS.map((id) => (
        <span
          key={id}
          onPointerDown={(e) => startResize(e, id)}
          className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{
            left: id === 'tl' || id === 'bl' ? 0 : '100%',
            top: id === 'tl' || id === 'tr' ? 0 : '100%',
            background: color,
            touchAction: 'none',
          }}
        />
      ))}
    </div>
  );
}

interface OutputCard {
  canvas: HTMLCanvasElement;
  blob: Blob;
  url: string;
  bytes: number;
}

async function canvasToOutput(canvas: HTMLCanvasElement): Promise<OutputCard> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) throw new Error('Could not encode this image.');
  return { canvas, blob, url: URL.createObjectURL(blob), bytes: blob.size };
}

interface PhotoState {
  file: File | null;
  previewUrl: string | null;
  /** Fraction of the photo to keep — defaults to the whole image (no crop). */
  box: FracBox;
}
const EMPTY_PHOTO: PhotoState = { file: null, previewUrl: null, box: FULL_BOX };

/** A photo of one side of the card: optional trim box (defaults to the full photo), then contain-fit to CR80. */
function PhotoPanel({
  title,
  state,
  onFiles,
  onBoxChange,
}: {
  title: string;
  state: PhotoState;
  onFiles: (files: File[]) => void;
  onBoxChange: (b: FracBox) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  return (
    <div className="card p-5">
      <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">{title}</h3>
      {!state.file && (
        <DropZone onFiles={onFiles} accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple={false} hint="A clear, straight-on photo of the whole card" />
      )}
      {state.file && state.previewUrl && (
        <>
          <div ref={stageRef} className="relative select-none rounded-xl border border-ink-200 dark:border-ink-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.previewUrl} alt={title} className="block w-full touch-none rounded-xl" draggable={false} />
            <RegionBox stageRef={stageRef} box={state.box} onChange={onBoxChange} color="#0d9089" label="Card" />
          </div>
          <p className="mt-2 text-center text-xs text-ink-400">
            The whole photo is used by default. Drag the corners in only if there's background around the card to trim off.
          </p>
        </>
      )}
    </div>
  );
}

export function IdCardPvcTool() {
  const [docType, setDocType] = useState<IdCardKind>('aadhaar');
  const preset = IDCARD_PDF_PRESETS[docType];
  const [inputMode, setInputMode] = useState<'pdf' | 'photos'>('pdf');
  // "Fill the frame" is the better default for a PVC card — nobody wants a
  // white border on a physical card, and the alternative is one click away.
  const [fitMode, setFitMode] = useState<Cr80FitMode>('cover');

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---------- PDF path ---------- */
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pageInfo, setPageInfo] = useState<{ url: string; width: number; height: number } | null>(null);
  const [passwordState, setPasswordState] = useState<'none' | 'required' | 'incorrect'>('none');
  const [password, setPassword] = useState('');
  const [frontBox, setFrontBox] = useState<FracBox>(preset.front);
  const [backBox, setBackBox] = useState<FracBox>(preset.back);
  const stageRef = useRef<HTMLDivElement>(null);

  /* ---------- Photos path ---------- */
  const [frontPhoto, setFrontPhoto] = useState<PhotoState>(EMPTY_PHOTO);
  const [backPhoto, setBackPhoto] = useState<PhotoState>(EMPTY_PHOTO);

  /* ---------- shared output ---------- */
  const [front, setFront] = useState<OutputCard | null>(null);
  const [back, setBack] = useState<OutputCard | null>(null);
  const [sheet, setSheet] = useState<OutputCard | null>(null);

  const clearOutputs = () => {
    setFront(null);
    setBack(null);
    setSheet(null);
  };

  const selectDocType = (id: IdCardKind) => {
    setDocType(id);
    setFrontBox(IDCARD_PDF_PRESETS[id].front);
    setBackBox(IDCARD_PDF_PRESETS[id].back);
    clearOutputs();
  };

  const onPdfFile = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setPdfFile(f);
    pageCanvasRef.current = null;
    setPageInfo(null);
    setPasswordState('none');
    setPassword('');
    setFrontBox(preset.front);
    setBackBox(preset.back);
    clearOutputs();
    setError(null);
  };

  const loadPage = async (pw?: string) => {
    if (!pdfFile) return;
    setBusy('Reading PDF…');
    setError(null);
    try {
      const { renderPdfPage1 } = await import('@/lib/idcard/pdf-page');
      const outcome = await renderPdfPage1(pdfFile, { password: pw });
      if (outcome.status === 'password') {
        setPasswordState(outcome.kind);
        return;
      }
      setPasswordState('none');
      pageCanvasRef.current = outcome.page.canvas;
      const blob = await new Promise<Blob | null>((r) => outcome.page.canvas.toBlob(r, 'image/jpeg', 0.85));
      if (!blob) throw new Error('Could not preview this page.');
      setPageInfo({ url: URL.createObjectURL(blob), width: outcome.page.width, height: outcome.page.height });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That PDF could not be read.');
    } finally {
      setBusy(null);
    }
  };

  const addPhoto = (which: 'front' | 'back') => (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const setState = which === 'front' ? setFrontPhoto : setBackPhoto;
    setState({ file: f, previewUrl: URL.createObjectURL(f), box: FULL_BOX });
    clearOutputs();
  };

  /**
   * The whole photo is used by default (box = full image) — contain-fit into
   * CR80, never a forced-aspect crop. A real card's proportions rarely match
   * CR80's exactly, so cropping to that shape can cut pieces of the card off;
   * padding with a thin white margin instead keeps the whole card intact.
   */
  const processPhoto = async (photo: PhotoState): Promise<HTMLCanvasElement> => {
    if (!photo.file) throw new Error('Add both photos first.');
    const { decodeImage } = await import('@/lib/image/canvas');
    const { cropRegion } = await import('@/lib/idcard/region');
    const { renderToCr80 } = await import('@/lib/idcard/compose');
    const decoded = await decodeImage(photo.file);
    const cropped = cropRegion(decoded.bitmap, decoded.width, decoded.height, photo.box);
    decoded.bitmap.close();
    return renderToCr80(cropped, cropped.width, cropped.height, fitMode);
  };

  const extractFromPdf = async () => {
    if (!pageCanvasRef.current || !pageInfo) return;
    setBusy('Extracting front & back…');
    setError(null);
    setSheet(null);
    try {
      const { cropRegion } = await import('@/lib/idcard/region');
      const { renderToCr80 } = await import('@/lib/idcard/compose');
      const frontCrop = cropRegion(pageCanvasRef.current, pageInfo.width, pageInfo.height, frontBox);
      const backCrop = cropRegion(pageCanvasRef.current, pageInfo.width, pageInfo.height, backBox);
      const [frontOut, backOut] = await Promise.all([
        canvasToOutput(renderToCr80(frontCrop, frontCrop.width, frontCrop.height, fitMode)),
        canvasToOutput(renderToCr80(backCrop, backCrop.width, backCrop.height, fitMode)),
      ]);
      setFront(frontOut);
      setBack(backOut);
      track('tool_completed', { toolSlug: 'aadhaar-ayushman-pvc', category: 'pdf', meta: { doc: docType, input: 'pdf' } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not extract the front and back.');
    } finally {
      setBusy(null);
    }
  };

  const extractFromPhotos = async () => {
    setBusy('Processing photos…');
    setError(null);
    setSheet(null);
    try {
      const [frontCanvas, backCanvas] = await Promise.all([processPhoto(frontPhoto), processPhoto(backPhoto)]);
      const [frontOut, backOut] = await Promise.all([canvasToOutput(frontCanvas), canvasToOutput(backCanvas)]);
      setFront(frontOut);
      setBack(backOut);
      track('tool_completed', { toolSlug: 'aadhaar-ayushman-pvc', category: 'pdf', meta: { doc: docType, input: 'photos' } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not process these photos.');
    } finally {
      setBusy(null);
    }
  };

  const makeSheet = async () => {
    if (!front || !back) return;
    setBusy('Building print sheet…');
    setError(null);
    try {
      const { renderA4Sheet } = await import('@/lib/idcard/compose');
      setSheet(await canvasToOutput(renderA4Sheet(front.canvas, back.canvas)));
      track('tool_completed', { toolSlug: 'aadhaar-ayushman-pvc', category: 'pdf', meta: { doc: docType, part: 'sheet' } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build the print sheet.');
    } finally {
      setBusy(null);
    }
  };

  const canExtractPhotos = Boolean(frontPhoto.file && backPhoto.file);

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <p className="mb-3 text-sm font-medium text-ink-700 dark:text-ink-200">Which card?</p>
        <div className="flex flex-wrap gap-2">
          {Object.values(IDCARD_PDF_PRESETS).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectDocType(p.id)}
              aria-pressed={docType === p.id}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                docType === p.id ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300',
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <p className="mb-3 text-sm font-medium text-ink-700 dark:text-ink-200">What are you starting from?</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setInputMode('pdf')}
            aria-pressed={inputMode === 'pdf'}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
              inputMode === 'pdf' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300',
            )}
          >
            <FileText className="h-4 w-4" /> The official PDF download
          </button>
          <button
            type="button"
            onClick={() => setInputMode('photos')}
            aria-pressed={inputMode === 'photos'}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
              inputMode === 'photos' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300',
            )}
          >
            <ImageIcon className="h-4 w-4" /> Photos of the printed card
          </button>
        </div>
      </div>

      <div className="card p-5">
        <p className="mb-3 text-sm font-medium text-ink-700 dark:text-ink-200">How should it fit the PVC card?</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setFitMode('contain');
              clearOutputs();
            }}
            aria-pressed={fitMode === 'contain'}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition',
              fitMode === 'contain' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300',
            )}
          >
            Fit whole card
          </button>
          <button
            type="button"
            onClick={() => {
              setFitMode('cover');
              clearOutputs();
            }}
            aria-pressed={fitMode === 'cover'}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition',
              fitMode === 'cover' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300',
            )}
          >
            Fill the frame
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-400">
          {fitMode === 'contain'
            ? 'Keeps the whole card visible — if its shape doesn\'t exactly match a PVC card, you\'ll see a thin white border. Nothing is ever cropped.'
            : 'Fills the card edge to edge with no white border, by trimming a thin sliver off two opposite sides if the shapes don\'t match exactly. Check the preview to make sure nothing important (the photo or QR code) got trimmed.'}
        </p>
      </div>

      {inputMode === 'pdf' ? (
        <div className="space-y-4">
          {!pdfFile && (
            <div className="card p-5">
              <DropZone onFiles={onPdfFile} accept="application/pdf,.pdf" multiple={false} hint={`The ${preset.name} PDF you downloaded`} />
            </div>
          )}

          {pdfFile && passwordState !== 'none' && (
            <div className="card p-5">
              <div className="mb-3 flex items-start gap-2 text-sm text-ink-700 dark:text-ink-200">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {passwordState === 'incorrect' ? "That password didn't work — try again." : 'This PDF is password-protected.'}
                  {preset.passwordHint && <span className="mt-1 block text-xs text-ink-400">{preset.passwordHint}</span>}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="PDF password"
                  className="h-10 flex-1 rounded-lg border border-ink-300 bg-transparent px-3 text-sm dark:border-ink-600"
                />
                <Button onClick={() => void loadPage(password)} disabled={!password || !!busy}>
                  Unlock
                </Button>
              </div>
            </div>
          )}

          {pdfFile && passwordState === 'none' && !pageInfo && !error && (
            <ProgressIndicator value={40} label="Reading PDF…" />
          )}

          {pageInfo && (
            <div className="space-y-3">
              <p className="text-center text-xs text-ink-400">{preset.note}</p>
              <div ref={stageRef} className="relative mx-auto max-w-2xl select-none rounded-xl border border-ink-200 dark:border-ink-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pageInfo.url} alt="PDF page preview" className="block w-full touch-none rounded-xl" draggable={false} />
                <RegionBox stageRef={stageRef} box={frontBox} onChange={setFrontBox} color="#0d9089" label="Front" />
                <RegionBox stageRef={stageRef} box={backBox} onChange={setBackBox} color="#d97706" label="Back" />
              </div>
              <div className="flex justify-center">
                <ProcessButton onClick={extractFromPdf} busy={!!busy}>
                  Extract front &amp; back
                </ProcessButton>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <PhotoPanel title="Front photo" state={frontPhoto} onFiles={addPhoto('front')} onBoxChange={(b) => setFrontPhoto((p) => ({ ...p, box: b }))} />
          <PhotoPanel title="Back photo" state={backPhoto} onFiles={addPhoto('back')} onBoxChange={(b) => setBackPhoto((p) => ({ ...p, box: b }))} />
          <div className="flex justify-center sm:col-span-2">
            <ProcessButton onClick={extractFromPhotos} busy={!!busy} disabled={!canExtractPhotos}>
              Process front &amp; back
            </ProcessButton>
          </div>
        </div>
      )}

      {busy && <ProgressIndicator value={50} label={busy} />}
      {error && <Alert tone="error">{error}</Alert>}

      {front && back && (
        <div className="card p-5">
          <Alert tone="success" className="mb-4">
            Front and back are ready — {CR80.width}×{CR80.height}px each (CR80, 300 DPI).
          </Alert>
          <div className="mb-4 flex flex-wrap justify-center gap-6">
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={front.url} alt="Front" className="h-32 rounded-lg border border-ink-200 shadow-sm dark:border-ink-800" />
              <p className="mt-1 text-xs text-ink-400">Front — {formatBytes(front.bytes)}</p>
            </div>
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={back.url} alt="Back" className="h-32 rounded-lg border border-ink-200 shadow-sm dark:border-ink-800" />
              <p className="mt-1 text-xs text-ink-400">Back — {formatBytes(back.bytes)}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <DownloadButton onClick={() => downloadBlob(front.blob, `${docType}-front.jpg`)}>Download front</DownloadButton>
            <DownloadButton onClick={() => downloadBlob(back.blob, `${docType}-back.jpg`)}>Download back</DownloadButton>
            <Button variant="secondary" onClick={makeSheet} disabled={!!busy}>
              <Printer className="h-4 w-4" /> Build A4 print sheet
            </Button>
          </div>
        </div>
      )}

      {sheet && (
        <div className="card p-5">
          <Alert tone="success" className="mb-4">
            Print sheet ready — front and back side by side on A4 at 300 DPI. Print at 100% scale (not "fit to page").
          </Alert>
          <DownloadButton onClick={() => downloadBlob(sheet.blob, `${docType}-pvc-sheet.jpg`)}>
            Download print-ready sheet
          </DownloadButton>
        </div>
      )}
    </div>
  );
}
