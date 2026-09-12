'use client';

import { useEffect, useRef, useState } from 'react';
import { Crop as CropIcon, RotateCcw } from 'lucide-react';
import { FILE_LIMITS } from '@/config/site';
import { useFileTool } from '@/lib/hooks/useFileTool';
import { downloadBlob, bytesToBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { DropZone } from '@/components/file/DropZone';
import { FileList } from '@/components/file/FileList';
import { ProcessButton, ProgressIndicator, DownloadButton } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import type { CropBox, CropMap } from '@/lib/pdf/crop';

const L = FILE_LIMITS.pdf;
const FULL: CropBox = { x: 0, y: 0, w: 1, h: 1 };
const MIN_SIZE = 0.04;

type Corner = 'tl' | 'tr' | 'br' | 'bl';
interface Pt {
  x: number;
  y: number;
}
interface Thumb {
  pageNumber: number;
  url: string;
  w: number;
  h: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const isFull = (b: CropBox) => b.x < 0.005 && b.y < 0.005 && b.w > 0.995 && b.h > 0.995;

function anchorFor(corner: Corner, box: CropBox): Pt {
  switch (corner) {
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

const PRESETS: { id: string; label: string; box?: CropBox }[] = [
  { id: 'reset', label: 'Reset', box: FULL },
  { id: 'margin5', label: '5% margin', box: { x: 0.05, y: 0.05, w: 0.9, h: 0.9 } },
  { id: 'margin10', label: '10% margin', box: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 } },
  { id: 'top', label: 'Top half', box: { x: 0, y: 0, w: 1, h: 0.5 } },
  { id: 'bottom', label: 'Bottom half', box: { x: 0, y: 0.5, w: 1, h: 0.5 } },
  { id: 'left', label: 'Left half', box: { x: 0, y: 0, w: 0.5, h: 1 } },
  { id: 'right', label: 'Right half', box: { x: 0.5, y: 0, w: 0.5, h: 1 } },
];

export function CropPdfTool() {
  const ft = useFileTool({
    toolSlug: 'crop-pdf',
    category: 'pdf',
    accept: ['pdf'],
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: 1,
    multiple: false,
  });
  const file = ft.validFiles[0]?.file ?? null;

  const [pages, setPages] = useState<Thumb[]>([]);
  const [loadingThumbs, setLoadingThumbs] = useState(false);
  const [mode, setMode] = useState<'uniform' | 'individual'>('uniform');
  const [sharedBox, setSharedBox] = useState<CropBox>(FULL);
  const [boxes, setBoxes] = useState<Record<number, CropBox>>({});
  const [activePage, setActivePage] = useState(1);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<Blob | null>(null);

  useEffect(() => {
    setOutput(null);
    setError(null);
    setSharedBox(FULL);
    setBoxes({});
    setActivePage(1);
    setPages((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
    if (!file) return;

    let cancelled = false;
    setLoadingThumbs(true);
    (async () => {
      try {
        const [{ pdfToImages }, buf] = await Promise.all([import('@/lib/pdf/to-images'), file.arrayBuffer()]);
        const rendered = await pdfToImages(buf, { dpi: 100, quality: 0.75, mime: 'image/jpeg' });
        if (cancelled) return;
        setPages(rendered.map((p) => ({ pageNumber: p.pageNumber, url: URL.createObjectURL(p.blob), w: p.width, h: p.height })));
      } catch (e) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error('crop-pdf: failed to render pages', e);
          const { describePdfLoadError } = await import('@/lib/pdf/pdfjs');
          setError(describePdfLoadError(e));
        }
      } finally {
        if (!cancelled) setLoadingThumbs(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const activeThumb = pages.find((p) => p.pageNumber === activePage) ?? pages[0];
  const activeBox = mode === 'uniform' ? sharedBox : boxes[activePage] ?? FULL;

  const setActiveBox = (b: CropBox) => {
    setOutput(null);
    if (mode === 'uniform') setSharedBox(b);
    else setBoxes((prev) => ({ ...prev, [activePage]: b }));
  };

  const boxForThumb = (pageNumber: number): CropBox =>
    mode === 'uniform' ? sharedBox : boxes[pageNumber] ?? FULL;

  const setMargin = (side: 'left' | 'right' | 'top' | 'bottom', pct: number) => {
    const v = clamp(pct, 0, 45) / 100;
    if (side === 'left' || side === 'right') {
      const left = side === 'left' ? v : activeBox.x;
      const right = side === 'right' ? v : 1 - activeBox.x - activeBox.w;
      const w = Math.max(MIN_SIZE, 1 - left - right);
      setActiveBox({ ...activeBox, x: Math.min(left, 1 - MIN_SIZE), w });
    } else {
      const top = side === 'top' ? v : activeBox.y;
      const bottom = side === 'bottom' ? v : 1 - activeBox.y - activeBox.h;
      const h = Math.max(MIN_SIZE, 1 - top - bottom);
      setActiveBox({ ...activeBox, y: Math.min(top, 1 - MIN_SIZE), h });
    }
  };

  const margins = {
    left: Math.round(activeBox.x * 100),
    right: Math.round((1 - activeBox.x - activeBox.w) * 100),
    top: Math.round(activeBox.y * 100),
    bottom: Math.round((1 - activeBox.y - activeBox.h) * 100),
  };

  const nothingToCrop =
    mode === 'uniform' ? isFull(sharedBox) : pages.every((p) => isFull(boxes[p.pageNumber] ?? FULL));

  const run = async () => {
    if (!file || pages.length === 0) return;
    const map: CropMap = {};
    for (const p of pages) map[p.pageNumber] = mode === 'uniform' ? sharedBox : boxes[p.pageNumber] ?? FULL;
    setBusy(true);
    setError(null);
    setOutput(null);
    try {
      const [{ cropPdf }, buf] = await Promise.all([import('@/lib/pdf/crop'), file.arrayBuffer()]);
      const bytes = await cropPdf(buf, map);
      setOutput(bytesToBlob(bytes, 'application/pdf'));
      track('tool_completed', { toolSlug: 'crop-pdf', category: 'pdf', meta: { pages: pages.length, mode } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while cropping this PDF.');
      track('tool_failed', { toolSlug: 'crop-pdf', category: 'pdf' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <DropZone
        onFiles={ft.addFiles}
        accept="application/pdf,.pdf"
        multiple={false}
        hint={`One PDF, up to ${L.maxFileSizeMB} MB`}
        disabled={busy}
      />
      <FileList files={ft.files} onRemove={ft.removeFile} />

      {loadingThumbs && <ProgressIndicator value={50} label="Loading pages…" />}

      {pages.length > 0 && (
        <div className="mt-4 space-y-4">
          {/* mode + presets */}
          <div className="card space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Crop:</span>
              {(['uniform', 'individual'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                    mode === m
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300',
                  )}
                >
                  {m === 'uniform' ? 'Same for every page' : 'Each page individually'}
                </button>
              ))}
              {mode === 'individual' && (
                <span className="text-xs text-ink-400">— editing page {activePage}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => p.box && setActiveBox(p.box)}
                  className="rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
                >
                  {p.id === 'reset' && <RotateCcw className="mr-1 inline h-3 w-3" />}
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                <label key={side} className="flex items-center gap-1.5 text-xs text-ink-500">
                  <span className="w-10 capitalize">{side}</span>
                  <input
                    type="number"
                    min={0}
                    max={45}
                    value={margins[side]}
                    onChange={(e) => setMargin(side, Number(e.target.value) || 0)}
                    className="w-14 rounded border border-ink-300 bg-transparent px-1.5 py-1 text-xs dark:border-ink-600"
                  />
                  %
                </label>
              ))}
            </div>
          </div>

          {/* big editor */}
          {activeThumb && (
            <div className="mx-auto max-w-xl">
              <p className="mb-1.5 text-center text-xs text-ink-400">
                Drag the corners to set the crop area for {mode === 'uniform' ? 'every page' : `page ${activePage}`}.
              </p>
              <CropStage page={activeThumb} box={activeBox} onChange={setActiveBox} />
            </div>
          )}

          {/* thumbnail strip */}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {pages.map((p) => (
              <button
                key={p.pageNumber}
                type="button"
                onClick={() => setActivePage(p.pageNumber)}
                className={cn(
                  'relative overflow-hidden rounded-lg border-2 p-1 transition',
                  p.pageNumber === activePage
                    ? 'border-brand-500'
                    : 'border-transparent hover:border-ink-300 dark:hover:border-ink-600',
                )}
                title={`Page ${p.pageNumber}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded bg-ink-50 dark:bg-ink-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`Page ${p.pageNumber}`} className="h-full w-full object-contain" />
                  <CropDim box={boxForThumb(p.pageNumber)} />
                </div>
                <span className="mt-1 block text-center text-[11px] text-ink-400">{p.pageNumber}</span>
              </button>
            ))}
          </div>

          <ProcessButton onClick={run} busy={busy} disabled={nothingToCrop}>
            Crop &amp; download PDF
          </ProcessButton>
          {nothingToCrop && (
            <p className="text-center text-xs text-ink-400">
              Drag a corner or use a preset to set the crop area first.
            </p>
          )}
        </div>
      )}

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      {output && (
        <div className="mt-4 space-y-3">
          <Alert tone="success">Your cropped PDF is ready.</Alert>
          <div className="flex flex-wrap gap-2">
            <DownloadButton onClick={() => downloadBlob(output, 'cropped.pdf')}>Download cropped.pdf</DownloadButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dim overlay for a read-only preview (thumbnails)                          */
/* -------------------------------------------------------------------------- */

function CropDim({ box }: { box: CropBox }) {
  if (isFull(box)) return null;
  const shade = 'absolute bg-ink-950/55';
  return (
    <>
      <div className={shade} style={{ left: 0, top: 0, width: '100%', height: `${box.y * 100}%` }} />
      <div
        className={shade}
        style={{ left: 0, top: `${(box.y + box.h) * 100}%`, width: '100%', height: `${(1 - box.y - box.h) * 100}%` }}
      />
      <div
        className={shade}
        style={{ left: 0, top: `${box.y * 100}%`, width: `${box.x * 100}%`, height: `${box.h * 100}%` }}
      />
      <div
        className={shade}
        style={{
          left: `${(box.x + box.w) * 100}%`,
          top: `${box.y * 100}%`,
          width: `${(1 - box.x - box.w) * 100}%`,
          height: `${box.h * 100}%`,
        }}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Interactive crop rectangle                                                 */
/* -------------------------------------------------------------------------- */

function CropStage({
  page,
  box,
  onChange,
}: {
  page: Thumb;
  box: CropBox;
  onChange: (b: CropBox) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<
    | null
    | { kind: 'move'; startFx: number; startFy: number; startBox: CropBox }
    | { kind: 'resize'; anchor: Pt }
  >(null);

  const fracAt = (e: React.PointerEvent): Pt => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: clamp01((e.clientX - r.left) / r.width), y: clamp01((e.clientY - r.top) / r.height) };
  };

  const startMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const f = fracAt(e);
    gesture.current = { kind: 'move', startFx: f.x, startFy: f.y, startBox: box };
  };
  const startResize = (e: React.PointerEvent, corner: Corner) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    gesture.current = { kind: 'resize', anchor: anchorFor(corner, box) };
  };
  const onMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const f = fracAt(e);
    if (g.kind === 'move') {
      const dx = f.x - g.startFx;
      const dy = f.y - g.startFy;
      onChange({
        x: clamp(g.startBox.x + dx, 0, 1 - g.startBox.w),
        y: clamp(g.startBox.y + dy, 0, 1 - g.startBox.h),
        w: g.startBox.w,
        h: g.startBox.h,
      });
    } else {
      const x = Math.min(g.anchor.x, f.x);
      const y = Math.min(g.anchor.y, f.y);
      const w = Math.min(Math.max(MIN_SIZE, Math.abs(g.anchor.x - f.x)), 1 - x);
      const h = Math.min(Math.max(MIN_SIZE, Math.abs(g.anchor.y - f.y)), 1 - y);
      onChange({ x: clamp01(x), y: clamp01(y), w, h });
    }
  };
  const onUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    gesture.current = null;
  };

  const corners: { id: Corner; left: number; top: number; cursor: string }[] = [
    { id: 'tl', left: box.x, top: box.y, cursor: 'nwse-resize' },
    { id: 'tr', left: box.x + box.w, top: box.y, cursor: 'nesw-resize' },
    { id: 'br', left: box.x + box.w, top: box.y + box.h, cursor: 'nwse-resize' },
    { id: 'bl', left: box.x, top: box.y + box.h, cursor: 'nesw-resize' },
  ];

  return (
    <div className="p-3">
      <div
        ref={stageRef}
        className="relative touch-none select-none rounded-lg border border-ink-200 dark:border-ink-800"
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={page.url} alt={`Page ${page.pageNumber}`} className="block w-full rounded-lg" draggable={false} />
        <CropDim box={box} />
        <div
          onPointerDown={startMove}
          className="absolute cursor-move border-2 border-brand-500"
          style={{
            left: `${box.x * 100}%`,
            top: `${box.y * 100}%`,
            width: `${box.w * 100}%`,
            height: `${box.h * 100}%`,
          }}
        />
        {corners.map((c) => (
          <span
            key={c.id}
            onPointerDown={(e) => startResize(e, c.id)}
            className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-600 shadow-md"
            style={{ left: `${c.left * 100}%`, top: `${c.top * 100}%`, cursor: c.cursor, touchAction: 'none' }}
          />
        ))}
      </div>
      <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-ink-400">
        <CropIcon className="h-3.5 w-3.5" /> {Math.round(box.w * 100)}% × {Math.round(box.h * 100)}% of the page
      </p>
    </div>
  );
}
