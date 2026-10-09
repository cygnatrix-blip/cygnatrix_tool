'use client';

import { useRef } from 'react';
import type { CropRect } from '@/lib/stl/types';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const CORNERS = ['tl', 'tr', 'bl', 'br'] as const;
type Corner = (typeof CORNERS)[number];

/**
 * A free-form crop rectangle drawn over an image.
 *
 * Free-form rather than aspect-locked on purpose: the model's proportions are
 * taken from whatever is selected, so forcing a ratio here would only get in
 * the way. Stored as fractions of the image so it survives any resize of the
 * element it is drawn over.
 */
export function CropFrame({
  stageRef,
  crop,
  onChange,
}: {
  stageRef: React.RefObject<HTMLDivElement | null>;
  crop: CropRect;
  onChange: (next: CropRect) => void;
}) {
  const dragRef = useRef<{ mode: 'move' | Corner; startX: number; startY: number; start: CropRect } | null>(null);

  const begin = (mode: 'move' | Corner) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, start: { ...crop } };
  };

  const move = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const rect = stage.getBoundingClientRect();
    const dx = (e.clientX - drag.startX) / rect.width;
    const dy = (e.clientY - drag.startY) / rect.height;
    const s = drag.start;

    if (drag.mode === 'move') {
      onChange({
        ...s,
        x: clamp01(Math.min(s.x + dx, 1 - s.w)),
        y: clamp01(Math.min(s.y + dy, 1 - s.h)),
      });
      return;
    }

    const right = s.x + s.w;
    const bottom = s.y + s.h;
    let x = s.x;
    let y = s.y;
    let w = s.w;
    let h = s.h;
    const MIN = 0.05;

    if (drag.mode === 'tl' || drag.mode === 'bl') {
      x = clamp01(Math.min(s.x + dx, right - MIN));
      w = right - x;
    } else {
      w = Math.max(MIN, Math.min(1 - s.x, s.w + dx));
    }
    if (drag.mode === 'tl' || drag.mode === 'tr') {
      y = clamp01(Math.min(s.y + dy, bottom - MIN));
      h = bottom - y;
    } else {
      h = Math.max(MIN, Math.min(1 - s.y, s.h + dy));
    }
    onChange({ x, y, w, h });
  };

  const end = (e: React.PointerEvent) => {
    dragRef.current = null;
    const el = e.target as Element;
    if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className="absolute cursor-move rounded-sm border-2"
      style={{
        left: `${crop.x * 100}%`,
        top: `${crop.y * 100}%`,
        width: `${crop.w * 100}%`,
        height: `${crop.h * 100}%`,
        borderColor: '#0d9089',
        background: 'rgba(13,144,137,0.10)',
        touchAction: 'none',
      }}
      onPointerDown={begin('move')}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {CORNERS.map((id) => (
        <span
          key={id}
          onPointerDown={begin(id)}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{
            left: id === 'tl' || id === 'bl' ? 0 : '100%',
            top: id === 'tl' || id === 'tr' ? 0 : '100%',
            background: '#0d9089',
            cursor: id === 'tl' || id === 'br' ? 'nwse-resize' : 'nesw-resize',
            touchAction: 'none',
          }}
        />
      ))}
    </div>
  );
}
