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

  it('trims down to sparse text content too, leaving no white anywhere', () => {
    // The Ayushman back: a white card whose content is text and a QR code with
    // a margin around it. That margin is removed as well — filling completely
    // is preferred over keeping it, even though it means the text ends up
    // flush with the card's edge.
    const width = 200;
    const height = 100;
    const data = raster(width, height, (y, x) => {
      const insideMargin = y >= 8 && y < height - 8 && x >= 10 && x < width - 10;
      const isTextRow = y % 6 < 2; // sparse lines of "text"
      const isGlyph = x % 7 < 3;
      return insideMargin && isTextRow && isGlyph ? INK : WHITE;
    });

    // Pulled in on all four sides, down to the glyphs themselves.
    const bounds = findContentBounds(data, width, height);
    expect(bounds.y).toBeGreaterThanOrEqual(8);
    expect(bounds.x).toBeGreaterThanOrEqual(10);
    expect(bounds.x + bounds.width).toBeLessThan(width);
    expect(bounds.y + bounds.height).toBeLessThan(height);
  });

  it('trims each side independently', () => {
    const width = 200;
    const height = 100;
    const data = raster(width, height, (y, x) =>
      y >= 6 && y < height - 4 && x >= 3 && x < width - 9 ? ORANGE : WHITE,
    );

    expect(findContentBounds(data, width, height)).toEqual({
      x: 3,
      y: 6,
      width: width - 9 - 3,
      height: height - 4 - 6,
    });
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

  it('trims a JPEG-noisy near-white band, not just a flat white one', () => {
    // Measured on a real card JPEG: the white band averages 250, but only ~98%
    // of its pixels are flat white — the rest is compression ringing just under
    // white. Counting that as content is what left the band in the output.
    const width = 200;
    const height = 100;
    const noisy = (x: number): [number, number, number] => {
      if (x % 50 === 0) return [228, 230, 231]; // ringing
      if (x % 17 === 0) return [247, 248, 248];
      return [255, 255, 255];
    };
    const data = raster(width, height, (y, x) =>
      y < 20 || y >= height - 15 ? noisy(x) : ORANGE,
    );

    const bounds = findContentBounds(data, width, height);
    expect(bounds.y).toBe(20);
    expect(bounds.height).toBe(height - 15 - 20);
  });

  it('still treats genuinely dark pixels in a margin as content', () => {
    const width = 200;
    const height = 100;
    const data = raster(width, height, (y, x) => {
      if (y === 4 && x >= 20 && x < 120) return INK; // a real line of content
      return y < 20 || y >= height - 15 ? WHITE : ORANGE;
    });

    expect(findContentBounds(data, width, height).y).toBe(4);
  });

  it('sees past a hairline frame drawn on the outer edge', () => {
    // Real card exports carry a 1px border line right at the edge. Stopping on
    // it leaves the whole blank margin just inside untouched, so the card keeps
    // a white border however it is fitted.
    const width = 200;
    const height = 100;
    const data = raster(width, height, (y, x) => {
      const onFrame = y === 0 || y === height - 1 || x === 0 || x === width - 1;
      if (onFrame) return INK;
      return y >= 18 && y < height - 14 && x >= 12 && x < width - 16 ? ORANGE : WHITE;
    });

    expect(findContentBounds(data, width, height)).toEqual({
      x: 12,
      y: 18,
      width: width - 16 - 12,
      height: height - 14 - 18,
    });
  });

  it('keeps content that genuinely runs to the edge', () => {
    // A thick inked run at the edge is the card itself, not a frame.
    const width = 200;
    const height = 100;
    const data = raster(width, height, () => ORANGE);

    expect(findContentBounds(data, width, height)).toEqual({ x: 0, y: 0, width, height });
  });

  it('trims transparent padding, which renders as white on the finished card', () => {
    // A PNG exported with see-through margins. Raw RGB there is (0,0,0), so
    // reading the pixel directly makes it look like solid black ink and it is
    // never trimmed — then it composites onto the white card as a white bar.
    const width = 200;
    const height = 100;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4;
        const inCard = y >= 15 && y < height - 20;
        data[i] = inCard ? 240 : 0;
        data[i + 1] = inCard ? 130 : 0;
        data[i + 2] = inCard ? 30 : 0;
        data[i + 3] = inCard ? 255 : 0; // transparent outside the card
      }
    }

    expect(findContentBounds(data, width, height)).toEqual({
      x: 0,
      y: 15,
      width,
      height: height - 20 - 15,
    });
  });

  it('falls back to the full rect for an entirely blank image', () => {
    const width = 25;
    const height = 25;
    const data = raster(width, height, () => WHITE);

    expect(findContentBounds(data, width, height)).toEqual({ x: 0, y: 0, width, height });
  });
});
