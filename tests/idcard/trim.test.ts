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

  it("leaves a border on all four sides alone — that is the card's own margin", () => {
    // The Ayushman back: white card with a quiet margin around its content.
    // Shaving this off and stretching makes the text and QR bleed off every
    // edge, which reads as the card being cropped.
    const width = 60;
    const height = 40;
    const data = raster(width, height, (y, x) =>
      y >= 4 && y < height - 5 && x >= 3 && x < width - 7 ? ORANGE : WHITE,
    );

    expect(findContentBounds(data, width, height)).toEqual({ x: 0, y: 0, width, height });
  });

  it("keeps the real back card's margin profile intact (58/63px sides, 19px bottom)", () => {
    // Measured from the reported file: blank on left, right and bottom but not
    // top — a border, not letterboxing, so nothing should be removed.
    const width = 200;
    const height = 100;
    const data = raster(width, height, (y, x) => {
      if (y === 0 && x > 90 && x < 110) return [20, 20, 20]; // the dark sliver along the top edge
      const inset = x >= 9 && x < width - 10 && y < height - 3;
      return inset ? ORANGE : WHITE;
    });

    expect(findContentBounds(data, width, height)).toEqual({ x: 0, y: 0, width, height });
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
