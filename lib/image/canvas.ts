'use client';

export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export interface DecodedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

export async function decodeImage(file: Blob): Promise<DecodedImage> {
  try {
    const bitmap = await createImageBitmap(file);
    return { bitmap, width: bitmap.width, height: bitmap.height };
  } catch {
    // Fallback via <img> for browsers/formats that reject createImageBitmap.
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('This image could not be read.'));
        el.src = url;
      });
      const bitmap = await createImageBitmap(img);
      return { bitmap, width: bitmap.width, height: bitmap.height };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export interface DrawOptions {
  width: number;
  height: number;
  mime: ImageMime;
  quality?: number;
  /** Background fill for formats without alpha (JPEG). Default white. */
  background?: string;
}

export async function drawToBlob(bitmap: ImageBitmap, opts: DrawOptions): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(opts.width));
  canvas.height = Math.max(1, Math.round(opts.height));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create a drawing canvas.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (opts.mime === 'image/jpeg') {
    ctx.fillStyle = opts.background ?? '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, opts.mime, opts.quality),
  );
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new Error('The image could not be encoded in this format.');
  return blob;
}

export function extensionFor(mime: ImageMime): string {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime];
}

export function swapExtension(name: string, ext: string): string {
  return name.replace(/\.[^.]+$/, '') + '.' + ext;
}
