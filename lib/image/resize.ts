'use client';

export interface ResizeSpec {
  mode: 'dimensions' | 'percentage';
  width?: number;
  height?: number;
  percentage?: number;
  lockAspect: boolean;
}

export interface ResolvedSize {
  width: number;
  height: number;
}

/**
 * Turn a user resize spec into concrete target pixels, given the source size.
 * Pure — unit-tested.
 */
export function resolveTargetSize(
  source: ResolvedSize,
  spec: ResizeSpec,
): ResolvedSize {
  const clamp = (n: number) => Math.max(1, Math.round(n));

  if (spec.mode === 'percentage') {
    const pct = (spec.percentage ?? 100) / 100;
    if (!Number.isFinite(pct) || pct <= 0) throw new Error('Enter a percentage greater than 0.');
    return { width: clamp(source.width * pct), height: clamp(source.height * pct) };
  }

  const ratio = source.width / source.height;
  let { width, height } = spec;

  if (spec.lockAspect) {
    if (width && !height) height = width / ratio;
    else if (height && !width) width = height * ratio;
    else if (width && height) height = width / ratio; // width wins when both given
  }

  if (!width || !height) {
    width = width || source.width;
    height = height || source.height;
  }

  if (width <= 0 || height <= 0) throw new Error('Width and height must be greater than 0.');
  return { width: clamp(width), height: clamp(height) };
}
