'use client';

/**
 * HEIC/HEIF → JPG. `heic2any` (~1.3 MB) is loaded on demand — only when this
 * function actually runs, so it never touches any other page's bundle. See
 * ARCHITECTURE.md for the size note: it's the smallest well-maintained,
 * browser-only HEIC decoder available (HEIC decoding intrinsically needs a
 * bundled HEVC-still codec; there is no small option).
 */
export interface HeicConvertOptions {
  quality: number; // 0..1
  /** Best-effort: read EXIF straight from the HEIC container and re-attach it. */
  preserveExif: boolean;
}

export interface HeicConvertResult {
  name: string;
  blob: Blob;
  originalSize: number;
  newSize: number;
}

function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'
  );
}

export async function heicToJpg(file: File, opts: HeicConvertOptions): Promise<HeicConvertResult> {
  if (!isHeicFile(file)) {
    throw new Error(`"${file.name}" does not look like a HEIC/HEIF file.`);
  }

  const { default: heic2any } = await import('heic2any');
  let result: Blob | Blob[];
  try {
    result = await heic2any({ blob: file, toType: 'image/jpeg', quality: opts.quality });
  } catch {
    throw new Error(`"${file.name}" could not be converted. It may be corrupt or an unsupported HEIC variant.`);
  }
  let blob = Array.isArray(result) ? result[0]! : result;

  if (opts.preserveExif) {
    try {
      const { extractHeicExif, injectExifIntoJpeg } = await import('./heic-exif');
      const sourceBytes = new Uint8Array(await file.arrayBuffer());
      const exif = extractHeicExif(sourceBytes);
      if (exif) {
        const jpegBytes = new Uint8Array(await blob.arrayBuffer());
        blob = new Blob([injectExifIntoJpeg(jpegBytes, exif) as BlobPart], { type: 'image/jpeg' });
      }
    } catch {
      // Best-effort only — the converted photo is still valid without EXIF.
    }
  }

  return {
    name: file.name.replace(/\.(heic|heif)$/i, '.jpg'),
    blob,
    originalSize: file.size,
    newSize: blob.size,
  };
}
