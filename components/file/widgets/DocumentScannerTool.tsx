'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Upload, RotateCw, X, Check, Trash2, ArrowUp, ArrowDown, ScanLine } from 'lucide-react';
import { track } from '@/lib/analytics/client';
import { downloadBlob, bytesToBlob } from '@/lib/download';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { ProgressIndicator } from '@/components/file/ProcessBar';
import { cn } from '@/lib/cn';
import { orderQuad, defaultQuad, type Quad, type Pt } from '@/lib/scanner/geometry';
import type { EnhanceMode } from '@/lib/scanner/enhance';
import {
  cameraSupported,
  startCamera,
  stopCamera,
  grabFrame,
  type CameraHandle,
} from '@/lib/scanner/camera';
import { createLiveDetector, type LiveDetector } from '@/lib/scanner/live';

// pdf-lib, canvas/warp/enhance stay out of the page bundle — loaded on first use.
const loadProcess = () => import('@/lib/scanner/process');
const loadDecode = () => import('@/lib/image/canvas');

type Stage = 'idle' | 'camera' | 'review';

interface Review {
  id: string | null; // set when re-editing an existing page
  source: Blob;
  srcUrl: string;
  width: number;
  height: number;
  quad: Quad;
  rotate: number;
  fromCamera: boolean;
}

interface Page {
  id: string;
  source: Blob;
  width: number;
  height: number;
  quad: Quad;
  rotate: number;
  processedUrl: string;
  processedW: number;
  processedH: number;
  processedBlob: Blob;
}

const MODES: { id: EnhanceMode; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'color', label: 'Colour' },
  { id: 'grey', label: 'Greyscale' },
  { id: 'bw', label: 'B & W' },
  { id: 'original', label: 'Original' },
];

let seq = 0;
const uid = () => `p${Date.now().toString(36)}${seq++}`;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function DocumentScannerTool() {
  const [stage, setStage] = useState<Stage>('idle');
  const [pages, setPages] = useState<Page[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [mode, setMode] = useState<EnhanceMode>('auto');
  const [autoCapture, setAutoCapture] = useState(true);
  const autoCaptureRef = useRef(autoCapture);
  autoCaptureRef.current = autoCapture;

  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef<CameraHandle | null>(null);
  const detectorRef = useRef<LiveDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const liveQuadRef = useRef<{ quad: Quad; score: number } | null>(null);
  const stableRef = useRef<{ quad: Quad; since: number } | null>(null);
  const capturingRef = useRef(false);

  const getDetector = useCallback(() => {
    if (!detectorRef.current) detectorRef.current = createLiveDetector();
    return detectorRef.current;
  }, []);

  /* ---------- cleanup ---------- */
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopCamera(camRef.current);
      camRef.current = null;
      detectorRef.current?.close();
      pages.forEach((p) => URL.revokeObjectURL(p.processedUrl));
      if (review) URL.revokeObjectURL(review.srcUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- detection helpers ---------- */
  const rgbaFrom = (img: CanvasImageSource, w: number, h: number) => {
    let c = scratchRef.current;
    if (!c) {
      c = document.createElement('canvas');
      scratchRef.current = c;
    }
    const cap = 640;
    const scale = Math.min(1, cap / Math.max(w, h));
    c.width = Math.max(1, Math.round(w * scale));
    c.height = Math.max(1, Math.round(h * scale));
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const data = ctx.getImageData(0, 0, c.width, c.height);
    return { data, scaleBack: 1 / scale };
  };

  const detectOnBitmap = async (bitmap: ImageBitmap, w: number, h: number): Promise<Quad> => {
    try {
      const { data, scaleBack } = rgbaFrom(bitmap, w, h);
      const buf = data.data.buffer.slice(0);
      const res = await getDetector().detect(buf, data.width, data.height);
      if (res) return orderQuad(res.quad.map((p) => ({ x: p.x * scaleBack, y: p.y * scaleBack })));
    } catch {
      /* fall through to default */
    }
    return defaultQuad(w, h);
  };

  /* ---------- camera ---------- */
  const openCamera = async () => {
    setError(null);
    try {
      const handle = await startCamera();
      camRef.current = handle;
      setStage('camera');
      // wait a tick for <video> to mount
      requestAnimationFrame(() => {
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = handle.stream;
        v.play().catch(() => undefined);
        loopDetect();
      });
    } catch (e) {
      const name = e instanceof Error ? e.name : '';
      setError(
        name === 'NotAllowedError'
          ? 'Camera access was blocked. Allow it in your browser’s site settings, or use “Upload / take a photo”.'
          : name === 'NotFoundError'
            ? 'No camera was found on this device. Use “Upload / take a photo” instead.'
            : 'Could not start the camera. Use “Upload / take a photo” instead.',
      );
      setStage('idle');
    }
  };

  const closeCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    stopCamera(camRef.current);
    camRef.current = null;
    liveQuadRef.current = null;
    stableRef.current = null;
    setStage('idle');
  };

  const loopDetect = () => {
    const v = videoRef.current;
    const overlay = overlayRef.current;
    if (!v || !camRef.current) return;

    const run = async () => {
      if (!camRef.current) return;
      if (!v.videoWidth || capturingRef.current) {
        rafRef.current = requestAnimationFrame(run);
        return;
      }
      if (overlay && (overlay.width !== v.videoWidth || overlay.height !== v.videoHeight)) {
        overlay.width = v.videoWidth;
        overlay.height = v.videoHeight;
      }
      try {
        const { data, scaleBack } = rgbaFrom(v, v.videoWidth, v.videoHeight);
        const buf = data.data.buffer.slice(0);
        const res = await getDetector().detect(buf, data.width, data.height);
        if (res && camRef.current) {
          const quad = orderQuad(
            res.quad.map((p) => ({ x: p.x * scaleBack, y: p.y * scaleBack })),
          ) as Quad;
          liveQuadRef.current = { quad, score: res.score };
          drawOverlay(quad, res.score);
          maybeAutoCapture(quad, res.score);
        } else {
          liveQuadRef.current = null;
          drawOverlay(null, 0);
          stableRef.current = null;
        }
      } catch {
        /* keep looping */
      }
      // ~8 fps is plenty for framing feedback
      window.setTimeout(() => {
        rafRef.current = requestAnimationFrame(run);
      }, 110);
    };
    run();
  };

  const drawOverlay = (quad: Quad | null, score: number) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (!quad) return;
    const good = score > 0.55;
    ctx.lineWidth = Math.max(3, overlay.width / 250);
    ctx.strokeStyle = good ? '#22c55e' : '#f59e0b';
    ctx.fillStyle = good ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.10)';
    ctx.beginPath();
    quad.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const maybeAutoCapture = (quad: Quad, score: number) => {
    if (!autoCaptureRef.current || score < 0.6) {
      stableRef.current = null;
      return;
    }
    const prev = stableRef.current;
    const moved =
      !prev ||
      quad.some((p, i) => {
        const q = prev.quad[i]!;
        const v = videoRef.current;
        const diag = v ? Math.hypot(v.videoWidth, v.videoHeight) : 1000;
        return Math.hypot(p.x - q.x, p.y - q.y) > diag * 0.02;
      });
    if (moved) {
      stableRef.current = { quad, since: performance.now() };
      return;
    }
    if (performance.now() - prev!.since > 1200) {
      stableRef.current = null;
      void capture();
    }
  };

  const capture = async () => {
    const v = videoRef.current;
    const handle = camRef.current;
    if (!v || !handle || capturingRef.current) return;
    capturingRef.current = true;
    try {
      const frame = await grabFrame(v, handle);
      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      canvas.getContext('2d')!.drawImage(frame.bitmap, 0, 0);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.92));
      frame.bitmap.close();
      if (!blob) throw new Error('Could not read the camera frame.');
      const bmp = await createImageBitmap(blob);
      const quad = await detectOnBitmap(bmp, bmp.width, bmp.height);
      bmp.close();
      openReview({ source: blob, width: frame.width, height: frame.height, quad, fromCamera: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Capture failed. Try again.');
    } finally {
      capturingRef.current = false;
    }
  };

  /* ---------- upload / native capture ---------- */
  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError(null);
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) {
      setError('Choose image files (JPG, PNG or WebP).');
      return;
    }
    const { decodeImage } = await loadDecode();
    // Single file → review it. Multiple → auto-detect each and add straight to the tray.
    if (list.length === 1) {
      try {
        const file = list[0]!;
        const decoded = await decodeImage(file);
        const quad = await detectOnBitmap(decoded.bitmap, decoded.width, decoded.height);
        decoded.bitmap.close();
        openReview({ source: file, width: decoded.width, height: decoded.height, quad, fromCamera: false });
      } catch {
        setError('That image could not be read.');
      }
      return;
    }
    setBusy('Adding pages…');
    setProgress(0);
    try {
      const added: Page[] = [];
      for (let i = 0; i < list.length; i += 1) {
        const file = list[i]!;
        const decoded = await decodeImage(file);
        const quad = await detectOnBitmap(decoded.bitmap, decoded.width, decoded.height);
        decoded.bitmap.close();
        added.push(await buildPage({ source: file, width: decoded.width, height: decoded.height, quad, rotate: 0 }));
        setProgress((i + 1) / list.length);
      }
      setPages((prev) => [...prev, ...added]);
      setOutput(null);
      track('tool_started', { toolSlug: 'document-scanner', category: 'pdf', meta: { count: list.length } });
    } catch {
      setError('One of those images could not be processed.');
    } finally {
      setBusy(null);
    }
  };

  /* ---------- review ---------- */
  const openReview = (p: {
    id?: string;
    source: Blob;
    width: number;
    height: number;
    quad: Quad;
    rotate?: number;
    fromCamera: boolean;
  }) => {
    if (review) URL.revokeObjectURL(review.srcUrl);
    setReview({
      id: p.id ?? null,
      source: p.source,
      srcUrl: URL.createObjectURL(p.source),
      width: p.width,
      height: p.height,
      quad: p.quad,
      rotate: p.rotate ?? 0,
      fromCamera: p.fromCamera,
    });
    setStage('review');
  };

  const editPage = (page: Page) => {
    stopCamera(camRef.current);
    camRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    openReview({
      id: page.id,
      source: page.source,
      width: page.width,
      height: page.height,
      quad: page.quad,
      rotate: page.rotate,
      fromCamera: false,
    });
  };

  const buildPage = async (p: {
    id?: string;
    source: Blob;
    width: number;
    height: number;
    quad: Quad;
    rotate: number;
  }): Promise<Page> => {
    const { processPage } = await loadProcess();
    const processed = await processPage({ source: p.source, quad: p.quad, rotate: p.rotate, mode });
    return {
      id: p.id ?? uid(),
      source: p.source,
      width: p.width,
      height: p.height,
      quad: p.quad,
      rotate: p.rotate,
      processedBlob: processed.blob,
      processedUrl: URL.createObjectURL(processed.blob),
      processedW: processed.width,
      processedH: processed.height,
    };
  };

  const commitReview = async () => {
    if (!review) return;
    setBusy('Processing page…');
    try {
      const built = await buildPage({
        id: review.id ?? undefined,
        source: review.source,
        width: review.width,
        height: review.height,
        quad: review.quad,
        rotate: review.rotate,
      });
      setPages((prev) => {
        const idx = review.id ? prev.findIndex((p) => p.id === review.id) : -1;
        if (idx >= 0) {
          URL.revokeObjectURL(prev[idx]!.processedUrl);
          const copy = [...prev];
          copy[idx] = built;
          return copy;
        }
        return [...prev, built];
      });
      setOutput(null);
      URL.revokeObjectURL(review.srcUrl);
      setReview(null);
      if (review.fromCamera && camRef.current) {
        setStage('camera');
        requestAnimationFrame(() => loopDetect());
      } else {
        setStage('idle');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not process this page.');
    } finally {
      setBusy(null);
    }
  };

  const cancelReview = () => {
    if (!review) return;
    URL.revokeObjectURL(review.srcUrl);
    const back = review.fromCamera && camRef.current;
    setReview(null);
    if (back) {
      setStage('camera');
      requestAnimationFrame(() => loopDetect());
    } else {
      setStage('idle');
    }
  };

  /* ---------- pages / mode ---------- */
  const reprocessAll = async (nextMode: EnhanceMode) => {
    setMode(nextMode);
    if (pages.length === 0) return;
    setBusy('Applying filter…');
    setProgress(0);
    try {
      const { processPage } = await loadProcess();
      const next: Page[] = [];
      for (let i = 0; i < pages.length; i += 1) {
        const p = pages[i]!;
        const processed = await processPage({ source: p.source, quad: p.quad, rotate: p.rotate, mode: nextMode });
        URL.revokeObjectURL(p.processedUrl);
        next.push({
          ...p,
          processedBlob: processed.blob,
          processedUrl: URL.createObjectURL(processed.blob),
          processedW: processed.width,
          processedH: processed.height,
        });
        setProgress((i + 1) / pages.length);
      }
      setPages(next);
      setOutput(null);
    } catch {
      setError('Could not re-apply the filter to every page.');
    } finally {
      setBusy(null);
    }
  };

  const removePage = (id: string) => {
    setPages((prev) => {
      const p = prev.find((x) => x.id === id);
      if (p) URL.revokeObjectURL(p.processedUrl);
      return prev.filter((x) => x.id !== id);
    });
    setOutput(null);
  };

  const movePage = (id: string, dir: -1 | 1) => {
    setPages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[j]] = [copy[j]!, copy[idx]!];
      return copy;
    });
    setOutput(null);
  };

  const rotatePage = (id: string) => {
    const page = pages.find((p) => p.id === id);
    if (!page || busy) return;
    void (async () => {
      setBusy('Rotating…');
      try {
        const { processPage } = await loadProcess();
        const rotate = (page.rotate + 90) % 360;
        const processed = await processPage({ source: page.source, quad: page.quad, rotate, mode });
        URL.revokeObjectURL(page.processedUrl);
        setPages((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  rotate,
                  processedBlob: processed.blob,
                  processedUrl: URL.createObjectURL(processed.blob),
                  processedW: processed.width,
                  processedH: processed.height,
                }
              : p,
          ),
        );
        setOutput(null);
      } finally {
        setBusy(null);
      }
    })();
  };

  /* ---------- export ---------- */
  const exportPdf = async () => {
    if (pages.length === 0) return;
    setBusy('Building PDF…');
    try {
      const { scansToPdf } = await import('@/lib/scanner/to-pdf');
      const bytes = await scansToPdf(
        pages.map((p) => ({ blob: p.processedBlob, width: p.processedW, height: p.processedH })),
      );
      const blob = bytesToBlob(bytes, 'application/pdf');
      setOutput(blob);
      track('tool_completed', {
        toolSlug: 'document-scanner',
        category: 'pdf',
        meta: { pages: pages.length, mode },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build the PDF.');
      track('tool_failed', { toolSlug: 'document-scanner', category: 'pdf' });
    } finally {
      setBusy(null);
    }
  };

  const exportZip = async () => {
    if (pages.length === 0) return;
    setBusy('Packing images…');
    try {
      const { zipSync } = await import('fflate');
      const entries: Record<string, Uint8Array> = {};
      for (let i = 0; i < pages.length; i += 1) {
        const p = pages[i]!;
        const ext = p.processedBlob.type === 'image/png' ? 'png' : 'jpg';
        entries[`scan-${String(i + 1).padStart(2, '0')}.${ext}`] = new Uint8Array(
          await p.processedBlob.arrayBuffer(),
        );
      }
      downloadBlob(new Blob([zipSync(entries) as BlobPart], { type: 'application/zip' }), 'scans.zip');
    } catch {
      setError('Could not create the ZIP.');
    } finally {
      setBusy(null);
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="space-y-4">
      {stage === 'idle' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={openCamera}
            disabled={!cameraSupported() || !!busy}
            className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink-300 p-8 text-center transition hover:border-brand-500 hover:bg-brand-50 disabled:opacity-50 dark:border-ink-700 dark:hover:bg-brand-950/30"
          >
            <Camera className="h-9 w-9 text-brand-500" />
            <span className="text-sm font-medium text-ink-800 dark:text-ink-100">Open camera</span>
            <span className="text-xs text-ink-400">
              {cameraSupported() ? 'Live preview with auto edge-detection' : 'Not available on this device'}
            </span>
          </button>

          <label
            className={cn(
              'flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink-300 p-8 text-center transition hover:border-brand-500 hover:bg-brand-50 dark:border-ink-700 dark:hover:bg-brand-950/30',
              busy && 'pointer-events-none opacity-50',
            )}
          >
            <Upload className="h-9 w-9 text-brand-500" />
            <span className="text-sm font-medium text-ink-800 dark:text-ink-100">Upload / take a photo</span>
            <span className="text-xs text-ink-400">JPG, PNG or WebP — one or many</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="sr-only"
              onChange={(e) => {
                void onFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      )}

      {stage === 'camera' && (
        <div className="space-y-3">
          <div className="relative mx-auto max-w-2xl overflow-hidden rounded-xl bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} className="block w-full" playsInline muted />
            <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="secondary" size="sm" onClick={closeCamera}>
              <X className="h-4 w-4" /> Close
            </Button>
            <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
              <input
                type="checkbox"
                checked={autoCapture}
                onChange={(e) => setAutoCapture(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              Auto-capture
            </label>
            <Button size="lg" onClick={() => void capture()} disabled={!!busy}>
              <ScanLine className="h-5 w-5" /> Capture
            </Button>
          </div>
          <p className="text-center text-xs text-ink-400">
            Fill the frame with the page on a contrasting surface. The outline turns green when it locks on.
          </p>
        </div>
      )}

      {stage === 'review' && review && (
        <ReviewPane
          review={review}
          onQuad={(quad) => setReview((r) => (r ? { ...r, quad } : r))}
          onRotate={() => setReview((r) => (r ? { ...r, rotate: (r.rotate + 90) % 360 } : r))}
          onCancel={cancelReview}
          onCommit={() => void commitReview()}
          busy={!!busy}
        />
      )}

      {busy && <ProgressIndicator value={progress ? progress * 100 : 40} label={busy} />}
      {error && (
        <Alert tone="error">
          {error}
        </Alert>
      )}

      {pages.length > 0 && stage === 'idle' && (
        <div className="space-y-4 rounded-2xl border border-ink-200 p-4 dark:border-ink-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">
              {pages.length} page{pages.length === 1 ? '' : 's'}
            </span>
            <div className="ml-auto flex flex-wrap gap-1">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => void reprocessAll(m.id)}
                  disabled={!!busy}
                  aria-pressed={mode === m.id}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-medium transition disabled:opacity-50',
                    mode === m.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pages.map((p, i) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-ink-200 dark:border-ink-800">
                <button
                  type="button"
                  onClick={() => editPage(p)}
                  className="block aspect-[3/4] w-full bg-ink-50 dark:bg-ink-900"
                  title="Adjust corners"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.processedUrl} alt={`Page ${i + 1}`} className="h-full w-full object-contain" />
                </button>
                <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                  <span className="text-xs text-ink-400">{i + 1}</span>
                  <span className="flex gap-0.5">
                    <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => movePage(p.id, -1)} className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-800">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label="Move down" disabled={i === pages.length - 1} onClick={() => movePage(p.id, 1)} className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-800">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label="Rotate" onClick={() => rotatePage(p.id)} className="rounded p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800">
                      <RotateCw className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label="Delete" onClick={() => removePage(p.id)} className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-red-600 dark:hover:bg-ink-800">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={openCamera} disabled={!cameraSupported() || !!busy}>
              <Camera className="h-4 w-4" /> Add from camera
            </Button>
            <label className={cn('inline-flex', busy && 'pointer-events-none opacity-50')}>
              <span className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-ink-200 px-3 text-sm font-medium text-ink-800 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-100 dark:hover:bg-ink-800">
                <Upload className="h-4 w-4" /> Add image
              </span>
              <input type="file" accept="image/*" capture="environment" multiple className="sr-only" onChange={(e) => { void onFiles(e.target.files); e.target.value = ''; }} />
            </label>
            <Button size="sm" className="ml-auto" onClick={() => void exportPdf()} disabled={!!busy}>
              Download PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void exportZip()} disabled={!!busy}>
              Download images (.zip)
            </Button>
          </div>
        </div>
      )}

      {output && (
        <div className="space-y-2">
          <Alert tone="success">Your scanned PDF is ready — {pages.length} page{pages.length === 1 ? '' : 's'}.</Alert>
          <Button size="lg" onClick={() => downloadBlob(output, 'scan.pdf')}>
            <Check className="h-4 w-4" /> Download scan.pdf
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Corner-adjust pane                                                  */
/* ------------------------------------------------------------------ */

function ReviewPane({
  review,
  onQuad,
  onRotate,
  onCancel,
  onCommit,
  busy,
}: {
  review: Review;
  onQuad: (q: Quad) => void;
  onRotate: () => void;
  onCancel: () => void;
  onCommit: () => void;
  busy: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<number | null>(null);

  const fx = (p: Pt) => (p.x / review.width) * 100;
  const fy = (p: Pt) => (p.y / review.height) * 100;

  const onPointerDown = (e: React.PointerEvent, i: number) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = i;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const i = dragRef.current;
    const box = boxRef.current;
    if (i === null || !box) return;
    const r = box.getBoundingClientRect();
    const nx = clamp01((e.clientX - r.left) / r.width) * review.width;
    const ny = clamp01((e.clientY - r.top) / r.height) * review.height;
    const next = review.quad.map((p, k) => (k === i ? { x: nx, y: ny } : p)) as Quad;
    onQuad(next);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    dragRef.current = null;
  };

  return (
    <div className="space-y-3">
      <div
        ref={boxRef}
        className="relative mx-auto max-w-2xl touch-none select-none overflow-hidden rounded-xl border border-ink-200 dark:border-ink-800"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={review.srcUrl} alt="Captured page" className="block w-full" draggable={false} />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points={review.quad.map((p) => `${fx(p)},${fy(p)}`).join(' ')}
            fill="rgba(13,144,137,0.12)"
            stroke="#0d9089"
            strokeWidth="0.4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {review.quad.map((p, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Corner ${i + 1}`}
            onPointerDown={(e) => onPointerDown(e, i)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-600 shadow-md"
            style={{ left: `${fx(p)}%`, top: `${fy(p)}%`, touchAction: 'none' }}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
          <X className="h-4 w-4" /> {review.fromCamera ? 'Retake' : 'Cancel'}
        </Button>
        <Button variant="secondary" size="sm" onClick={onRotate} disabled={busy}>
          <RotateCw className="h-4 w-4" /> Rotate ({review.rotate}°)
        </Button>
        <Button size="sm" onClick={onCommit} disabled={busy}>
          <Check className="h-4 w-4" /> {review.id ? 'Update page' : 'Add page'}
        </Button>
      </div>
      <p className="text-center text-xs text-ink-400">
        Drag the four dots to the page corners. The de-warped result appears in your pages below.
      </p>
    </div>
  );
}
