/** Standard CR80 ID-card size (85.6 × 54 mm — the same size as a credit card
 * or PVC Aadhaar/Ayushman card) and an A4 print sheet, both at 300 DPI. */

const DPI = 300;
const mmToPx = (mm: number, dpi = DPI) => Math.round((mm / 25.4) * dpi);

export const CR80 = {
  widthMM: 85.6,
  heightMM: 54,
  dpi: DPI,
  width: mmToPx(85.6), // 1011
  height: mmToPx(54), // 638
} as const;

export const A4_SHEET = {
  widthMM: 210,
  heightMM: 297,
  dpi: DPI,
  width: mmToPx(210), // 2480
  height: mmToPx(297), // 3508
  /** Gap between the front and back cards on the sheet. */
  gapMM: 5,
  gapPx: mmToPx(5),
  /**
   * Cards sit at the top of the sheet rather than the middle, which leaves the
   * rest of the page free and puts them within reach of a guillotine. Kept
   * clear of the ~5mm most printers can't reach.
   */
  topMarginMM: 12,
  topMarginPx: mmToPx(12),
} as const;
