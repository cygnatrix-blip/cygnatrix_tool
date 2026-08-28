/**
 * Client-side file gate. This is UX/safety, not a security boundary — nothing is
 * uploaded, so the risk is only to the user's own browser. We still check the
 * magic bytes so a mislabelled or corrupt file fails fast with a clear message.
 */
export type FileKind = 'pdf' | 'jpeg' | 'png' | 'webp';

const SIGNATURES: Record<FileKind, (bytes: Uint8Array) => boolean> = {
  pdf: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46, // %PDF
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a,
  webp: (b) =>
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50,
};

export async function sniffKind(file: Blob): Promise<FileKind | null> {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  for (const kind of Object.keys(SIGNATURES) as FileKind[]) {
    if (SIGNATURES[kind](header)) return kind;
  }
  return null;
}

export interface ValidateOptions {
  accept: FileKind[];
  maxSizeMB: number;
}

export interface ValidationOutcome {
  ok: boolean;
  kind?: FileKind;
  error?: string;
}

export async function validateFile(file: File, opts: ValidateOptions): Promise<ValidationOutcome> {
  if (file.size === 0) return { ok: false, error: 'This file is empty.' };
  const maxBytes = opts.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, error: `“${file.name}” is larger than the ${opts.maxSizeMB} MB limit.` };
  }
  const kind = await sniffKind(file);
  if (!kind || !opts.accept.includes(kind)) {
    const list = opts.accept.map((k) => k.toUpperCase()).join(', ');
    return { ok: false, error: `“${file.name}” is not a supported file. Expected: ${list}.` };
  }
  return { ok: true, kind };
}

export function mimeFor(kind: FileKind): string {
  return { pdf: 'application/pdf', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[kind];
}
