'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  MousePointer2,
  Type,
  TextCursorInput,
  Pen,
  Highlighter,
  Square,
  Eraser,
  ImagePlus,
  Undo2,
  Trash2,
  X,
} from 'lucide-react';
import { FILE_LIMITS } from '@/config/site';
import { useFileTool } from '@/lib/hooks/useFileTool';
import { downloadBlob, bytesToBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { DropZone } from '@/components/file/DropZone';
import { FileList } from '@/components/file/FileList';
import { ProcessButton, ProgressIndicator, DownloadButton } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { Annotation, FontFamily, Point } from '@/lib/pdf/edit';
import type { TextRun } from '@/lib/pdf/text-runs';

const L = FILE_LIMITS.pdf;
const RENDER_DPI = 100;
const PT_PER_PX = 72 / RENDER_DPI;
const MAX_EDIT_PAGES = 60;

type Tool = 'select' | 'edittext' | 'text' | 'draw' | 'highlight' | 'whiteout' | 'rect' | 'image';

interface PageImg {
  pageNumber: number;
  url: string;
  /** natural pixel size of the rendered raster */
  w: number;
  h: number;
}

const TOOLS: { id: Tool; label: string; icon: typeof Type }[] = [
  { id: 'select', label: 'Select & move', icon: MousePointer2 },
  { id: 'edittext', label: 'Edit text', icon: TextCursorInput },
  { id: 'text', label: 'Add text', icon: Type },
  { id: 'draw', label: 'Draw', icon: Pen },
  { id: 'highlight', label: 'Highlight', icon: Highlighter },
  { id: 'whiteout', label: 'Whiteout', icon: Eraser },
  { id: 'rect', label: 'Rectangle', icon: Square },
  { id: 'image', label: 'Image / signature', icon: ImagePlus },
];

const SWATCHES = ['#111827', '#dc2626', '#2563eb', '#059669', '#d97706', '#facc15', '#ffffff'];

let uid = 0;
const nextId = () => `a${Date.now().toString(36)}${uid++}`;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const releaseCapture = (el: Element, pointerId: number) => {
  try {
    el.releasePointerCapture(pointerId);
  } catch {
    /* not the capturing element — implicit release on pointerup covers it */
  }
};
const previewFontStack = (f: FontFamily) =>
  f === 'serif'
    ? '"Times New Roman", Times, serif'
    : f === 'mono'
      ? '"Courier New", Courier, monospace'
      : 'Arial, "Helvetica Neue", Helvetica, sans-serif';

export function PdfEditorTool() {
  const ft = useFileTool({
    toolSlug: 'edit-pdf',
    category: 'pdf',
    accept: ['pdf'],
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: 1,
    multiple: false,
  });
  const file = ft.validFiles[0]?.file ?? null;

  const [pages, setPages] = useState<PageImg[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadPct, setLoadPct] = useState(0);

  const [tool, setTool] = useState<Tool>('select');
  const [annos, setAnnos] = useState<Annotation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [runsByPage, setRunsByPage] = useState<Record<number, TextRun[]>>({});
  const [runsLoading, setRunsLoading] = useState(false);
  const runsRequested = useRef<Set<number>>(new Set());

  const [color, setColor] = useState('#dc2626');
  const [sizePt, setSizePt] = useState(16);
  const [strokePt, setStrokePt] = useState(2);
  const [fontFam, setFontFam] = useState<FontFamily>('sans');
  const [bold, setBold] = useState(false);

  const [sigOpen, setSigOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<Blob | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [overlayW, setOverlayW] = useState(0);
  const firstPageRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<Map<number, HTMLImageElement>>(new Map());
  const bgCanvas = useRef<Map<number, HTMLCanvasElement | null>>(new Map());

  /* ---- render pages ---- */
  useEffect(() => {
    setAnnos([]);
    setActiveId(null);
    setOutput(null);
    setWarnings([]);
    setError(null);
    setTruncated(false);
    setRunsByPage({});
    runsRequested.current = new Set();
    bgCanvas.current = new Map();
    setPages((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
    if (!file) return;

    let cancelled = false;
    setLoading(true);
    setLoadPct(0);
    (async () => {
      try {
        const [{ pdfToImages }, { loadPdfDocument }, buf] = await Promise.all([
          import('@/lib/pdf/to-images'),
          import('@/lib/pdf/pdfjs'),
          file.arrayBuffer(),
        ]);
        const doc = await loadPdfDocument(buf.slice(0));
        const total = doc.numPages;
        await doc.destroy();
        if (cancelled) return;
        const wanted = Array.from({ length: Math.min(total, MAX_EDIT_PAGES) }, (_, i) => i + 1);
        const rendered = await pdfToImages(
          buf,
          { dpi: RENDER_DPI, quality: 0.82, mime: 'image/jpeg', pages: wanted },
          (done, count) => !cancelled && setLoadPct(Math.round((done / count) * 100)),
        );
        if (cancelled) return;
        setPages(
          rendered.map((p) => ({
            pageNumber: p.pageNumber,
            url: URL.createObjectURL(p.blob),
            w: p.width,
            h: p.height,
          })),
        );
        setTruncated(total > MAX_EDIT_PAGES);
      } catch (e) {
        if (!cancelled) {
          const { describePdfLoadError } = await import('@/lib/pdf/pdfjs');
          setError(describePdfLoadError(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  /* ---- measure displayed width ---- */
  useEffect(() => {
    const el = firstPageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setOverlayW(el.clientWidth));
    ro.observe(el);
    setOverlayW(el.clientWidth);
    return () => ro.disconnect();
  }, [pages.length]);

  /* ---- lazily pull existing text runs when Edit text is picked ---- */
  useEffect(() => {
    if (tool !== 'edittext' || !file || pages.length === 0) return;
    const missing = pages.map((p) => p.pageNumber).filter((n) => !runsRequested.current.has(n));
    if (missing.length === 0) return;
    missing.forEach((n) => runsRequested.current.add(n));

    let cancelled = false;
    setRunsLoading(true);
    (async () => {
      try {
        const [{ extractTextRuns }, buf] = await Promise.all([
          import('@/lib/pdf/text-runs'),
          file.arrayBuffer(),
        ]);
        const runs = await extractTextRuns(buf, missing);
        if (cancelled) return;
        setRunsByPage((prev) => {
          const next = { ...prev };
          for (const n of missing) next[n] = [];
          for (const r of runs) (next[r.page] = next[r.page] ?? []).push(r);
          return next;
        });
      } catch {
        /* Edit text just won't show click targets — the other tools still work. */
      } finally {
        if (!cancelled) setRunsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tool, file, pages]);

  /* ---- annotation helpers ---- */
  const addAnno = useCallback((a: Annotation) => {
    setAnnos((prev) => [...prev, a]);
    setActiveId(a.id);
    setOutput(null);
  }, []);
  const patchAnno = useCallback((id: string, patch: Partial<Annotation>) => {
    setAnnos((prev) => prev.map((a) => (a.id === id ? ({ ...a, ...patch } as Annotation) : a)));
    setOutput(null);
  }, []);
  const removeAnno = useCallback((id: string) => {
    setAnnos((prev) => {
      const gid = prev.find((a) => a.id === id)?.groupId;
      return prev.filter((a) => a.id !== id && (!gid || a.groupId !== gid));
    });
    setActiveId((cur) => (cur === id ? null : cur));
    setOutput(null);
  }, []);
  const undo = useCallback(() => {
    setAnnos((prev) => {
      if (prev.length === 0) return prev;
      const gid = prev[prev.length - 1]!.groupId;
      return gid ? prev.filter((a) => a.groupId !== gid) : prev.slice(0, -1);
    });
    setActiveId(null);
    setOutput(null);
  }, []);
  const clearAll = useCallback(() => {
    setAnnos([]);
    setActiveId(null);
    setOutput(null);
  }, []);

  const active = annos.find((a) => a.id === activeId) ?? null;
  useEffect(() => {
    if (!active) return;
    if ('color' in active && active.color) setColor(active.color);
    if (active.type === 'text') {
      setSizePt(active.sizePt);
      setFontFam(active.font);
      setBold(active.bold);
    }
    if (active.type === 'draw' || active.type === 'rect') setStrokePt(active.strokePt ?? 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const applyStyle = (patch: Partial<Annotation>) => {
    if (activeId) patchAnno(activeId, patch);
  };

  /* ---- background sampling for Edit text ---- */
  const sampleBg = (page: PageImg, fx: number, fy: number): string => {
    let canvas = bgCanvas.current.get(page.pageNumber);
    if (canvas === undefined) {
      const img = imgRefs.current.get(page.pageNumber);
      canvas = null;
      if (img && img.complete && img.naturalWidth) {
        try {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext('2d')!.drawImage(img, 0, 0);
          canvas = c;
        } catch {
          canvas = null;
        }
      }
      bgCanvas.current.set(page.pageNumber, canvas);
    }
    if (!canvas) return '#ffffff';
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#ffffff';
    const probes: [number, number][] = [
      [fx, fy],
      [clamp01(fx - 0.015), fy],
      [clamp01(fx + 0.015), fy],
    ];
    let best = [255, 255, 255];
    let bestSum = -1;
    for (const [px, py] of probes) {
      try {
        const d = ctx.getImageData(
          Math.min(canvas.width - 1, Math.max(0, Math.round(px * canvas.width))),
          Math.min(canvas.height - 1, Math.max(0, Math.round(py * canvas.height))),
          1,
          1,
        ).data;
        const sum = d[0]! + d[1]! + d[2]!;
        if (sum > bestSum) {
          bestSum = sum;
          best = [d[0]!, d[1]!, d[2]!];
        }
      } catch {
        return '#ffffff';
      }
    }
    return `#${best.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  };

  const editRun = (page: PageImg, r: TextRun) => {
    if (busy) return;
    const padX = 0.006;
    const padY = 0.004;
    const bg = sampleBg(page, r.x - 0.02 > 0 ? r.x - 0.02 : r.x + r.w + 0.01, r.y + r.h / 2);
    const gid = nextId();
    const whiteout: Annotation = {
      id: nextId(),
      groupId: gid,
      page: r.page,
      type: 'whiteout',
      x: Math.max(0, r.x - padX),
      y: Math.max(0, r.y - padY),
      w: r.w + padX * 2 + 0.04,
      h: r.h + padY * 2,
      color: bg,
    };
    const text: Annotation = {
      id: nextId(),
      groupId: gid,
      page: r.page,
      type: 'text',
      x: r.x,
      y: r.y,
      text: r.text,
      sizePt: Math.round(r.sizePt * 10) / 10,
      color: '#111111',
      font: r.font,
      bold: r.bold,
    };
    setAnnos((prev) => [...prev, whiteout, text]);
    setActiveId(text.id);
    setTool('select');
    setOutput(null);
  };

  /* ---- pointer gestures on a page overlay ---- */
  const gesture = useRef<
    | null
    | { kind: 'box'; page: number; x0: number; y0: number }
    | { kind: 'draw'; page: number; pts: Point[] }
    | { kind: 'move'; id: string; px: number; py: number; ox: number; oy: number }
    | { kind: 'resize'; id: string; ox: number; oy: number; ow: number; oh: number; px: number; py: number }
  >(null);
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [inkDraft, setInkDraft] = useState<{ page: number; pts: Point[] } | null>(null);

  const fracAt = (e: React.PointerEvent, el: HTMLElement): Point => {
    const r = el.getBoundingClientRect();
    return { x: clamp01((e.clientX - r.left) / r.width), y: clamp01((e.clientY - r.top) / r.height) };
  };

  const onOverlayDown = (e: React.PointerEvent, page: PageImg) => {
    if (busy) return;
    const el = e.currentTarget as HTMLElement;
    const f = fracAt(e, el);
    if (tool === 'select' || tool === 'edittext') {
      setActiveId(null);
      return;
    }
    if (tool === 'image') {
      setSigOpen(true);
      return;
    }
    el.setPointerCapture(e.pointerId);
    if (tool === 'text') {
      addAnno({
        id: nextId(),
        page: page.pageNumber,
        type: 'text',
        x: f.x,
        y: f.y,
        text: '',
        sizePt,
        color,
        font: fontFam,
        bold,
      });
      setTool('select');
      return;
    }
    if (tool === 'draw') {
      gesture.current = { kind: 'draw', page: page.pageNumber, pts: [f] };
      setInkDraft({ page: page.pageNumber, pts: [f] });
      return;
    }
    gesture.current = { kind: 'box', page: page.pageNumber, x0: f.x, y0: f.y };
    setDraft({ x: f.x, y: f.y, w: 0, h: 0 });
  };

  const onOverlayMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const el = e.currentTarget as HTMLElement;
    const f = fracAt(e, el);
    if (g.kind === 'box') {
      setDraft({
        x: Math.min(g.x0, f.x),
        y: Math.min(g.y0, f.y),
        w: Math.abs(f.x - g.x0),
        h: Math.abs(f.y - g.y0),
      });
    } else if (g.kind === 'draw') {
      const last = g.pts[g.pts.length - 1]!;
      if (Math.hypot(f.x - last.x, f.y - last.y) > 0.004) {
        g.pts.push(f);
        setInkDraft({ page: g.page, pts: [...g.pts] });
      }
    }
  };

  const onOverlayUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    releaseCapture(e.currentTarget as HTMLElement, e.pointerId);
    if (!g) return;
    if (g.kind === 'box') {
      gesture.current = null;
      if (draft && draft.w > 0.01 && draft.h > 0.01) {
        addAnno(
          tool === 'rect'
            ? { id: nextId(), page: g.page, type: 'rect', ...draft, color, outline: true, strokePt, opacity: 1 }
            : tool === 'highlight'
              ? { id: nextId(), page: g.page, type: 'highlight', ...draft, color, opacity: 0.35 }
              : { id: nextId(), page: g.page, type: 'whiteout', ...draft, color: '#ffffff' },
        );
        setTool('select');
      }
      setDraft(null);
    } else if (g.kind === 'draw') {
      gesture.current = null;
      if (g.pts.length >= 2) {
        addAnno({ id: nextId(), page: g.page, type: 'draw', points: g.pts, color, strokePt });
        setTool('select');
      }
      setInkDraft(null);
    }
  };

  /* ---- move / resize an existing annotation ---- */
  const startMove = (e: React.PointerEvent, a: Annotation) => {
    if (tool !== 'select' || busy) return;
    e.stopPropagation();
    setActiveId(a.id);
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const parent = el.closest('[data-overlay]') as HTMLElement;
    const f = fracAt(e, parent);
    gesture.current = {
      kind: 'move',
      id: a.id,
      px: f.x,
      py: f.y,
      ox: 'x' in a ? a.x : 0,
      oy: 'y' in a ? a.y : 0,
    };
  };
  const startResize = (e: React.PointerEvent, a: Extract<Annotation, { w: number }>) => {
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const parent = el.closest('[data-overlay]') as HTMLElement;
    const f = fracAt(e, parent);
    gesture.current = { kind: 'resize', id: a.id, ox: a.x, oy: a.y, ow: a.w, oh: a.h, px: f.x, py: f.y };
  };
  const onHandleMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || (g.kind !== 'move' && g.kind !== 'resize')) return;
    const parent = (e.currentTarget as HTMLElement).closest('[data-overlay]') as HTMLElement;
    if (!parent) return;
    const f = fracAt(e, parent);
    if (g.kind === 'move') {
      const a = annos.find((x) => x.id === g.id);
      if (!a || a.type === 'draw') return;
      patchAnno(g.id, { x: clamp01(g.ox + (f.x - g.px)), y: clamp01(g.oy + (f.y - g.py)) } as Partial<Annotation>);
    } else {
      patchAnno(g.id, {
        w: Math.max(0.02, g.ow + (f.x - g.px)),
        h: Math.max(0.02, g.oh + (f.y - g.py)),
      } as Partial<Annotation>);
    }
  };
  const endHandle = (e: React.PointerEvent) => {
    releaseCapture(e.currentTarget as HTMLElement, e.pointerId);
    if (gesture.current?.kind === 'move' || gesture.current?.kind === 'resize') gesture.current = null;
  };

  /* ---- apply + download ---- */
  const run = async () => {
    if (!file) return;
    const usable = annos.filter((a) => (a.type === 'text' ? a.text.trim() !== '' : true));
    if (usable.length === 0) {
      setError('Add at least one edit — some text, a highlight, a signature — before saving.');
      return;
    }
    setBusy(true);
    setError(null);
    setOutput(null);
    setWarnings([]);
    try {
      const [{ applyPdfEdits }, buf] = await Promise.all([import('@/lib/pdf/edit'), file.arrayBuffer()]);
      const { bytes, warnings: w } = await applyPdfEdits(buf, usable);
      setOutput(bytesToBlob(bytes, 'application/pdf'));
      setWarnings(w);
      track('tool_completed', {
        toolSlug: 'edit-pdf',
        category: 'pdf',
        meta: { edits: usable.length, kinds: [...new Set(usable.map((a) => a.type))].join('+') },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while saving your edits.');
      track('tool_failed', { toolSlug: 'edit-pdf', category: 'pdf' });
    } finally {
      setBusy(false);
    }
  };

  const showStroke = tool === 'draw' || tool === 'rect' || active?.type === 'draw' || active?.type === 'rect';
  const showText = tool === 'text' || active?.type === 'text';
  const showColor = (tool !== 'whiteout' && tool !== 'select' && tool !== 'edittext') || (active != null && active.type !== 'whiteout');
  const showStyleRow = (tool !== 'select' && tool !== 'edittext') || active != null;

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

      {loading && <ProgressIndicator value={loadPct || 8} label="Rendering pages…" />}

      {pages.length > 0 && (
        <div className="mt-4 space-y-3">
          {/* toolbar */}
          <div className="sticky top-2 z-20 rounded-2xl border border-ink-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-ink-800 dark:bg-ink-900/95">
            <div className="flex flex-wrap items-center gap-1.5">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => (t.id === 'image' ? setSigOpen(true) : setTool(t.id))}
                  aria-pressed={tool === t.id}
                  title={t.label}
                  className={cn(
                    'flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition',
                    tool === t.id
                      ? 'bg-brand-600 text-white'
                      : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800',
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
              <span className="mx-1 hidden h-6 w-px bg-ink-200 dark:bg-ink-700 sm:block" />
              <button
                type="button"
                onClick={undo}
                disabled={annos.length === 0}
                title="Undo last edit"
                className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-ink-600 hover:bg-ink-100 disabled:opacity-40 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                <Undo2 className="h-4 w-4" />
                <span className="hidden sm:inline">Undo</span>
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={annos.length === 0}
                title="Remove all edits"
                className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-ink-600 hover:bg-ink-100 disabled:opacity-40 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>

            {showStyleRow && (
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-2 dark:border-ink-800">
                {showColor && (
                  <div className="flex items-center gap-1">
                    {SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Colour ${c}`}
                        onClick={() => {
                          setColor(c);
                          applyStyle({ color: c } as Partial<Annotation>);
                        }}
                        className={cn(
                          'h-6 w-6 rounded-full border',
                          color.toLowerCase() === c.toLowerCase()
                            ? 'ring-2 ring-brand-500 ring-offset-1 dark:ring-offset-ink-900'
                            : 'border-ink-300 dark:border-ink-600',
                        )}
                        style={{ background: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        setColor(e.target.value);
                        applyStyle({ color: e.target.value } as Partial<Annotation>);
                      }}
                      aria-label="Custom colour"
                      className="h-6 w-8 cursor-pointer rounded border border-ink-300 bg-transparent dark:border-ink-600"
                    />
                  </div>
                )}

                {showText && (
                  <>
                    <label className="flex items-center gap-1 text-xs text-ink-500">
                      Size
                      <input
                        type="number"
                        min={6}
                        max={96}
                        value={sizePt}
                        onChange={(e) => {
                          const v = Math.min(96, Math.max(6, Number(e.target.value) || 16));
                          setSizePt(v);
                          applyStyle({ sizePt: v } as Partial<Annotation>);
                        }}
                        className="w-14 rounded border border-ink-300 bg-transparent px-1.5 py-1 text-xs dark:border-ink-600"
                      />
                    </label>
                    <select
                      value={fontFam}
                      onChange={(e) => {
                        const v = e.target.value as FontFamily;
                        setFontFam(v);
                        applyStyle({ font: v } as Partial<Annotation>);
                      }}
                      className="rounded border border-ink-300 bg-transparent px-1.5 py-1 text-xs dark:border-ink-600"
                    >
                      <option value="sans">Sans</option>
                      <option value="serif">Serif</option>
                      <option value="mono">Mono</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setBold(!bold);
                        applyStyle({ bold: !bold } as Partial<Annotation>);
                      }}
                      aria-pressed={bold}
                      className={cn(
                        'h-7 w-7 rounded border text-xs font-bold',
                        bold
                          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40'
                          : 'border-ink-300 dark:border-ink-600',
                      )}
                    >
                      B
                    </button>
                  </>
                )}

                {showStroke && (
                  <label className="flex items-center gap-1 text-xs text-ink-500">
                    Stroke
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={strokePt}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setStrokePt(v);
                        applyStyle({ strokePt: v } as Partial<Annotation>);
                      }}
                      className="w-20 accent-brand-600"
                    />
                  </label>
                )}

                {active && (
                  <button
                    type="button"
                    onClick={() => removeAnno(active.id)}
                    className="ml-auto flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <X className="h-3.5 w-3.5" /> Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {truncated && (
            <Alert tone="warning">
              This PDF has more than {MAX_EDIT_PAGES} pages. Only the first {MAX_EDIT_PAGES} are shown
              for editing — split it first with Split PDF if you need a later page.
            </Alert>
          )}
          <p className="text-xs text-ink-400">
            {tool === 'edittext'
              ? runsLoading
                ? 'Reading the existing text…'
                : (runsByPage[pages[0]?.pageNumber ?? 1]?.length ?? 0) === 0
                  ? 'No selectable text found — this looks like a scan. Use Whiteout + Text instead.'
                  : 'Click existing text to cover it and retype. Check the size and font afterwards — the built-in fonts cover Latin characters only.'
              : 'Tip: text uses the built-in PDF fonts (Latin characters); the rupee sign becomes “Rs.”.'}
          </p>

          {/* pages */}
          <div className="space-y-6">
            {pages.map((page, idx) => {
              const pageWidthPt = page.w * PT_PER_PX;
              const pxPerPt = overlayW > 0 ? overlayW / pageWidthPt : 1;
              const pageAnnos = annos.filter((a) => a.page === page.pageNumber);
              const pageRuns = tool === 'edittext' ? runsByPage[page.pageNumber] ?? [] : [];
              return (
                <div
                  key={page.pageNumber}
                  ref={idx === 0 ? firstPageRef : undefined}
                  className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-lg border border-ink-200 shadow-sm dark:border-ink-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={(el) => {
                      if (el) imgRefs.current.set(page.pageNumber, el);
                    }}
                    src={page.url}
                    alt={`Page ${page.pageNumber}`}
                    className="block w-full select-none"
                    draggable={false}
                  />
                  <div
                    data-overlay
                    className={cn(
                      'absolute inset-0',
                      tool === 'select' || tool === 'edittext' ? 'cursor-default' : 'cursor-crosshair',
                    )}
                    onPointerDown={(e) => onOverlayDown(e, page)}
                    onPointerMove={(e) => {
                      onOverlayMove(e);
                      onHandleMove(e);
                    }}
                    onPointerUp={(e) => {
                      onOverlayUp(e);
                      endHandle(e);
                    }}
                  >
                    {/* existing-text click targets */}
                    {pageRuns.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          editRun(page, r);
                        }}
                        title={`Edit: ${r.text.slice(0, 48)}`}
                        className="absolute rounded-[2px] outline outline-1 outline-brand-400/25 transition hover:bg-brand-400/20 hover:outline-brand-500"
                        style={{
                          left: `${r.x * 100}%`,
                          top: `${r.y * 100}%`,
                          width: `${r.w * 100}%`,
                          height: `${r.h * 100}%`,
                          cursor: 'text',
                        }}
                      />
                    ))}

                    {/* ink */}
                    <svg
                      className="pointer-events-none absolute inset-0 h-full w-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      {pageAnnos
                        .filter((a): a is Extract<Annotation, { type: 'draw' }> => a.type === 'draw')
                        .map((a) => (
                          <polyline
                            key={a.id}
                            points={a.points.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
                            fill="none"
                            stroke={a.color}
                            strokeWidth={(a.strokePt ?? 2) * pxPerPt}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            className={cn(tool === 'select' && 'pointer-events-auto cursor-move')}
                            onPointerDown={(e) => startMove(e, a)}
                          />
                        ))}
                      {inkDraft && inkDraft.page === page.pageNumber && (
                        <polyline
                          points={inkDraft.pts.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
                          fill="none"
                          stroke={color}
                          strokeWidth={strokePt * pxPerPt}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      )}
                    </svg>

                    {pageAnnos.map((a) => {
                      if (a.type === 'draw') return null;
                      const selected = activeId === a.id;
                      if (a.type === 'text') {
                        return (
                          <EditableText
                            key={a.id}
                            anno={a}
                            selected={selected}
                            fontPx={a.sizePt * pxPerPt}
                            onChange={(text) => patchAnno(a.id, { text } as Partial<Annotation>)}
                            onFocus={() => setActiveId(a.id)}
                            onGrab={(e) => startMove(e, a)}
                          />
                        );
                      }
                      return (
                        <div
                          key={a.id}
                          onPointerDown={(e) => startMove(e, a)}
                          className={cn(
                            'absolute',
                            tool === 'select' && 'cursor-move',
                            selected && 'outline outline-2 outline-brand-500',
                          )}
                          style={{
                            left: `${a.x * 100}%`,
                            top: `${a.y * 100}%`,
                            width: `${a.w * 100}%`,
                            height: `${a.h * 100}%`,
                          }}
                        >
                          {a.type === 'image' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.data} alt="" className="h-full w-full object-contain" draggable={false} />
                          ) : (
                            <div
                              className="h-full w-full"
                              style={
                                a.type === 'whiteout'
                                  ? { background: a.color }
                                  : a.type === 'highlight'
                                    ? { background: a.color, opacity: a.opacity ?? 0.35 }
                                    : { border: `${(a.strokePt ?? 2) * pxPerPt}px solid ${a.color}` }
                              }
                            />
                          )}
                          {selected && tool === 'select' && (
                            <span
                              onPointerDown={(e) => startResize(e, a as Extract<Annotation, { w: number }>)}
                              className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-full border border-white bg-brand-600"
                              title="Drag to resize"
                            />
                          )}
                        </div>
                      );
                    })}

                    {draft && gesture.current?.kind === 'box' && gesture.current.page === page.pageNumber && (
                      <div
                        className="absolute border-2 border-dashed border-brand-500 bg-brand-500/10"
                        style={{
                          left: `${draft.x * 100}%`,
                          top: `${draft.y * 100}%`,
                          width: `${draft.w * 100}%`,
                          height: `${draft.h * 100}%`,
                        }}
                      />
                    )}
                  </div>

                  <span className="pointer-events-none absolute right-1.5 top-1.5 rounded bg-ink-900/60 px-1.5 py-0.5 text-[10px] text-white">
                    {page.pageNumber}
                  </span>
                </div>
              );
            })}
          </div>

          <ProcessButton onClick={run} busy={busy}>
            Apply edits &amp; download PDF
          </ProcessButton>
        </div>
      )}

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert tone="warning" className="mt-4" title="Saved with notes">
          <ul className="list-disc pl-4">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Alert>
      )}

      {output && (
        <div className="mt-4 space-y-3">
          <Alert tone="success">Your edited PDF is ready.</Alert>
          <DownloadButton onClick={() => downloadBlob(output, 'edited.pdf')}>
            Download edited.pdf
          </DownloadButton>
        </div>
      )}

      {sigOpen && (
        <SignatureModal
          onClose={() => setSigOpen(false)}
          onInsert={(data, ratio) => {
            setSigOpen(false);
            const targetPage = pages[0]?.pageNumber ?? 1;
            const w = 0.3;
            addAnno({
              id: nextId(),
              page: targetPage,
              type: 'image',
              x: 0.35,
              y: 0.4,
              w,
              h: w * ratio * (pages[0] ? pages[0].w / pages[0].h : 1),
              data,
            });
            setTool('select');
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Editable text box                                                          */
/* -------------------------------------------------------------------------- */

function EditableText({
  anno,
  selected,
  fontPx,
  onChange,
  onFocus,
  onGrab,
}: {
  anno: Extract<Annotation, { type: 'text' }>;
  selected: boolean;
  fontPx: number;
  onChange: (text: string) => void;
  onFocus: () => void;
  onGrab: (e: React.PointerEvent) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.width = '0px';
    el.style.width = `${Math.max(el.scrollWidth + 2, fontPx * 0.6)}px`;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [anno.text, fontPx, anno.font, anno.bold]);

  return (
    <div className="absolute" style={{ left: `${anno.x * 100}%`, top: `${anno.y * 100}%`, maxWidth: '95%' }}>
      {selected && (
        <span
          onPointerDown={onGrab}
          className="absolute -left-3 -top-3 flex h-5 w-5 cursor-move items-center justify-center rounded bg-brand-600 text-[10px] text-white"
          title="Drag to move"
        >
          ✥
        </span>
      )}
      <textarea
        ref={ref}
        value={anno.text}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onPointerDown={(e) => e.stopPropagation()}
        rows={1}
        autoFocus
        placeholder="Type…"
        spellCheck={false}
        className={cn(
          'block resize-none overflow-hidden bg-transparent p-0 leading-tight outline-none',
          selected ? 'ring-1 ring-brand-500' : 'ring-1 ring-transparent hover:ring-ink-300',
        )}
        style={{
          color: anno.color,
          fontSize: `${fontPx}px`,
          fontFamily: previewFontStack(anno.font),
          fontWeight: anno.bold ? 700 : 400,
          whiteSpace: 'pre',
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Signature / image modal                                                    */
/* -------------------------------------------------------------------------- */

function SignatureModal({
  onClose,
  onInsert,
}: {
  onClose: () => void;
  onInsert: (dataUrl: string, heightOverWidth: number) => void;
}) {
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const dirtyRef = useRef(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  }, [mode]);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };
  const down = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    c.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const ctx = c.getContext('2d')!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    dirtyRef.current = true;
  };
  const up = () => {
    drawingRef.current = false;
  };
  const clear = () => {
    const c = canvasRef.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    dirtyRef.current = false;
  };

  const insertDrawn = () => {
    const c = canvasRef.current!;
    if (!dirtyRef.current) {
      setErr('Draw your signature first.');
      return;
    }
    onInsert(c.toDataURL('image/png'), c.height / c.width);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/image\/(png|jpeg)/.test(f.type)) {
      setErr('Choose a PNG or JPG image.');
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setErr('That image is over 8 MB — use a smaller one.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const img = new Image();
      img.onload = () => onInsert(url, img.naturalHeight / img.naturalWidth);
      img.onerror = () => setErr('That image could not be read.');
      img.src = url;
    };
    reader.readAsDataURL(f);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-ink-900"
        role="dialog"
        aria-modal="true"
        aria-label="Add image or signature"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Add a signature or image</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-ink-100 dark:hover:bg-ink-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 flex gap-1 rounded-lg bg-ink-100 p-1 text-sm dark:bg-ink-800">
          {(['draw', 'upload'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setErr(null);
              }}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 font-medium capitalize transition',
                mode === m ? 'bg-white shadow-sm dark:bg-ink-900' : 'text-ink-500',
              )}
            >
              {m === 'draw' ? 'Draw' : 'Upload'}
            </button>
          ))}
        </div>

        {mode === 'draw' ? (
          <>
            <canvas
              ref={canvasRef}
              width={600}
              height={220}
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              className="w-full touch-none rounded-lg border border-ink-300 bg-white dark:border-ink-600"
            />
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="sm" onClick={clear}>
                Clear
              </Button>
              <Button size="sm" className="ml-auto" onClick={insertDrawn}>
                Insert signature
              </Button>
            </div>
          </>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-ink-300 p-8 text-center text-sm text-ink-500 dark:border-ink-600">
            <ImagePlus className="h-8 w-8 text-brand-500" />
            Choose a PNG or JPG
            <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={onFile} />
          </label>
        )}

        {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
      </div>
    </div>
  );
}
