/**
 * Default front/back crop regions for the official e-Aadhaar and Ayushman
 * Bharat / PM-JAY PDF downloads, as fractions of the rendered page (0..1,
 * top-left origin). These are starting guesses seeded from the well-known
 * template layout — every real "Aadhaar to PVC" tool uses the same
 * bottom-of-page convention — never a guarantee, since UIDAI/NHA can change
 * the template and Ayushman downloads vary by state portal. The UI always
 * shows these as draggable boxes so the user corrects them if needed.
 */

export interface FracBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type IdCardKind = 'aadhaar' | 'ayushman';

export interface IdCardPdfPreset {
  id: IdCardKind;
  name: string;
  /** Shown as a hint above the password field; null when passwords aren't typical. */
  passwordHint: string | null;
  front: FracBox;
  back: FracBox;
  note: string;
}

export const IDCARD_PDF_PRESETS: Record<IdCardKind, IdCardPdfPreset> = {
  aadhaar: {
    id: 'aadhaar',
    name: 'Aadhaar Card',
    passwordHint:
      'e-Aadhaar PDFs from UIDAI are usually password-protected: the first 4 letters of your name in CAPITALS, followed by your birth year (e.g. name "Rahul Sharma", born 1990 → RAHU1990). Spaces are ignored; if your name is under 4 letters, use it as-is.',
    front: { x: 0, y: 0.75, w: 0.5, h: 0.25 },
    back: { x: 0.5, y: 0.75, w: 0.5, h: 0.25 },
    note: 'Starts at the bottom quarter of the page, split down the middle — the standard e-Aadhaar layout. Drag the boxes if yours looks different.',
  },
  ayushman: {
    id: 'ayushman',
    name: 'Ayushman Bharat / PM-JAY Card',
    passwordHint: null,
    front: { x: 0, y: 0.55, w: 0.5, h: 0.22 },
    back: { x: 0.5, y: 0.55, w: 0.5, h: 0.22 },
    note: 'Ayushman downloads vary more between states — the boxes below are only a starting guess. Drag them to match your card before extracting.',
  },
};
