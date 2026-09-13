/**
 * Photo (and, for PAN, signature) specs for Indian ID-related applications.
 * Unlike exam-presets.ts, these are cross-checked against multiple current
 * sources rather than illustrative placeholders — but government portals do
 * change requirements without much notice, so every preset still carries a
 * `note` and `officialUrl` and the UI shows a "confirm before submitting"
 * banner, same as the exam tool.
 *
 * Sources cross-checked 2026-09-13:
 *  - NSDL (Protean) e-PAN: photo 3.5×2.5cm, signature 4.5×2cm, both ≤50KB, 200 DPI.
 *  - UTIITSL PAN: photo is a SQUARE 213×213px (NOT the same crop as NSDL's
 *    rectangle) — a photo cropped for one portal will be rejected by the other.
 *  - Aadhaar / Ayushman Bharat have no single fixed *online-upload* photo spec
 *    (most Aadhaar updates need only existing documents, under 2MB, no photo;
 *    Ayushman/PM-JAY runs through many state portals with their own limits).
 *    Both presets use India's standard 35×45mm ID-photo size for whenever a
 *    form or photo studio specifically asks for "an Aadhaar/Ayushman-style
 *    photo" — see each preset's `note`.
 */

import type { ExamFileSpec } from './exam-presets';
import { PASSPORT_PRESETS } from './passport-presets';

export interface IdCardPreset {
  id: string;
  name: string;
  shortLabel: string;
  photo: ExamFileSpec;
  /** Only PAN presets require a signature upload. */
  signature?: ExamFileSpec;
  verifiedOn: string;
  officialUrl: string;
  note: string;
}

const DPI = 200;
const cmToPx = (cm: number, dpi = DPI) => Math.round((cm / 2.54) * dpi);

// Aadhaar / Ayushman share India's standard 35×45mm ID-photo size (413×531px @ 300 DPI) —
// reusing the passport preset's numbers rather than recomputing keeps them from drifting apart.
const INDIA_STANDARD = PASSPORT_PRESETS.find((p) => p.id === 'india')!;

export const ID_CARD_PRESETS: IdCardPreset[] = [
  {
    id: 'pan-nsdl',
    name: 'PAN Card — NSDL (Protean) Portal',
    shortLabel: 'PAN (NSDL)',
    photo: { width: cmToPx(2.5), height: cmToPx(3.5), dpi: DPI, minKB: 4, maxKB: 50, format: 'jpg', background: 'white' },
    signature: { width: cmToPx(4.5), height: cmToPx(2), dpi: DPI, minKB: 4, maxKB: 50, format: 'jpg', background: 'white' },
    verifiedOn: '2026-09-13',
    officialUrl: 'https://www.protean-tinpan.com/',
    note: 'NSDL / Protean asks for a portrait photo (3.5 × 2.5 cm) and a signature (4.5 × 2 cm), each under 50 KB, on a plain white background.',
  },
  {
    id: 'pan-utiitsl',
    name: 'PAN Card — UTIITSL Portal',
    shortLabel: 'PAN (UTIITSL)',
    photo: { width: 213, height: 213, dpi: 200, minKB: 4, maxKB: 30, format: 'jpg', background: 'white' },
    signature: { width: cmToPx(4.5), height: cmToPx(2), dpi: DPI, minKB: 4, maxKB: 50, format: 'jpg', background: 'white' },
    verifiedOn: '2026-09-13',
    officialUrl: 'https://www.pan.utiitsl.com/',
    note: 'UTIITSL wants a SQUARE photo (213 × 213 px) — a different crop from NSDL\'s rectangle. A photo made for one portal will be rejected by the other, so pick the one matching where you\'re actually applying.',
  },
  {
    id: 'aadhaar-photo',
    name: 'Aadhaar-Standard Photo',
    shortLabel: 'Aadhaar',
    photo: { width: INDIA_STANDARD.width, height: INDIA_STANDARD.height, dpi: INDIA_STANDARD.dpi, minKB: 4, maxKB: 50, format: 'jpg', background: 'white' },
    verifiedOn: '2026-09-13',
    officialUrl: 'https://uidai.gov.in/',
    note: 'Most Aadhaar updates on myAadhaar only need your existing documents (JPEG/PNG/PDF, under 2 MB) — no new photo. New enrolment photos are captured live at an enrolment centre. Use this size only when a specific form or photo studio asks for an Aadhaar-standard (35 × 45 mm) photo.',
  },
  {
    id: 'ayushman-bharat',
    name: 'Ayushman Bharat / PM-JAY Photo',
    shortLabel: 'Ayushman Bharat',
    photo: { width: INDIA_STANDARD.width, height: INDIA_STANDARD.height, dpi: INDIA_STANDARD.dpi, minKB: 10, maxKB: 200, format: 'jpg', background: 'white' },
    verifiedOn: '2026-09-13',
    officialUrl: 'https://pmjay.gov.in/',
    note: 'Ayushman Bharat / PM-JAY registration runs through many different state portals and CSC centres, each with its own limits. This uses the most commonly requested size (35 × 45 mm, 10–200 KB) — check your specific portal before submitting.',
  },
];

export function getIdCardPreset(id: string): IdCardPreset | undefined {
  return ID_CARD_PRESETS.find((p) => p.id === id);
}
