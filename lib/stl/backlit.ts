/**
 * Simulates what a lithophane looks like with a light behind it.
 *
 * This is the question a lithophane tool actually has to answer. A shaded grey
 * render shows the geometry but tells you nothing about whether the picture
 * will read once lit, which is the only thing that matters — and it is the
 * reason people print one, look at it under room light, and conclude the tool
 * failed.
 *
 * The model is Beer–Lambert: light falling on material of thickness t leaves
 * with intensity I = I₀·e^(−μt), where μ is how strongly the filament absorbs.
 * That exponential is why lithophanes behave the way they do — the thin
 * highlights pull away fast while the thick shadows all crush towards black,
 * so a flat-looking photo prints flatter still.
 */

import type { HeightField, StlOptions } from './types';

export interface BacklitOptions {
  /** How strongly the material absorbs, per mm. Higher = darker overall. */
  absorption: number;
  /** Light colour behind the model, 0..255 each. */
  light: [number, number, number];
  /** Brightness of that light; 1 is a normal lamp. */
  intensity: number;
  /** Tint of the filament itself, 0..255 each. */
  material: [number, number, number];
  /**
   * Scale the result so the thinnest point comes out near white.
   *
   * Physically the raw numbers are tiny — 3 mm of white PLA transmits about
   * 2% — so an unscaled render is nearly black and tells you nothing. In
   * practice nobody looks at a lithophane that way: they move the lamp closer
   * or turn it up until the highlights are bright. Normalising reproduces
   * that, and leaves the preview showing what actually varies between
   * filaments, which is contrast rather than overall level.
   */
  autoExpose: boolean;
}

export const DEFAULT_BACKLIT: BacklitOptions = {
  absorption: 1.25,
  light: [255, 244, 224],
  intensity: 1,
  material: [255, 250, 240],
  autoExpose: true,
};

/** Roughly matched to how these filaments transmit; all are free to print. */
export const MATERIAL_PRESETS: { id: string; label: string; absorption: number; material: [number, number, number] }[] = [
  { id: 'white-pla', label: 'White PLA', absorption: 1.25, material: [255, 250, 240] },
  { id: 'natural-pla', label: 'Natural / clear PLA', absorption: 0.85, material: [252, 246, 228] },
  { id: 'warm-white', label: 'Warm white PLA', absorption: 1.35, material: [255, 243, 214] },
  { id: 'grey-pla', label: 'Light grey PLA', absorption: 1.9, material: [226, 226, 230] },
];

export const LIGHT_PRESETS: { id: string; label: string; light: [number, number, number] }[] = [
  { id: 'warm', label: 'Warm lamp', light: [255, 238, 210] },
  { id: 'neutral', label: 'Neutral white', light: [255, 255, 255] },
  { id: 'daylight', label: 'Daylight', light: [226, 238, 255] },
  { id: 'candle', label: 'Candle', light: [255, 206, 148] },
];

/** Thickness in mm at a sample, matching what the mesh builder will produce. */
export function thicknessOf(value: number, opts: StlOptions): number {
  const base = opts.mode === 'relief' ? Math.max(0, opts.baseThicknessMM) : 0;
  const span = Math.max(0, opts.maxThicknessMM - opts.minThicknessMM);
  return base + opts.minThicknessMM + value * span;
}

/**
 * Pure: the lit appearance as RGBA, same grid as the field.
 *
 * Masked-out samples come back fully transparent so a heart or a hanging hole
 * shows the light straight through, exactly as the printed part would.
 */
export function renderBacklit(
  field: HeightField,
  opts: StlOptions,
  look: BacklitOptions = DEFAULT_BACKLIT,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(field.width * field.height * 4);
  const mu = Math.max(0, look.absorption);

  let exposure = 1;
  if (look.autoExpose) {
    let brightest = 0;
    for (let i = 0; i < field.data.length; i += 1) {
      if (field.mask && field.mask[i] === 0) continue;
      const t = Math.exp(-mu * thicknessOf(field.data[i] ?? 0, opts));
      if (t > brightest) brightest = t;
    }
    if (brightest > 1e-6) exposure = 0.95 / brightest;
  }

  for (let i = 0; i < field.data.length; i += 1) {
    const o = i * 4;
    if (field.mask && field.mask[i] === 0) {
      // Nothing there: the lamp shines through unobstructed.
      out[o] = look.light[0] * look.intensity;
      out[o + 1] = look.light[1] * look.intensity;
      out[o + 2] = look.light[2] * look.intensity;
      out[o + 3] = 255;
      continue;
    }

    const t = thicknessOf(field.data[i] ?? 0, opts);
    const transmission = Math.exp(-mu * t);
    for (let c = 0; c < 3; c += 1) {
      // The light picks up the filament's own tint on the way through.
      const tint = (look.material[c] ?? 255) / 255;
      out[o + c] = (look.light[c] ?? 255) * look.intensity * exposure * transmission * tint;
    }
    out[o + 3] = 255;
  }
  return out;
}

/**
 * How much of the lit range the image actually uses, 0..1.
 *
 * Worth surfacing because it is the single best predictor of a disappointing
 * print: a photo that leaves most of this unused will come out as a flat grey
 * panel however many triangles it has, and the fix is contrast, not detail.
 */
export function tonalRange(field: HeightField, opts: StlOptions, look: BacklitOptions = DEFAULT_BACKLIT): number {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < field.data.length; i += 1) {
    if (field.mask && field.mask[i] === 0) continue;
    const v = Math.exp(-Math.max(0, look.absorption) * thicknessOf(field.data[i] ?? 0, opts));
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(1, (max - min) / max));
}
