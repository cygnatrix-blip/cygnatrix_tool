/**
 * Standard passport/ID photo sizes. Unlike exam-presets.ts, these are stable,
 * well-documented international standards (not exam-specific requirements
 * that change per notification), so real values are used directly.
 */

export interface PassportPreset {
  id: string;
  name: string;
  /** Physical size, for display only. */
  physical: string;
  dpi: number;
  width: number;
  height: number;
}

const DPI = 300;
const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI);
const inToPx = (inches: number) => Math.round(inches * DPI);

export const PASSPORT_PRESETS: PassportPreset[] = [
  {
    id: 'india',
    name: 'India Passport Photo',
    physical: '35 × 45 mm',
    dpi: DPI,
    width: mmToPx(35),
    height: mmToPx(45),
  },
  {
    id: 'us',
    name: 'US Passport / Visa Photo',
    physical: '2 × 2 in',
    dpi: DPI,
    width: inToPx(2),
    height: inToPx(2),
  },
  {
    id: 'schengen',
    name: 'Schengen Visa Photo',
    physical: '35 × 45 mm',
    dpi: DPI,
    width: mmToPx(35),
    height: mmToPx(45),
  },
];

export function getPassportPreset(id: string): PassportPreset | undefined {
  return PASSPORT_PRESETS.find((p) => p.id === id);
}

/** The printable sheet: 4×6 in at the same 300 DPI as the photos. */
export const PRINT_SHEET = {
  widthIn: 4,
  heightIn: 6,
  dpi: DPI,
  width: inToPx(4),
  height: inToPx(6),
  marginPx: mmToPx(3),
  gapPx: mmToPx(2),
};
