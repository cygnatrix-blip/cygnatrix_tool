'use client';

import { useEffect, useRef, useState } from 'react';
import { ZoomIn } from 'lucide-react';
import type { CropRect } from '@/lib/image/exam-photo';

export interface ImageCropFrameProps {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  /** width / height of both the crop frame and the required output. */
  aspectRatio: number;
  frameWidthPx?: number;
  onCropChange: (crop: CropRect) => void;
}

/**
 * A locked-aspect-ratio crop frame: drag to pan, slider (or pinch/wheel) to
 * zoom. The visible window always fully covers the frame — no gaps — and
 * `onCropChange` reports the corresponding rectangle in the *source* image's
 * own pixel coordinates, ready to hand to processExamImage.
 */
export function ImageCropFrame({
  src,
  naturalWidth,
  naturalHeight,
  aspectRatio,
  frameWidthPx = 280,
  onCropChange,
}: ImageCropFrameProps) {
  const frameW = frameWidthPx;
  const frameH = Math.round(frameWidthPx / aspectRatio);
  const coverScale = Math.max(frameW / naturalWidth, frameH / naturalHeight);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const displayScale = coverScale * zoom;
  const dispW = naturalWidth * displayScale;
  const dispH = naturalHeight * displayScale;

  const clampOffset = (x: number, y: number) => ({
    x: Math.min(0, Math.max(frameW - dispW, x)),
    y: Math.min(0, Math.max(frameH - dispH, y)),
  });

  // Re-clamp whenever zoom changes (zooming out can leave gaps otherwise).
  useEffect(() => {
    setOffset((prev) => clampOffset(prev.x, prev.y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, naturalWidth, naturalHeight, aspectRatio]);

  // Report the crop rect in source-image pixel coordinates whenever anything moves.
  useEffect(() => {
    const crop: CropRect = {
      x: Math.max(0, -offset.x / displayScale),
      y: Math.max(0, -offset.y / displayScale),
      width: Math.min(naturalWidth, frameW / displayScale),
      height: Math.min(naturalHeight, frameH / displayScale),
    };
    onCropChange(crop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, displayScale]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(clampOffset(dragRef.current.origX + dx, dragRef.current.origY + dy));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div
        ref={frameRef}
        className="relative touch-none overflow-hidden rounded-xl border-2 border-brand-400 bg-ink-100 shadow-inner dark:bg-ink-900"
        style={{ width: frameW, height: frameH, cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Crop preview"
          draggable={false}
          className="absolute left-0 top-0 max-w-none select-none"
          style={{ width: dispW, height: dispH, transform: `translate(${offset.x}px, ${offset.y}px)` }}
        />
      </div>
      <div className="flex w-full max-w-[280px] items-center gap-2">
        <ZoomIn className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          className="w-full accent-brand-600"
        />
      </div>
      <p className="text-center text-xs text-ink-400">Drag to reposition, use the slider to zoom</p>
    </div>
  );
}
