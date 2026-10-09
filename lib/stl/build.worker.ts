/// <reference lib="webworker" />

/**
 * Builds the mesh and encodes the chosen format off the main thread. A
 * full-detail grid runs into millions of triangles, which would lock the UI
 * for seconds on a phone. Bundled to `public/workers/stl-build.js` by
 * `scripts/build-worker.mjs` (predev / prebuild).
 */

import { zipSync } from 'fflate';
import { buildHeightField, stitchFields } from './field';
import { buildMesh, meshBounds, resolveHeightMM, signedVolumeMM3 } from './mesh';
import { buildThreeMfEntries, encodeObj, weldMesh } from './indexed';
import { buildFlatNormals, encodeAsciiStl, encodeBinaryStl } from './stl';
import { renderBacklit, tonalRange, type BacklitOptions } from './backlit';
import type { ExportFormat, StlOptions } from './types';

interface SourceImage {
  rgba: ArrayBuffer;
  width: number;
  height: number;
}

interface Req {
  id: number;
  images: SourceImage[];
  opts: StlOptions;
  format: ExportFormat;
  backlit: BacklitOptions;
  /**
   * The preview is rebuilt at a coarser grid than the export. At full detail
   * its vertex buffer alone can run to tens of megabytes, for a difference no
   * one can see in a thumbnail-sized viewport.
   */
  previewMaxSamples: number;
}

const MIME: Record<ExportFormat, string> = {
  'stl-binary': 'model/stl',
  'stl-ascii': 'model/stl',
  '3mf': 'model/3mf',
  obj: 'model/obj',
};

const EXT: Record<ExportFormat, string> = {
  'stl-binary': 'stl',
  'stl-ascii': 'stl',
  '3mf': '3mf',
  obj: 'obj',
};

self.onmessage = (e: MessageEvent<Req>) => {
  const { id, images, opts, format, backlit, previewMaxSamples } = e.data;
  try {
    const fieldFor = (maxSamples: number) =>
      stitchFields(
        images.map((img) =>
          buildHeightField(new Uint8ClampedArray(img.rgba), img.width, img.height, { ...opts, maxSamples }),
        ),
        opts,
      );

    const field = fieldFor(opts.maxSamples);
    const mesh = buildMesh(field, opts);

    let bytes: ArrayBuffer;
    let vertexCount = mesh.triangleCount * 3;
    if (format === 'stl-binary') {
      bytes = encodeBinaryStl(mesh);
    } else if (format === 'stl-ascii') {
      bytes = new TextEncoder().encode(encodeAsciiStl(mesh)).buffer as ArrayBuffer;
    } else if (format === 'obj') {
      const welded = weldMesh(mesh);
      vertexCount = welded.vertexCount;
      bytes = new TextEncoder().encode(encodeObj(welded)).buffer as ArrayBuffer;
    } else {
      const welded = weldMesh(mesh);
      vertexCount = welded.vertexCount;
      // 3MF is a zip container; fflate is already a dependency here.
      const zipped = zipSync(buildThreeMfEntries(welded), { level: 6 });
      bytes = zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength) as ArrayBuffer;
    }

    const bounds = meshBounds(mesh);
    const volumeMM3 = signedVolumeMM3(mesh);

    const previewField = fieldFor(Math.min(opts.maxSamples, previewMaxSamples));
    const previewMesh = buildMesh(previewField, opts);
    const normals = buildFlatNormals(previewMesh);
    const lit = renderBacklit(previewField, opts, backlit);
    const range = tonalRange(previewField, opts, backlit);

    const payload = {
      id,
      ok: true as const,
      bytes,
      mime: MIME[format],
      extension: EXT[format],
      triangleCount: mesh.triangleCount,
      vertexCount,
      bounds,
      volumeMM3,
      widthMM: opts.widthMM,
      heightMM: resolveHeightMM(field, opts),
      gridWidth: field.width,
      gridHeight: field.height,
      tonalRange: range,
      preview: {
        positions: previewMesh.positions,
        normals,
        triangleCount: previewMesh.triangleCount,
        lit: lit.buffer,
        litWidth: previewField.width,
        litHeight: previewField.height,
      },
    };

    (self as unknown as Worker).postMessage(payload, [
      bytes,
      previewMesh.positions.buffer,
      normals.buffer,
      lit.buffer,
    ]);
  } catch (err) {
    (self as unknown as Worker).postMessage({
      id,
      ok: false as const,
      error: err instanceof Error ? err.message : 'The model could not be built.',
    });
  }
};
