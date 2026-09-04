import {
  PDFArray,
  PDFDict,
  PDFHexString,
  PDFName,
  PDFRawStream,
  PDFRef,
  PDFString,
  type PDFContext,
  type PDFObject,
} from 'pdf-lib';

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) hex += (bytes[i] as number).toString(16).padStart(2, '0');
  return hex;
}

export type Transform = (bytes: Uint8Array) => Uint8Array | Promise<Uint8Array>;

/**
 * Walk every string/stream reachable from one indirect object's own sub-tree
 * (never crossing into other indirect objects — those are handled by the outer
 * loop over `context.enumerateIndirectObjects()`), applying `transform` in place.
 * Async because the AES cipher path goes through Web Crypto (Promise-based).
 */
async function walk(node: PDFObject, transform: Transform): Promise<void> {
  if (node instanceof PDFRef) return; // a pointer to another top-level object — skip
  if (node instanceof PDFDict) {
    if (node.get(PDFName.of('Type')) === PDFName.of('XRef')) return; // never touch xref streams
    for (const key of node.keys()) {
      const value = node.get(key);
      if (!value) continue;
      if (value instanceof PDFString || value instanceof PDFHexString) {
        const encrypted = await transform(value.asBytes());
        node.set(key, PDFHexString.of(bytesToHex(encrypted)));
      } else {
        await walk(value, transform);
      }
    }
    return;
  }
  if (node instanceof PDFArray) {
    for (let i = 0; i < node.size(); i += 1) {
      const value = node.get(i);
      if (!value) continue;
      if (value instanceof PDFString || value instanceof PDFHexString) {
        const encrypted = await transform(value.asBytes());
        node.set(i, PDFHexString.of(bytesToHex(encrypted)));
      } else {
        await walk(value, transform);
      }
    }
    return;
  }
  if (node instanceof PDFRawStream) {
    await walk(node.dict, transform);
    // pdf-lib's own .d.ts marks `contents` readonly for external API safety, but
    // it is a plain mutable field at runtime (see PDFRawStream's JS source) —
    // this is exactly how pdf-lib itself replaces stream bytes internally.
    (node as { contents: Uint8Array }).contents = await transform(node.contents);
  }
}

/**
 * Apply `cipher` (encrypt or decrypt) to every string and stream in the
 * document, using a per-object key derived from each object's own number and
 * generation. `keyFor` returns that per-object key.
 */
export async function transformObjectGraph(
  context: PDFContext,
  keyFor: (objectNumber: number, generationNumber: number) => Uint8Array,
  cipher: (key: Uint8Array, bytes: Uint8Array) => Uint8Array | Promise<Uint8Array>,
): Promise<void> {
  const entries = context.enumerateIndirectObjects();
  for (const [ref, obj] of entries) {
    const key = keyFor(ref.objectNumber, ref.generationNumber);
    await walk(obj, (bytes) => cipher(key, bytes));
  }
}
