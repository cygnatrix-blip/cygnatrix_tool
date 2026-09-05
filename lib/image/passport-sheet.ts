'use client';

export interface TileLayoutInput {
  sheetWidth: number;
  sheetHeight: number;
  photoWidth: number;
  photoHeight: number;
  marginPx: number;
  gapPx: number;
}

export interface TilePosition {
  x: number;
  y: number;
}

export interface TileLayout {
  cols: number;
  rows: number;
  count: number;
  positions: TilePosition[];
}

/**
 * Pure layout math for tiling copies of one passport photo onto a print
 * sheet: as many copies as fit within the margins, centred as a group, with
 * a fixed gap between cells for a cut guide to run through. No canvas — this
 * is unit-testable on its own.
 */
export function computeTileLayout(input: TileLayoutInput): TileLayout {
  const { sheetWidth, sheetHeight, photoWidth, photoHeight, marginPx, gapPx } = input;
  const availW = sheetWidth - marginPx * 2;
  const availH = sheetHeight - marginPx * 2;

  if (photoWidth <= 0 || photoHeight <= 0 || availW < photoWidth || availH < photoHeight) {
    return { cols: 0, rows: 0, count: 0, positions: [] };
  }

  const cols = Math.floor((availW + gapPx) / (photoWidth + gapPx));
  const rows = Math.floor((availH + gapPx) / (photoHeight + gapPx));
  const gridW = cols * photoWidth + (cols - 1) * gapPx;
  const gridH = rows * photoHeight + (rows - 1) * gapPx;
  const offsetX = marginPx + (availW - gridW) / 2;
  const offsetY = marginPx + (availH - gridH) / 2;

  const positions: TilePosition[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      positions.push({
        x: offsetX + c * (photoWidth + gapPx),
        y: offsetY + r * (photoHeight + gapPx),
      });
    }
  }

  return { cols, rows, count: positions.length, positions };
}

export interface RenderSheetOptions {
  sheetWidth: number;
  sheetHeight: number;
  photoWidth: number;
  photoHeight: number;
  layout: TileLayout;
  /** Draw a dashed cut line around each tile. Default true. */
  cutGuides?: boolean;
}

/** Draw the tiled sheet — one photo repeated per `layout.positions` — with optional cut guides. */
export function renderPassportSheet(
  photo: CanvasImageSource,
  opts: RenderSheetOptions,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = opts.sheetWidth;
  canvas.height = opts.sheetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create a drawing canvas.');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, opts.sheetWidth, opts.sheetHeight);

  for (const pos of opts.layout.positions) {
    ctx.drawImage(photo, pos.x, pos.y, opts.photoWidth, opts.photoHeight);
  }

  if (opts.cutGuides !== false) {
    ctx.save();
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    for (const pos of opts.layout.positions) {
      ctx.strokeRect(pos.x + 0.5, pos.y + 0.5, opts.photoWidth - 1, opts.photoHeight - 1);
    }
    ctx.restore();
  }

  return canvas;
}
