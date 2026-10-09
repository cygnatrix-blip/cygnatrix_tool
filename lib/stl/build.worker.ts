/// <reference lib="webworker" />

/**
 * Builds the mesh and encodes the STL off the main thread. A full-detail grid
 * runs into millions of triangles, which would lock the UI for seconds on a
 * phone. Bundled to `public/workers/stl-build.js` by `scripts/build-worker.mjs`
 * (predev / prebuild).
 */

import { buildHeightField } from './field';
import { buildMesh, meshBounds, resolveHeightMM, signedVolumeMM3 } from './mesh';
import { buildFlatNormals, encodeAsciiStl, encodeBinaryStl } from './stl';
import type { StlOptions } from './types';

interface Req {
  id: number;
  rgba: ArrayBuffer;
  srcWidth: number;
  srcHeight: number;
  opts: StlOptions;
  ascii: boolean;
  /**
   * The preview is rebuilt at a coarser grid than the export. At full detail
   * its vertex buffer alone can run to tens of megabytes, for a difference no
   * one can see in a thumbnail-sized viewport.
   */
  previewMaxSamples: number;
}

self.onmessage = (e: MessageEvent<Req>) => {
  const { id, rgba, srcWidth, srcHeight, opts, ascii, previewMaxSamples } = e.data;
  try {
    const pixels = new Uint8ClampedArray(rgba);

    const field = buildHeightField(pixels, srcWidth, srcHeight, opts);
    const mesh = buildMesh(field, opts);
    const stl = ascii
      ? new TextEncoder().encode(encodeAsciiStl(mesh)).buffer
      : encodeBinaryStl(mesh);

    const bounds = meshBounds(mesh);
    const volumeMM3 = signedVolumeMM3(mesh);

    const previewField = buildHeightField(pixels, srcWidth, srcHeight, {
      ...opts,
      maxSamples: Math.min(opts.maxSamples, previewMaxSamples),
    });
    const previewMesh = buildMesh(previewField, opts);
    const normals = buildFlatNormals(previewMesh);

    const payload = {
      id,
      ok: true as const,
      stl,
      triangleCount: mesh.triangleCount,
      bounds,
      volumeMM3,
      widthMM: opts.widthMM,
      heightMM: resolveHeightMM(field, opts),
      gridWidth: field.width,
      gridHeight: field.height,
      preview: {
        positions: previewMesh.positions,
        normals,
        triangleCount: previewMesh.triangleCount,
      },
    };

    (self as unknown as Worker).postMessage(payload, [
      stl,
      previewMesh.positions.buffer,
      normals.buffer,
    ]);
  } catch (err) {
    (self as unknown as Worker).postMessage({
      id,
      ok: false as const,
      error: err instanceof Error ? err.message : 'The model could not be built.',
    });
  }
};
