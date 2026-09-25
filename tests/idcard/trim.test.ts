import { describe, expect, it } from 'vitest';
import { findContentBounds } from '@/lib/idcard/trim';

/** Builds an RGBA raster, painting rows via a per-row colour callback. */
function raster(width: number, height: number, rowColour: (y: number, x: number) => [number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = rowColour(y, x);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return data;
}

const WHITE: [number, number, number] = [255, 255, 255];
const ORANGE: [number, number, number] = [240, 130, 30];
const INK: [number, number, number] = [20, 20, 20];

describe('findContentBounds', () => {
  it('trims white bands above and below a card that already spans the full width', () => {
    // The reported failure: white strips top and bottom, card edge to edge.
    const width = 100;
    const height = 50;
    const data = raster(width, height, (y) => (y < 6 || y >= height - 8 ? WHITE : ORANGE));

    const bounds = findContentBounds(data, width, height);
    expect(bounds.y).toBe(6);
    expect(bounds.height).toBe(height - 8 - 6);
    expect(bounds.x).toBe(0);
    expect(bounds.width).toBe(width);
  });

  it('trims blank bands on the left and right when content spans the full height', () => {
    const width = 60;
    const height = 40;
    const data = raster(width, height, (y, x) => (x < 5 || x >= width - 8 ? WHITE : ORANGE));

    const bounds = findContentBounds(data, width, height);
    expect(bounds).toEqual({ x: 5, y: 0, width: width - 8 - 5, height });
  });

  it("leaves a sparse text boundary alone — that is the card's own margin", () => {
    // The Ayushman back: a white card whose content is text and a QR code, with
    // a quiet margin around it. Measured on the real file, the first inked line
    // inside that margin covers only 1–5% of the edge. Pulling in to it and
    // stretching makes the content bleed off every edge, reading as cropped.
    const width = 200;
    const height = 100;
    const data = raster(width, height, (y, x) => {
      const insideMargin = y >= 8 && y < height - 8 && x >= 10 && x < width - 10;
      const isTextRow = y % 6 < 2; // sparse lines of "text"
      const isGlyph = x % 7 < 3;
      return insideMargin && isTextRow && isGlyph ? INK : WHITE;
    });

    expect(findContentBounds(data, width, height)).toEqual({ x: 0, y: 0, width, height });
  });

  it('still trims when only one side has a dense card edge', () => {
    // Each side is judged on its own: a solid band at the bottom is the card's
    // edge, while the sparse text boundary at the top is not.
    const width = 200;
    const height = 100;
    const data = raster(width, height, (y, x) => {
      if (y >= height - 12 && y < height - 4) return ORANGE; // full-width band
      if (y >= height - 4) return WHITE; // blank below the band
      const isText = y >= 20 && y % 6 < 2 && x % 7 < 3 && x >= 10 && x < width - 10;
      return isText ? INK : WHITE;
    });

    const bounds = findContentBounds(data, width, height);
    expect(bounds.y).toBe(0); // sparse top boundary — left alone
    expect(bounds.height).toBe(height - 4); // dense bottom band — trimmed to it
  });

  it('never eats a coloured band — bright orange is not margin', () => {
    // Orange is bright, but its blue channel is low. A brightness-only test
    // would trim the card's own header/footer bands; this must not.
    const width = 40;
    const height = 30;
    const data = raster(width, height, () => ORANGE);

    expect(findContentBounds(data, width, height)).toEqual({ x: 0, y: 0, width, height });
  });

  it('leaves an image alone when there is no blank margin', () => {
    const width = 30;
    const height = 20;
    const data = raster(width, height, (y) => (y % 2 === 0 ? ORANGE : [10, 10, 10]));

    expect(findContentBounds(data, width, height)).toEqual({ x: 0, y: 0, width, height });
  });

  it('tolerates a stray speck inside an otherwise blank margin row', () => {
    const width = 200;
    const height = 40;
    const data = raster(width, height, (y, x) => {
      if (y === 2 && x === 120) return [40, 40, 40]; // a single dark noise pixel
      return y < 5 || y >= height - 6 ? WHITE : ORANGE;
    });

    const bounds = findContentBounds(data, width, height);
    expect(bounds.y).toBe(5);
    expect(bounds.height).toBe(height - 6 - 5);
  });

  it('falls back to the full rect for an entirely blank image', () => {
    const width = 25;
    const height = 25;
    const data = raster(width, height, () => WHITE);

    expect(findContentBounds(data, width, height)).toEqual({ x: 0, y: 0, width, height });
  });
});
