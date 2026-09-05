/**
 * India GST rate presets, in one dated place.
 *
 * The "GST 2.0" reform effective 22 September 2025 collapsed the old four-slab
 * structure into two main slabs — 5% (merit) and 18% (standard) — plus a 40%
 * demerit rate for luxury and sin goods (which folded in the old 28% + variable
 * compensation cess for most items; tobacco keeps separate cess notifications).
 * The 12% and 28% slabs were withdrawn: most 12% items moved to 5%, and most
 * 28% items (ACs, TVs, refrigerators, small cars, cement) moved to 18%.
 * Special rates for precious metals and the diamond trade are retained.
 *
 * Last reviewed 2026-09-05.
 */
export type GstRegime = 'current' | 'legacy';

export const GST_CONFIG = {
  reformEffectiveFrom: '22 September 2025',
  current: {
    label: 'From 22 Sep 2025',
    rates: [0, 0.25, 1.5, 3, 5, 18, 40],
  },
  legacy: {
    label: 'Before 22 Sep 2025',
    rates: [0, 0.25, 3, 5, 12, 18, 28],
  },
} as const;
