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

  it('trims a margin on all four sides', () => {
    const width = 60;
    const height = 40;
    const data = raster(width, height, (y, x) =>
      y >= 4 && y < height - 5 && x >= 3 && x < width - 7 ? ORANGE : WHITE,
    );

    const bounds = findContentBounds(data, width, height);
    expect(bounds).toEqual({ x: 3, y: 4, width: width - 7 - 3, height: height - 5 - 4 });
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
      return y < 5 ? WHITE : ORANGE;
    });

    expect(findContentBounds(data, width, height).y).toBe(5);
  });

  it('falls back to the full rect for an entirely blank image', () => {
    const width = 25;
    const height = 25;
    const data = raster(width, height, () => WHITE);

    expect(findContentBounds(data, width, height)).toEqual({ x: 0, y: 0, width, height });
  });
});
