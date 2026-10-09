'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Download, Lightbulb, Plus, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { DropZone } from '@/components/file/DropZone';
import { CropFrame } from '@/components/file/CropFrame';
import { StlPreview } from '@/components/file/StlPreview';
import { ProcessButton, ProgressIndicator } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { downloadBlob } from '@/lib/download';
import { formatBytes } from '@/lib/format';
import { track } from '@/lib/analytics/client';
import { DEFAULT_BACKLIT, LIGHT_PRESETS, MATERIAL_PRESETS, type BacklitOptions } from '@/lib/stl/backlit';
import {
  DEFAULT_STL_OPTIONS,
  type CropRect,
  type ExportFormat,
  type GrayMethod,
  type Outline,
  type StlMode,
  type StlOptions,
  type StlShape,
  type Units,
} from '@/lib/stl/types';

/** Source pixels are capped before any work: beyond this the extra detail
 * cannot survive a 0.4mm nozzle anyway, and it costs memory on a phone. */
const MAX_SOURCE_PX = 1600;
const PREVIEW_MAX_SAMPLES = 260;
const TONE_PREVIEW_PX = 260;
const MAX_IMAGES = 6;

const MM_PER_INCH = 25.4;

interface SourceImage {
  id: number;
  name: string;
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
  previewUrl: string;
}

interface BuildResult {
  bytes: ArrayBuffer;
  mime: string;
  extension: string;
  triangleCount: number;
  vertexCount: number;
  volumeMM3: number;
  tonalRange: number;
  bounds: { min: [number, number, number]; max: [number, number, number] };
  preview: {
    positions: Float32Array;
    normals: Float32Array;
    triangleCount: number;
    lit: ArrayBuffer;
    litWidth: number;
    litHeight: number;
  };
}

const MODES: { id: StlMode; label: string; help: string }[] = [
  {
    id: 'lithophane',
    label: 'Lithophane',
    help: 'For printing in white or translucent filament and lighting from behind. Dark areas become thick and block light; bright areas become thin and glow. Use the Backlit tab to see how it will actually look.',
  },
  {
    id: 'relief',
    label: 'Relief / emboss',
    help: 'A raised surface on a solid base, meant to be seen in ordinary light. Bright areas stand tallest. Suits logos, signs, coins, nameplates and terrain heightmaps.',
  },
];

const SHAPES: { id: StlShape; label: string; help: string }[] = [
  { id: 'flat', label: 'Flat panel', help: 'A flat plate. Turn on "print standing up" for the finest detail on a lithophane.' },
  { id: 'curved', label: 'Curved panel', help: 'Bent around an arc and standing upright, so it holds itself up in front of a lamp.' },
  { id: 'cylinder', label: 'Full cylinder', help: 'Wraps the whole way round — a lamp shade or tealight shroud. Add more images to wrap several photos.' },
];

const OUTLINES: { id: Outline; label: string }[] = [
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'ellipse', label: 'Oval' },
  { id: 'heart', label: 'Heart' },
];

const GRAY_METHODS: { id: GrayMethod; label: string; help: string }[] = [
  { id: 'luminance', label: 'Luminance', help: 'Matches the eye. Best for photographs.' },
  { id: 'average', label: 'Average', help: 'Keeps saturated reds and blues from going almost black. Better for logos.' },
  { id: 'lightness', label: 'Lightness', help: 'Preserves bright colours. Good for flat artwork.' },
  { id: 'threshold', label: 'Two-tone', help: 'Hard cut to thick or thin — a stencil. For silhouettes and line art.' },
];

const FORMATS: { id: ExportFormat; label: string; help: string }[] = [
  { id: 'stl-binary', label: 'STL (binary)', help: 'The universal choice. Every slicer reads it.' },
  { id: '3mf', label: '3MF', help: 'Smaller and states its units, so no slicer can misread the scale. Preferred by modern slicers.' },
  { id: 'obj', label: 'OBJ', help: 'For importing into Blender and other 3D software.' },
  { id: 'stl-ascii', label: 'STL (ASCII)', help: 'Text form. Much larger; only for older CAD importers.' },
];

const QUALITY = [
  { label: 'Draft', samples: 200, note: 'fastest' },
  { label: 'Standard', samples: 400, note: 'most photos' },
  { label: 'High', samples: 700, note: 'fine detail' },
  { label: 'Ultra', samples: 1000, note: '0.2mm nozzle' },
];

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
  value, onChange, min, max, step = 0.1, suffix,
}: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (
    <span className="flex items-center gap-1">
      <input
        type="number" value={value} min={min} max={max} step={step}
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

function Slider({ value, onChange, min, max, step }: { value: number; onChange: (v: number) => void; min: number; max: number; step: number }) {
  return (
    <span className="flex items-center gap-2">
      <input type="range" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(Number(e.target.value))} className="h-9 w-full accent-brand-600" />
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-ink-500">{value}</span>
    </span>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
      <input type="checkbox" checked={checked} onChange={(e) => e.target && onChange(e.target.checked)} className="h-4 w-4 accent-brand-600" />
      {label}
    </label>
  );
}

function Chips<T extends string>({
  items, value, onChange,
}: { items: { id: T; label: string; note?: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <button
          key={it.id} type="button" aria-pressed={value === it.id} onClick={() => onChange(it.id)}
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium transition',
            value === it.id ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300',
          )}
        >
          {it.label}
          {it.note && <span className="ml-1 text-[11px] opacity-70">{it.note}</span>}
        </button>
      ))}
    </div>
  );
}

export function ImageToStlTool() {
  const [sources, setSources] = useState<SourceImage[]>([]);
  const [opts, setOpts] = useState<StlOptions>(DEFAULT_STL_OPTIONS);
  const [format, setFormat] = useState<ExportFormat>('stl-binary');
  const [units, setUnits] = useState<Units>('mm');
  const [lockAspect, setLockAspect] = useState(true);
  const [backlit, setBacklit] = useState<BacklitOptions>(DEFAULT_BACKLIT);
  const [previewTab, setPreviewTab] = useState<'lit' | '3d'>('lit');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BuildResult | null>(null);

  const toneCanvasRef = useRef<HTMLCanvasElement>(null);
  const litCanvasRef = useRef<HTMLCanvasElement>(null);
  // A separate canvas: the live preview and the finished result are both on
  // screen at once, so one ref cannot serve both.
  const resultLitCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropStageRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const reqId = useRef(0);
  const nextId = useRef(1);

  const set = useCallback(<K extends keyof StlOptions>(key: K, value: StlOptions[K]) => {
    setOpts((prev) => ({ ...prev, [key]: value }));
    setResult(null);
  }, []);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const toDisplay = (mm: number) => (units === 'mm' ? mm : mm / MM_PER_INCH);
  const fromDisplay = (v: number) => (units === 'mm' ? v : v * MM_PER_INCH);
  const unitLabel = units === 'mm' ? 'mm' : 'in';
  const round = (v: number) => Number(v.toFixed(units === 'mm' ? 1 : 3));

  const addFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setError(null);
    setResult(null);
    setBusy('Reading image…');
    try {
      const { decodeImage } = await import('@/lib/image/canvas');
      const added: SourceImage[] = [];
      for (const file of files.slice(0, MAX_IMAGES - sources.length)) {
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
        added.push({
          id: nextId.current++,
          name: file.name,
          rgba: ctx.getImageData(0, 0, w, h).data,
          width: w,
          height: h,
          previewUrl: URL.createObjectURL(file),
        });
      }
      setSources((prev) => [...prev, ...added]);
      setOpts((prev) => ({ ...prev, heightMM: undefined }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That image could not be read.');
    } finally {
      setBusy(null);
    }
  };

  const removeImage = (id: number) => {
    setSources((prev) => {
      const gone = prev.find((s) => s.id === id);
      if (gone) URL.revokeObjectURL(gone.previewUrl);
      return prev.filter((s) => s.id !== id);
    });
    setResult(null);
  };

  const first = sources[0];

  // Live thickness map. Cheap enough to redo on every change, and it answers
  // the question that decides a good print — whether the midtones still
  // separate once they become thickness.
  useEffect(() => {
    if (!first) return;
    let cancelled = false;
    const run = async () => {
      const [{ buildHeightField, stitchFields }, { renderBacklit }] = await Promise.all([
        import('@/lib/stl/field'),
        import('@/lib/stl/backlit'),
      ]);
      if (cancelled) return;
      const field = stitchFields(
        sources.map((s) => buildHeightField(s.rgba, s.width, s.height, { ...opts, maxSamples: TONE_PREVIEW_PX })),
        opts,
      );

      const tone = toneCanvasRef.current;
      if (tone && !cancelled) {
        tone.width = field.width;
        tone.height = field.height;
        const ctx = tone.getContext('2d');
        if (ctx) {
          const img = ctx.createImageData(field.width, field.height);
          for (let i = 0; i < field.data.length; i += 1) {
            const masked = field.mask && field.mask[i] === 0;
            const v = masked ? 255 : Math.round(255 * (1 - (field.data[i] ?? 0)));
            img.data[i * 4] = v;
            img.data[i * 4 + 1] = v;
            img.data[i * 4 + 2] = v;
            img.data[i * 4 + 3] = masked ? 0 : 255;
          }
          ctx.clearRect(0, 0, field.width, field.height);
          ctx.putImageData(img, 0, 0);
        }
      }

      const litCanvas = litCanvasRef.current;
      if (litCanvas && !cancelled) {
        litCanvas.width = field.width;
        litCanvas.height = field.height;
        const ctx = litCanvas.getContext('2d');
        if (ctx) {
          const px = renderBacklit(field, opts, backlit);
          const img = ctx.createImageData(field.width, field.height);
          img.data.set(px);
          ctx.putImageData(img, 0, 0);
        }
      }
    };
    const t = setTimeout(run, 70);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [sources, opts, backlit, first]);

  const grid = useMemo(() => {
    if (sources.length === 0) return null;
    let nx = 0;
    let ny = 0;
    for (const s of sources) {
      const cw = s.width * (opts.crop?.w ?? 1);
      const ch = s.height * (opts.crop?.h ?? 1);
      const scale = Math.min(1, opts.maxSamples / Math.max(cw, ch));
      nx += Math.max(2, Math.round(cw * scale));
      ny = Math.max(ny, Math.max(2, Math.round(ch * scale)));
    }
    return { nx, ny };
  }, [sources, opts.maxSamples, opts.crop]);

  const estimate = useMemo(() => {
    if (!grid) return null;
    const { nx, ny } = grid;
    let tris: number;
    if (opts.shape === 'cylinder') tris = 4 * nx * (ny - 1) + 4 * nx;
    else if (opts.shape === 'curved') tris = 4 * (nx - 1) * (ny - 1) + 4 * (nx - 1) + 4 * (ny - 1);
    else if (opts.outline !== 'rectangle' || opts.hangingHoleMM > 0) tris = Math.round(4 * (nx - 1) * (ny - 1) * 0.75);
    else tris = 2 * (nx - 1) * (ny - 1) + 3 * (2 * (nx - 1) + 2 * (ny - 1));
    const stl = 84 + tris * 50;
    const bytes = format === 'stl-ascii' ? stl * 6 : format === 'stl-binary' ? stl : Math.round(stl * 0.3);
    return { tris, bytes };
  }, [grid, opts.shape, opts.outline, opts.hangingHoleMM, format]);

  const heightMM = useMemo(() => {
    if (opts.heightMM && opts.heightMM > 0) return opts.heightMM;
    if (!grid) return 0;
    return (opts.widthMM * grid.ny) / grid.nx;
  }, [opts.heightMM, opts.widthMM, grid]);

  const build = async () => {
    if (sources.length === 0) return;
    setBusy('Building model…');
    setError(null);
    try {
      const out = await new Promise<BuildResult>((resolve, reject) => {
        workerRef.current?.terminate();
        const worker = new Worker('/workers/stl-build.js');
        workerRef.current = worker;
        const id = ++reqId.current;

        worker.onmessage = (e: MessageEvent) => {
          const d = e.data;
          if (d.id !== id) return;
          worker.terminate();
          workerRef.current = null;
          if (!d.ok) { reject(new Error(d.error)); return; }
          resolve(d as BuildResult);
        };
        worker.onerror = () => {
          worker.terminate();
          workerRef.current = null;
          reject(new Error('The model builder could not start. Try reloading the page.'));
        };

        // Copies rather than transfers, so the sources stay resident and
        // settings can be changed and rebuilt without re-reading the files.
        const images = sources.map((s) => {
          const copy = s.rgba.slice();
          return { rgba: copy.buffer, width: s.width, height: s.height };
        });
        worker.postMessage(
          { id, images, opts, format, backlit, previewMaxSamples: PREVIEW_MAX_SAMPLES },
          images.map((i) => i.rgba),
        );
      });

      setResult(out);
      setPreviewTab(opts.mode === 'lithophane' ? 'lit' : '3d');
      track('tool_completed', {
        toolSlug: 'image-to-stl',
        category: 'image',
        meta: { mode: opts.mode, shape: opts.shape, format, triangles: out.triangleCount },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The model could not be built.');
    } finally {
      setBusy(null);
    }
  };

  const download = () => {
    if (!result) return;
    const base = (first?.name ?? 'model').replace(/\.[^.]+$/, '');
    downloadBlob(new Blob([result.bytes], { type: result.mime }), `${base}-${opts.shape}.${result.extension}`);
  };

  // Rendered after a build, from the worker's own lit buffer.
  useEffect(() => {
    if (!result || previewTab !== 'lit') return;
    const canvas = resultLitCanvasRef.current;
    if (!canvas) return;
    canvas.width = result.preview.litWidth;
    canvas.height = result.preview.litHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(result.preview.litWidth, result.preview.litHeight);
    img.data.set(new Uint8ClampedArray(result.preview.lit.slice(0)));
    ctx.putImageData(img, 0, 0);
  }, [result, previewTab]);

  const modeHelp = MODES.find((m) => m.id === opts.mode)!.help;
  const shapeHelp = SHAPES.find((s) => s.id === opts.shape)!.help;
  const canAddMore = sources.length < MAX_IMAGES;

  return (
    <div className="space-y-4">
      {sources.length === 0 && (
        <div className="card p-5">
          <DropZone
            onFiles={addFiles}
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            multiple
            hint="A photo, logo or greyscale heightmap — PNG, JPG or WebP"
          />
        </div>
      )}

      {busy && <ProgressIndicator value={55} label={busy} />}
      {error && <Alert tone="error">{error}</Alert>}

      {first && (
        <>
          <div className="card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-ink-600 dark:text-ink-300">
                {sources.length === 1 ? `${first.name} — ${first.width}×${first.height}px` : `${sources.length} images, wrapped left to right`}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => set('rotateQuarter', (opts.rotateQuarter + 3) % 4)}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="secondary" onClick={() => set('rotateQuarter', (opts.rotateQuarter + 1) % 4)}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button variant="secondary" onClick={() => { setOpts({ ...DEFAULT_STL_OPTIONS }); setResult(null); }}>
                  Reset
                </Button>
                <Button variant="secondary" onClick={() => { sources.forEach((s) => URL.revokeObjectURL(s.previewUrl)); setSources([]); setResult(null); }}>
                  Start over
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-ink-700 dark:text-ink-200">
                  Source {sources.length === 1 && '— drag the box to crop'}
                </p>
                <div ref={cropStageRef} className="relative select-none overflow-hidden rounded-lg border border-ink-200 dark:border-ink-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={first.previewUrl} alt="Source" className="block w-full" draggable={false} />
                  {sources.length === 1 && (
                    <CropFrame
                      stageRef={cropStageRef}
                      crop={opts.crop ?? { x: 0, y: 0, w: 1, h: 1 }}
                      onChange={(c: CropRect) => set('crop', c)}
                    />
                  )}
                </div>
                {opts.crop && (
                  <button type="button" onClick={() => set('crop', undefined)} className="mt-1 text-[11px] text-brand-600 underline">
                    Reset crop
                  </button>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-ink-700 dark:text-ink-200">Thickness map</p>
                <canvas ref={toneCanvasRef} className="w-full rounded-lg border border-ink-200 bg-white dark:border-ink-800" />
                <p className="mt-1 text-[11px] text-ink-400">Darker = thicker material. This is what gets carved.</p>
              </div>
            </div>

            {sources.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sources.map((s, i) => (
                  <span key={s.id} className="flex items-center gap-1 rounded-lg bg-ink-100 px-2 py-1 text-xs dark:bg-ink-800">
                    {i + 1}. {s.name.slice(0, 18)}
                    <button type="button" onClick={() => removeImage(s.id)} aria-label={`Remove ${s.name}`}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {canAddMore && (
              <label className="mt-3 inline-flex cursor-pointer items-center gap-1 text-xs text-brand-600 underline">
                <Plus className="h-3 w-3" /> Add another image (wraps side by side)
                <input
                  type="file" multiple accept="image/png,image/jpeg,image/webp" className="sr-only"
                  onChange={(e) => { const f = e.target.files; if (f) void addFiles(Array.from(f)); }}
                />
              </label>
            )}
          </div>

          <div className="card p-5">
            <p className="mb-2 text-sm font-semibold text-ink-800 dark:text-ink-100">What are you making?</p>
            <Chips
              items={MODES}
              value={opts.mode}
              onChange={(id) => {
                setResult(null);
                setOpts((prev) => ({
                  ...prev, mode: id,
                  // A relief needs a solid base or it is a bare skin; a
                  // lithophane must not have one or no light gets through.
                  baseThicknessMM: id === 'relief' ? 2 : 0,
                  minThicknessMM: id === 'relief' ? 0 : 0.6,
                  maxThicknessMM: id === 'relief' ? 2.5 : 3,
                }));
              }}
            />
            <p className="mt-2 text-xs text-ink-400">{modeHelp}</p>

            <p className="mb-2 mt-4 text-sm font-semibold text-ink-800 dark:text-ink-100">Shape</p>
            <Chips items={SHAPES} value={opts.shape} onChange={(id) => set('shape', id)} />
            <p className="mt-2 text-xs text-ink-400">{shapeHelp}</p>

            {opts.shape === 'flat' && (
              <>
                <p className="mb-2 mt-4 text-sm font-semibold text-ink-800 dark:text-ink-100">Cut-out shape</p>
                <Chips items={OUTLINES} value={opts.outline} onChange={(id) => set('outline', id)} />
              </>
            )}
            {opts.shape !== 'flat' && (
              <div className="mt-3">
                <Toggle
                  checked={opts.concave}
                  label="Curve the other way (image on the inside)"
                  onChange={(v) => set('concave', v)}
                />
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">Size &amp; thickness</p>
              <Chips
                items={[{ id: 'mm' as Units, label: 'mm' }, { id: 'in' as Units, label: 'inch' }]}
                value={units}
                onChange={setUnits}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label={opts.shape === 'cylinder' ? 'Circumference' : opts.shape === 'curved' ? 'Arc length' : 'Width'}
                hint={opts.shape === 'cylinder' ? `Diameter ≈ ${round(toDisplay(opts.widthMM / Math.PI))} ${unitLabel}` : undefined}
              >
                <NumberInput
                  value={round(toDisplay(opts.widthMM))}
                  min={units === 'mm' ? 10 : 0.4} max={units === 'mm' ? 1000 : 40}
                  step={units === 'mm' ? 1 : 0.1} suffix={unitLabel}
                  onChange={(v) => { setResult(null); setOpts((p) => ({ ...p, widthMM: fromDisplay(v), heightMM: lockAspect ? undefined : p.heightMM })); }}
                />
              </Field>

              <Field label="Height" hint={lockAspect ? 'Locked to the image' : undefined}>
                <NumberInput
                  value={round(toDisplay(heightMM))}
                  min={units === 'mm' ? 10 : 0.4} max={units === 'mm' ? 1000 : 40}
                  step={units === 'mm' ? 1 : 0.1} suffix={unitLabel}
                  onChange={(v) => { setResult(null); setLockAspect(false); setOpts((p) => ({ ...p, heightMM: fromDisplay(v) })); }}
                />
              </Field>

              <Field label="Proportions">
                <Toggle checked={lockAspect} label="Match the image" onChange={(v) => {
                  setLockAspect(v); setResult(null);
                  if (v) setOpts((p) => ({ ...p, heightMM: undefined }));
                }} />
              </Field>

              <Field
                label={opts.mode === 'relief' ? 'Lowest above base' : 'Thinnest (brightest)'}
                hint={opts.mode === 'lithophane' ? 'Below ~0.6 mm most printers leave gaps' : undefined}
              >
                <NumberInput value={round(toDisplay(opts.minThicknessMM))} min={0} max={units === 'mm' ? 10 : 0.4}
                  step={units === 'mm' ? 0.1 : 0.005} suffix={unitLabel}
                  onChange={(v) => set('minThicknessMM', fromDisplay(v))} />
              </Field>

              <Field
                label={opts.mode === 'relief' ? 'Tallest above base' : 'Thickest (darkest)'}
                hint={opts.mode === 'lithophane' ? 'Above ~4 mm little light gets through' : undefined}
              >
                <NumberInput value={round(toDisplay(opts.maxThicknessMM))} min={0.2} max={units === 'mm' ? 20 : 0.8}
                  step={units === 'mm' ? 0.1 : 0.005} suffix={unitLabel}
                  onChange={(v) => set('maxThicknessMM', fromDisplay(v))} />
              </Field>

              {opts.mode === 'relief' && (
                <Field label="Solid base">
                  <NumberInput value={round(toDisplay(opts.baseThicknessMM))} min={0} max={units === 'mm' ? 20 : 0.8}
                    step={units === 'mm' ? 0.1 : 0.005} suffix={unitLabel}
                    onChange={(v) => set('baseThicknessMM', fromDisplay(v))} />
                </Field>
              )}

              <Field label="Solid border" hint="A thick rim stops a thin panel curling">
                <NumberInput value={round(toDisplay(opts.borderMM))} min={0} max={units === 'mm' ? 25 : 1}
                  step={units === 'mm' ? 0.5 : 0.02} suffix={unitLabel}
                  onChange={(v) => set('borderMM', fromDisplay(v))} />
              </Field>

              {opts.shape === 'flat' && opts.outline === 'rounded' && (
                <Field label="Corner radius">
                  <NumberInput value={round(toDisplay(opts.cornerRadiusMM))} min={0} max={units === 'mm' ? 60 : 2.4}
                    step={units === 'mm' ? 1 : 0.05} suffix={unitLabel}
                    onChange={(v) => set('cornerRadiusMM', fromDisplay(v))} />
                </Field>
              )}

              {opts.shape === 'flat' && (
                <>
                  <Field label="Hanging hole" hint="0 for none">
                    <NumberInput value={round(toDisplay(opts.hangingHoleMM))} min={0} max={units === 'mm' ? 30 : 1.2}
                      step={units === 'mm' ? 0.5 : 0.02} suffix={unitLabel}
                      onChange={(v) => set('hangingHoleMM', fromDisplay(v))} />
                  </Field>
                  {opts.hangingHoleMM > 0 && (
                    <Field label="Hole distance from top">
                      <NumberInput value={round(toDisplay(opts.hangingHoleInsetMM))} min={1} max={units === 'mm' ? 80 : 3}
                        step={units === 'mm' ? 1 : 0.05} suffix={unitLabel}
                        onChange={(v) => set('hangingHoleInsetMM', fromDisplay(v))} />
                    </Field>
                  )}
                </>
              )}

              {opts.shape === 'curved' && (
                <Field label="Curve">
                  <NumberInput value={opts.curveDegrees} min={10} max={350} step={5} suffix="°"
                    onChange={(v) => set('curveDegrees', v)} />
                </Field>
              )}
            </div>

            {opts.shape === 'flat' && (
              <div className="mt-4">
                <Toggle
                  checked={opts.orientUpright}
                  label="Print standing up (recommended for lithophanes)"
                  onChange={(v) => set('orientUpright', v)}
                />
                <p className="mt-1 text-[11px] text-ink-400">
                  Stands the panel on its edge so the layer lines run across the image instead of along it, which hides them.
                </p>
              </div>
            )}
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
              <Field label="Sharpen" hint="Puts back edges that smoothing took">
                <Slider value={opts.sharpen} min={0} max={100} step={5} onChange={(v) => set('sharpen', v)} />
              </Field>
              <Field label="Orientation">
                <div className="space-y-1">
                  <Toggle checked={opts.invert} label="Invert light and dark" onChange={(v) => set('invert', v)} />
                  <Toggle checked={opts.flipHorizontal} label="Mirror horizontally" onChange={(v) => set('flipHorizontal', v)} />
                </div>
              </Field>
            </div>

            <p className="mb-2 mt-4 text-xs font-medium text-ink-700 dark:text-ink-200">Colour to brightness</p>
            <Chips items={GRAY_METHODS} value={opts.grayMethod} onChange={(id) => set('grayMethod', id)} />
            <p className="mt-2 text-xs text-ink-400">{GRAY_METHODS.find((g) => g.id === opts.grayMethod)!.help}</p>
            {opts.grayMethod === 'threshold' && (
              <div className="mt-3 max-w-xs">
                <Field label="Cut point"><Slider value={opts.thresholdAt} min={0.05} max={0.95} step={0.05} onChange={(v) => set('thresholdAt', v)} /></Field>
              </div>
            )}
          </div>

          <div className="card p-5">
            <p className="mb-2 text-sm font-semibold text-ink-800 dark:text-ink-100">Detail</p>
            <Chips
              items={QUALITY.map((q) => ({ id: String(q.samples), label: q.label, note: q.note }))}
              value={String(opts.maxSamples)}
              onChange={(v) => set('maxSamples', Number(v))}
            />

            <p className="mb-2 mt-4 text-sm font-semibold text-ink-800 dark:text-ink-100">File format</p>
            <Chips items={FORMATS} value={format} onChange={(id) => { setFormat(id); setResult(null); }} />
            <p className="mt-2 text-xs text-ink-400">{FORMATS.find((f) => f.id === format)!.help}</p>

            {estimate && grid && (
              <p className="mt-3 text-xs text-ink-500">
                {grid.nx}×{grid.ny} samples → {estimate.tris.toLocaleString()} triangles, about {formatBytes(estimate.bytes)}
              </p>
            )}
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

          <div className="card p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-ink-100">
              <Lightbulb className="h-4 w-4" /> Backlit preview
            </p>
            <canvas ref={litCanvasRef} className="w-full rounded-lg border border-ink-200 dark:border-ink-800" />
            <p className="mt-2 text-xs text-ink-400">
              How it should look with a light behind it, using Beer–Lambert absorption for the filament you pick.
              This updates live — tune contrast and gamma until the face reads here, not in the grey map.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Filament">
                <select
                  value={MATERIAL_PRESETS.find((m) => m.absorption === backlit.absorption)?.id ?? 'white-pla'}
                  onChange={(e) => {
                    const m = MATERIAL_PRESETS.find((x) => x.id === e.target.value);
                    if (m) setBacklit((p) => ({ ...p, absorption: m.absorption, material: m.material }));
                  }}
                  className="h-9 w-full rounded-lg border border-ink-300 bg-transparent px-2 text-sm dark:border-ink-600"
                >
                  {MATERIAL_PRESETS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </Field>
              <Field label="Light">
                <select
                  value={LIGHT_PRESETS.find((l) => l.light[0] === backlit.light[0] && l.light[2] === backlit.light[2])?.id ?? 'warm'}
                  onChange={(e) => {
                    const l = LIGHT_PRESETS.find((x) => x.id === e.target.value);
                    if (l) setBacklit((p) => ({ ...p, light: l.light }));
                  }}
                  className="h-9 w-full rounded-lg border border-ink-300 bg-transparent px-2 text-sm dark:border-ink-600"
                >
                  {LIGHT_PRESETS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </Field>
              <Field label="Light brightness">
                <Slider value={Number(backlit.intensity.toFixed(2))} min={0.4} max={2.5} step={0.05}
                  onChange={(v) => setBacklit((p) => ({ ...p, intensity: v }))} />
              </Field>
            </div>
          </div>
        </>
      )}

      {result && (
        <div className="card p-5">
          <Alert tone="success" className="mb-4">
            Model ready — {result.triangleCount.toLocaleString()} triangles, {formatBytes(result.bytes.byteLength)}.
          </Alert>

          {result.tonalRange < 0.25 && (
            <Alert tone="warning" className="mb-4">
              This image only uses {Math.round(result.tonalRange * 100)}% of the lit range, so it will print as a
              fairly flat panel. Raising contrast usually helps far more than adding detail.
            </Alert>
          )}

          <div className="mb-3 flex justify-center">
            <Chips
              items={[{ id: 'lit' as const, label: 'Backlit' }, { id: '3d' as const, label: '3D model' }]}
              value={previewTab}
              onChange={setPreviewTab}
            />
          </div>

          <div className={cn('mb-4 overflow-hidden rounded-xl border border-ink-200 dark:border-ink-800', previewTab === '3d' && 'bg-gradient-to-b from-ink-50 to-ink-100 dark:from-ink-900 dark:to-ink-950')}>
            {previewTab === '3d' ? (
              <StlPreview
                positions={result.preview.positions}
                normals={result.preview.normals}
                triangleCount={result.preview.triangleCount}
                className="block h-[320px] w-full"
              />
            ) : (
              <div className="bg-ink-950 p-4">
                <canvas ref={resultLitCanvasRef} className="mx-auto block max-h-[320px] w-auto max-w-full rounded" />
              </div>
            )}
          </div>

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
              <Download className="h-4 w-4" /> Download {FORMATS.find((f) => f.id === format)!.label}
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
