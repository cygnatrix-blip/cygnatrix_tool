'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Download, RotateCcw } from 'lucide-react';
import { DropZone } from '@/components/file/DropZone';
import { StlPreview } from '@/components/file/StlPreview';
import { ProcessButton, ProgressIndicator } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { downloadBlob } from '@/lib/download';
import { formatBytes } from '@/lib/format';
import { track } from '@/lib/analytics/client';
import { DEFAULT_STL_OPTIONS, type StlMode, type StlOptions, type StlShape } from '@/lib/stl/types';

/** Source pixels are capped before any work: beyond this the extra detail
 * cannot survive a 0.4mm nozzle anyway, and it costs memory on a phone. */
const MAX_SOURCE_PX = 1600;
const PREVIEW_MAX_SAMPLES = 260;
/** The live 2D tone preview — small enough to recompute on every keystroke. */
const TONE_PREVIEW_PX = 240;

interface SourceImage {
  name: string;
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
  previewUrl: string;
}

interface BuildResult {
  stl: ArrayBuffer;
  triangleCount: number;
  volumeMM3: number;
  widthMM: number;
  heightMM: number;
  gridWidth: number;
  gridHeight: number;
  bounds: { min: [number, number, number]; max: [number, number, number] };
  preview: { positions: Float32Array; normals: Float32Array; triangleCount: number };
  ascii: boolean;
}

const MODES: { id: StlMode; label: string; help: string }[] = [
  {
    id: 'lithophane',
    label: 'Lithophane',
    help: 'For printing in white or translucent filament and lighting from behind. Dark areas of the photo become thick and block light; bright areas become thin and glow. Looks flat and grey until it is backlit — that is normal.',
  },
  {
    id: 'relief',
    label: 'Relief / emboss',
    help: 'A raised surface on a solid base, meant to be seen in ordinary light. Bright areas stand tallest. Suits logos, signs, coins, nameplates and terrain.',
  },
];

const SHAPES: { id: StlShape; label: string; help: string }[] = [
  { id: 'flat', label: 'Flat panel', help: 'A flat plate lying on the bed. Simplest to print; stand it up in your slicer for the finest detail on a lithophane.' },
  { id: 'curved', label: 'Curved panel', help: 'Bent around an arc and standing upright, so it holds itself up and catches light from a lamp placed behind it.' },
  { id: 'cylinder', label: 'Full cylinder', help: 'Wraps the whole way round — a lamp shade or tealight shroud. The image joins itself at the seam.' },
];

const QUALITY = [
  { label: 'Draft', samples: 200, note: 'fastest, visibly stepped' },
  { label: 'Standard', samples: 400, note: 'good for most photos' },
  { label: 'High', samples: 700, note: 'fine detail, larger file' },
  { label: 'Ultra', samples: 1000, note: 'slow; only worth it on a 0.2mm nozzle' },
];

/** Mirrors `countTriangles` so the cost is shown before committing to a build. */
function estimateTriangles(shape: StlShape, nx: number, ny: number): number {
  if (shape === 'cylinder') return 4 * nx * (ny - 1) + 4 * nx;
  if (shape === 'curved') return 4 * (nx - 1) * (ny - 1) + 4 * (nx - 1) + 4 * (ny - 1);
  const perimeter = 2 * (nx - 1) + 2 * (ny - 1);
  return 2 * (nx - 1) * (ny - 1) + 3 * perimeter;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-700 dark:text-ink-200">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-400">{hint}</span>}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 0.1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <span className="flex items-center gap-1">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        className="h-9 w-full rounded-lg border border-ink-300 bg-transparent px-2 text-sm dark:border-ink-600"
      />
      {suffix && <span className="shrink-0 text-xs text-ink-400">{suffix}</span>}
    </span>
  );
}

function Slider({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <span className="flex items-center gap-2">
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 w-full accent-brand-600"
      />
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-ink-500">{value}</span>
    </span>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-brand-600" />
      {label}
    </label>
  );
}

export function ImageToStlTool() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [opts, setOpts] = useState<StlOptions>(DEFAULT_STL_OPTIONS);
  const [ascii, setAscii] = useState(false);
  const [lockAspect, setLockAspect] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BuildResult | null>(null);

  const toneCanvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const reqId = useRef(0);

  const set = useCallback(<K extends keyof StlOptions>(key: K, value: StlOptions[K]) => {
    setOpts((prev) => ({ ...prev, [key]: value }));
    setResult(null);
  }, []);

  useEffect(() => () => {
    workerRef.current?.terminate();
    if (source?.previewUrl) URL.revokeObjectURL(source.previewUrl);
  }, [source?.previewUrl]);

  const onFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setBusy('Reading image…');
    try {
      const { decodeImage } = await import('@/lib/image/canvas');
      const decoded = await decodeImage(file);
      const scale = Math.min(1, MAX_SOURCE_PX / Math.max(decoded.width, decoded.height));
      const w = Math.max(2, Math.round(decoded.width * scale));
      const h = Math.max(2, Math.round(decoded.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Your browser could not create a drawing canvas.');
      ctx.drawImage(decoded.bitmap, 0, 0, w, h);
      decoded.bitmap.close();
      const rgba = ctx.getImageData(0, 0, w, h).data;

      if (source?.previewUrl) URL.revokeObjectURL(source.previewUrl);
      setSource({ name: file.name, rgba, width: w, height: h, previewUrl: URL.createObjectURL(file) });
      setOpts((prev) => ({ ...prev, heightMM: undefined }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That image could not be read.');
    } finally {
      setBusy(null);
    }
  };

  // Live 2D preview of the tone mapping. Cheap enough to redo on every change,
  // and it answers the question that actually decides a good print — whether
  // the midtones still separate once they become thickness.
  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    const run = async () => {
      const { buildHeightField } = await import('@/lib/stl/field');
      if (cancelled) return;
      const field = buildHeightField(source.rgba, source.width, source.height, {
        ...opts,
        maxSamples: TONE_PREVIEW_PX,
      });
      const canvas = toneCanvasRef.current;
      if (!canvas || cancelled) return;
      canvas.width = field.width;
      canvas.height = field.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = ctx.createImageData(field.width, field.height);
      for (let i = 0; i < field.data.length; i += 1) {
        // Thick = dark in this preview, matching how the printed part reads.
        const v = Math.round(255 * (1 - (field.data[i] ?? 0)));
        img.data[i * 4] = v;
        img.data[i * 4 + 1] = v;
        img.data[i * 4 + 2] = v;
        img.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    };
    const t = setTimeout(run, 60);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [source, opts]);

  const grid = useMemo(() => {
    if (!source) return null;
    const scale = Math.min(1, opts.maxSamples / Math.max(source.width, source.height));
    return {
      nx: Math.max(2, Math.round(source.width * scale)),
      ny: Math.max(2, Math.round(source.height * scale)),
    };
  }, [source, opts.maxSamples]);

  const estimate = useMemo(() => {
    if (!grid) return null;
    const tris = estimateTriangles(opts.shape, grid.nx, grid.ny);
    return { tris, bytes: 84 + tris * 50 };
  }, [grid, opts.shape]);

  const heightMM = useMemo(() => {
    if (opts.heightMM && opts.heightMM > 0) return opts.heightMM;
    if (!source) return 0;
    return (opts.widthMM * source.height) / source.width;
  }, [opts.heightMM, opts.widthMM, source]);

  const build = async () => {
    if (!source) return;
    setBusy('Building model…');
    setError(null);
    try {
      const stl = await new Promise<BuildResult>((resolve, reject) => {
        workerRef.current?.terminate();
        const worker = new Worker('/workers/stl-build.js');
        workerRef.current = worker;
        const id = ++reqId.current;

        worker.onmessage = (e: MessageEvent) => {
          const d = e.data;
          if (d.id !== id) return;
          worker.terminate();
          workerRef.current = null;
          if (!d.ok) {
            reject(new Error(d.error));
            return;
          }
          resolve({ ...d, ascii } as BuildResult);
        };
        worker.onerror = () => {
          worker.terminate();
          workerRef.current = null;
          reject(new Error('The model builder could not start. Try reloading the page.'));
        };

        // The pixel buffer is copied rather than transferred: the source stays
        // resident so settings can be changed and rebuilt without re-reading
        // the file.
        const copy = source.rgba.slice();
        worker.postMessage(
          {
            id,
            rgba: copy.buffer,
            srcWidth: source.width,
            srcHeight: source.height,
            opts,
            ascii,
            previewMaxSamples: PREVIEW_MAX_SAMPLES,
          },
          [copy.buffer],
        );
      });

      setResult(stl);
      track('tool_completed', {
        toolSlug: 'image-to-stl',
        category: 'image',
        meta: { mode: opts.mode, shape: opts.shape, triangles: stl.triangleCount },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The model could not be built.');
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    setOpts({ ...DEFAULT_STL_OPTIONS });
    setResult(null);
  };

  const download = () => {
    if (!result) return;
    const base = (source?.name ?? 'model').replace(/\.[^.]+$/, '');
    downloadBlob(new Blob([result.stl], { type: 'model/stl' }), `${base}-${opts.shape}.stl`);
  };

  const modeHelp = MODES.find((m) => m.id === opts.mode)!.help;
  const shapeHelp = SHAPES.find((s) => s.id === opts.shape)!.help;

  return (
    <div className="space-y-4">
      {!source && (
        <div className="card p-5">
          <DropZone
            onFiles={onFiles}
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            multiple={false}
            hint="A photo, logo or heightmap — PNG, JPG or WebP"
          />
        </div>
      )}

      {busy && <ProgressIndicator value={55} label={busy} />}
      {error && <Alert tone="error">{error}</Alert>}

      {source && (
        <>
          <div className="card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-ink-600 dark:text-ink-300">
                {source.name} — {source.width}×{source.height}px
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={reset}>
                  <RotateCcw className="h-4 w-4" /> Reset settings
                </Button>
                <Button variant="secondary" onClick={() => { setSource(null); setResult(null); }}>
                  Change image
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-ink-700 dark:text-ink-200">Original</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={source.previewUrl} alt="Source" className="w-full rounded-lg border border-ink-200 dark:border-ink-800" />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-ink-700 dark:text-ink-200">Thickness map</p>
                <canvas ref={toneCanvasRef} className="w-full rounded-lg border border-ink-200 bg-white dark:border-ink-800" />
                <p className="mt-1 text-[11px] text-ink-400">Darker = thicker material. This is what gets carved.</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <p className="mb-2 text-sm font-semibold text-ink-800 dark:text-ink-100">What are you making?</p>
            <div className="flex flex-wrap gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={opts.mode === m.id}
                  onClick={() => {
                    setResult(null);
                    setOpts((prev) => ({
                      ...prev,
                      mode: m.id,
                      // A relief needs a solid base or it is a bare skin; a
                      // lithophane must not have one or no light gets through.
                      baseThicknessMM: m.id === 'relief' ? 2 : 0,
                      minThicknessMM: m.id === 'relief' ? 0 : 0.6,
                      maxThicknessMM: m.id === 'relief' ? 2.5 : 3,
                    }));
                  }}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition',
                    opts.mode === m.id ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-400">{modeHelp}</p>

            <p className="mb-2 mt-4 text-sm font-semibold text-ink-800 dark:text-ink-100">Shape</p>
            <div className="flex flex-wrap gap-2">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={opts.shape === s.id}
                  onClick={() => { setResult(null); setOpts((prev) => ({ ...prev, shape: s.id })); }}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition',
                    opts.shape === s.id ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-400">{shapeHelp}</p>
          </div>

          <div className="card p-5">
            <p className="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-100">Size &amp; thickness</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label={opts.shape === 'cylinder' ? 'Circumference' : opts.shape === 'curved' ? 'Arc length' : 'Width'}
                hint={opts.shape === 'cylinder' ? `Inner diameter ≈ ${(opts.widthMM / Math.PI).toFixed(1)} mm` : undefined}
              >
                <NumberInput
                  value={opts.widthMM}
                  min={10}
                  max={1000}
                  step={1}
                  suffix="mm"
                  onChange={(v) => {
                    setResult(null);
                    setOpts((prev) => ({ ...prev, widthMM: v, heightMM: lockAspect ? undefined : prev.heightMM }));
                  }}
                />
              </Field>

              <Field label="Height" hint={lockAspect ? `Locked to the image: ${heightMM.toFixed(1)} mm` : undefined}>
                <NumberInput
                  value={Number(heightMM.toFixed(1))}
                  min={10}
                  max={1000}
                  step={1}
                  suffix="mm"
                  onChange={(v) => { setResult(null); setLockAspect(false); setOpts((prev) => ({ ...prev, heightMM: v })); }}
                />
              </Field>

              <Field label="Keep proportions">
                <Toggle
                  checked={lockAspect}
                  label="Match the image's aspect ratio"
                  onChange={(v) => {
                    setLockAspect(v);
                    setResult(null);
                    if (v) setOpts((prev) => ({ ...prev, heightMM: undefined }));
                  }}
                />
              </Field>

              <Field
                label={opts.mode === 'relief' ? 'Lowest point above base' : 'Thinnest (brightest)'}
                hint={opts.mode === 'lithophane' ? 'Below ~0.6 mm most printers leave gaps' : undefined}
              >
                <NumberInput value={opts.minThicknessMM} min={0} max={10} step={0.1} suffix="mm" onChange={(v) => set('minThicknessMM', v)} />
              </Field>

              <Field
                label={opts.mode === 'relief' ? 'Tallest point above base' : 'Thickest (darkest)'}
                hint={opts.mode === 'lithophane' ? 'Above ~4 mm little light gets through' : undefined}
              >
                <NumberInput value={opts.maxThicknessMM} min={0.2} max={20} step={0.1} suffix="mm" onChange={(v) => set('maxThicknessMM', v)} />
              </Field>

              {opts.mode === 'relief' && (
                <Field label="Solid base" hint="Material under the whole relief">
                  <NumberInput value={opts.baseThicknessMM} min={0} max={20} step={0.1} suffix="mm" onChange={(v) => set('baseThicknessMM', v)} />
                </Field>
              )}

              <Field label="Solid border" hint="A thick rim stops a thin panel curling">
                <NumberInput value={opts.borderMM} min={0} max={25} step={0.5} suffix="mm" onChange={(v) => set('borderMM', v)} />
              </Field>

              {opts.shape === 'curved' && (
                <Field label="Curve" hint="How far the panel bends">
                  <NumberInput value={opts.curveDegrees} min={10} max={350} step={5} suffix="°" onChange={(v) => set('curveDegrees', v)} />
                </Field>
              )}
            </div>
          </div>

          <div className="card p-5">
            <p className="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-100">Image adjustments</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Brightness"><Slider value={opts.brightness} min={-100} max={100} step={1} onChange={(v) => set('brightness', v)} /></Field>
              <Field label="Contrast"><Slider value={opts.contrast} min={-100} max={100} step={1} onChange={(v) => set('contrast', v)} /></Field>
              <Field label="Gamma" hint="Below 1 lifts shadows; above 1 deepens them">
                <Slider value={opts.gamma} min={0.2} max={3} step={0.05} onChange={(v) => set('gamma', v)} />
              </Field>
              <Field label="Smoothing" hint="Softens noise and banding">
                <Slider value={opts.smooth} min={0} max={6} step={1} onChange={(v) => set('smooth', v)} />
              </Field>
              <Field label="Orientation">
                <div className="space-y-1">
                  <Toggle checked={opts.invert} label="Invert light and dark" onChange={(v) => set('invert', v)} />
                  <Toggle checked={opts.flipHorizontal} label="Mirror horizontally" onChange={(v) => set('flipHorizontal', v)} />
                </div>
              </Field>
            </div>
          </div>

          <div className="card p-5">
            <p className="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-100">Detail &amp; output</p>
            <div className="flex flex-wrap gap-2">
              {QUALITY.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  aria-pressed={opts.maxSamples === q.samples}
                  onClick={() => set('maxSamples', q.samples)}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition',
                    opts.maxSamples === q.samples ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300',
                  )}
                >
                  {q.label}
                  <span className="ml-1 text-[11px] opacity-70">{q.note}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Toggle checked={ascii} label="ASCII STL instead of binary" onChange={(v) => { setAscii(v); setResult(null); }} />
              {estimate && grid && (
                <p className="text-xs text-ink-500">
                  {grid.nx}×{grid.ny} samples → {estimate.tris.toLocaleString()} triangles, about{' '}
                  {formatBytes(ascii ? estimate.bytes * 6 : estimate.bytes)}
                </p>
              )}
            </div>
            {estimate && estimate.tris > 1_500_000 && (
              <Alert tone="warning" className="mt-3">
                That is a very heavy mesh. It will take a while to build and some slicers struggle past a million
                triangles — drop to High or Standard unless you really need it.
              </Alert>
            )}

            <div className="mt-4 flex justify-center">
              <ProcessButton onClick={build} busy={!!busy}>
                <Box className="h-4 w-4" /> Build 3D model
              </ProcessButton>
            </div>
          </div>
        </>
      )}

      {result && (
        <div className="card p-5">
          <Alert tone="success" className="mb-4">
            Model ready — {result.triangleCount.toLocaleString()} triangles, {formatBytes(result.stl.byteLength)}.
          </Alert>

          <div className="mb-4 overflow-hidden rounded-xl border border-ink-200 bg-gradient-to-b from-ink-50 to-ink-100 dark:border-ink-800 dark:from-ink-900 dark:to-ink-950">
            <StlPreview
              positions={result.preview.positions}
              normals={result.preview.normals}
              triangleCount={result.preview.triangleCount}
              className="block h-[320px] w-full"
            />
          </div>
          <p className="mb-4 text-center text-xs text-ink-400">
            Drag to rotate, scroll to zoom. The preview is simplified; the downloaded file carries the full detail.
          </p>

          <dl className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ['Size', `${(result.bounds.max[0] - result.bounds.min[0]).toFixed(1)} × ${(result.bounds.max[1] - result.bounds.min[1]).toFixed(1)} × ${(result.bounds.max[2] - result.bounds.min[2]).toFixed(1)} mm`],
              ['Triangles', result.triangleCount.toLocaleString()],
              ['Volume', `${(result.volumeMM3 / 1000).toFixed(1)} cm³`],
              ['Filament', `≈ ${(((result.volumeMM3 / 1000) * 1.24) / 1000).toFixed(0)} g`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-ink-50 p-3 dark:bg-ink-900">
                <dt className="text-[11px] uppercase tracking-wide text-ink-400">{k}</dt>
                <dd className="mt-0.5 font-medium text-ink-800 dark:text-ink-100">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="flex justify-center">
            <Button onClick={download}>
              <Download className="h-4 w-4" /> Download STL
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-400">
            Filament estimate assumes solid PLA at 1.24 g/cm³. Slice at 100% infill — a lithophane with gaps inside
            will not light evenly.
          </p>
        </div>
      )}
    </div>
  );
}
