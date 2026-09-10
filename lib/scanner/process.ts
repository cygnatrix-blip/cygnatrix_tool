'use client';

import { decodeImage } from '@/lib/image/canvas';
import { orderQuad, outputSize, type Quad } from './geometry';
import { warpQuad } from './warp';
import { enhance, type EnhanceMode } from './enhance';

export interface ProcessInput {
  /** The captured frame, as a JPEG/PNG blob. */
  source: Blob;
  /** Detected/adjusted corners in source-image pixels. */
  quad: Quad;
  /** Clockwise rotation applied after de-warp: 0 | 90 | 180 | 270. */
  rotate: number;
  mode: EnhanceMode;
}

export interface ProcessedPage {
  blob: Blob;
  width: number;
  height: number;
}

/** decode → de-warp → enhance → rotate → encode. One page, on demand. */
export async function processPage(input: ProcessInput): Promise<ProcessedPage> {
  const decoded = await decodeImage(input.source);
  const quad = orderQuad(input.quad);
  const size = outputSize(quad);

  let canvas = warpQuad(
    { image: decoded.bitmap, width: decoded.width, height: decoded.height },
    quad,
    size.width,
    size.height,
  );
  decoded.bitmap.close();

  canvas = enhance(canvas, input.mode);
  canvas = rotateCanvas(canvas, input.rotate);

  const isBw = input.mode === 'bw';
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, isBw ? 'image/png' : 'image/jpeg', isBw ? undefined : 0.9),
  );
  if (!blob) throw new Error('The scanned page could not be encoded.');
  return { blob, width: canvas.width, height: canvas.height };
}

export function rotateCanvas(source: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  const deg = ((degrees % 360) + 360) % 360;
  if (deg === 0) return source;
  const canvas = document.createElement('canvas');
  const swap = deg === 90 || deg === 270;
  canvas.width = swap ? source.height : source.width;
  canvas.height = swap ? source.width : source.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create a drawing canvas.');
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return canvas;
}
