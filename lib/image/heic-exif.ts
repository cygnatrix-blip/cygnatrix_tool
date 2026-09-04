/**
 * Best-effort EXIF passthrough for HEIC → JPG.
 *
 * heic2any decodes HEIC to raw pixels and re-encodes as JPEG, which drops all
 * metadata. To offer a genuine "preserve EXIF" choice, we read the EXIF item
 * that HEIC/HEIF (ISOBMFF) containers store directly — no extra dependency,
 * just two small, well-documented binary formats:
 *   1. Locate the 'Exif' item in the HEIC's 'meta'/'iinf'/'iloc' boxes and read
 *      its raw bytes from 'mdat' (per ISO/IEC 23008-12).
 *   2. Splice those bytes into the output JPEG as a standard APP1 "Exif\0\0"
 *      marker segment, right after the SOI marker.
 * If anything about the container doesn't match what we expect, we fail
 * silently — the photo still converts, it just won't carry EXIF. This is a
 * best-effort feature, never a reason to break the conversion.
 */

function readBoxes(view: DataView, start: number, end: number): { type: string; start: number; end: number; headerSize: number }[] {
  const boxes: { type: string; start: number; end: number; headerSize: number }[] = [];
  let offset = start;
  while (offset + 8 <= end) {
    const size32 = view.getUint32(offset);
    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7),
    );
    let headerSize = 8;
    let size = size32;
    if (size32 === 1) {
      // 64-bit extended size.
      const hi = view.getUint32(offset + 8);
      const lo = view.getUint32(offset + 12);
      size = hi * 2 ** 32 + lo;
      headerSize = 16;
    } else if (size32 === 0) {
      size = end - offset; // extends to end of parent
    }
    if (size < headerSize || offset + size > end) break;
    boxes.push({ type, start: offset, end: offset + size, headerSize });
    offset += size;
  }
  return boxes;
}

function findBox(boxes: { type: string; start: number; end: number; headerSize: number }[], type: string) {
  return boxes.find((b) => b.type === type);
}

/** Extract the raw EXIF/TIFF payload from a HEIC file's container, if present. */
export function extractHeicExif(heicBytes: Uint8Array): Uint8Array | null {
  try {
    const view = new DataView(heicBytes.buffer, heicBytes.byteOffset, heicBytes.byteLength);
    const top = readBoxes(view, 0, heicBytes.length);
    const meta = findBox(top, 'meta');
    if (!meta) return null;
    // 'meta' is a FullBox: 4 bytes version/flags before its children.
    const metaChildren = readBoxes(view, meta.start + meta.headerSize + 4, meta.end);
    const iinf = findBox(metaChildren, 'iinf');
    const iloc = findBox(metaChildren, 'iloc');
    if (!iinf || !iloc) return null;

    // --- iinf: find the item_ID whose item_type is 'Exif' ---
    let p = iinf.start + iinf.headerSize;
    const iinfVersion = view.getUint8(p);
    p += 4; // version + flags
    const entryCount = iinfVersion === 0 ? view.getUint16(p) : view.getUint32(p);
    p += iinfVersion === 0 ? 2 : 4;
    let exifItemId: number | null = null;
    for (let i = 0; i < entryCount && p < iinf.end; i += 1) {
      const infe = readBoxes(view, p, iinf.end)[0];
      if (!infe || infe.type !== 'infe') break;
      const version = view.getUint8(infe.start + infe.headerSize);
      let q = infe.start + infe.headerSize + 4; // version+flags
      const itemId = version >= 3 ? view.getUint32(q) : view.getUint16(q);
      q += version >= 3 ? 4 : 2;
      q += 2; // item_protection_index
      const itemType = String.fromCharCode(view.getUint8(q), view.getUint8(q + 1), view.getUint8(q + 2), view.getUint8(q + 3));
      if (itemType === 'Exif') exifItemId = itemId;
      p = infe.end;
    }
    if (exifItemId === null) return null;

    // --- iloc: find that item's (offset, length) into the file ---
    let lp = iloc.start + iloc.headerSize;
    const ilocVersion = view.getUint8(lp);
    lp += 4;
    const sizes = view.getUint8(lp);
    const offsetSize = sizes >> 4;
    const lengthSize = sizes & 0x0f;
    lp += 1;
    const indexSize = ilocVersion === 1 || ilocVersion === 2 ? view.getUint8(lp) & 0x0f : 0;
    lp += 1;
    const itemCount = ilocVersion < 2 ? view.getUint16(lp) : view.getUint32(lp);
    lp += ilocVersion < 2 ? 2 : 4;

    const readUint = (size: number): number => {
      let v = 0;
      for (let i = 0; i < size; i += 1) v = v * 256 + view.getUint8(lp + i);
      lp += size;
      return v;
    };

    for (let i = 0; i < itemCount; i += 1) {
      const itemId = ilocVersion < 2 ? readUint(2) : readUint(4);
      if (ilocVersion === 1 || ilocVersion === 2) lp += 2; // construction_method
      lp += 2; // data_reference_index
      readUint(offsetSize || 8); // base_offset (consumed, unused for construction_method 0 base cases)
      const extentCount = view.getUint16(lp);
      lp += 2;
      let target: { offset: number; length: number } | null = null;
      for (let e = 0; e < extentCount; e += 1) {
        if (indexSize > 0) lp += indexSize;
        const extentOffset = readUint(offsetSize || 8);
        const extentLength = readUint(lengthSize || 8);
        if (itemId === exifItemId && !target) target = { offset: extentOffset, length: extentLength };
      }
      if (target) {
        // Per HEIF spec, Exif item data starts with a 4-byte big-endian offset
        // to the actual TIFF header (commonly 0 — no leading APP1-style prefix).
        const dv = new DataView(heicBytes.buffer, heicBytes.byteOffset + target.offset, Math.min(4, target.length));
        const tiffOffset = target.length >= 4 ? dv.getUint32(0) : 0;
        const start = target.offset + 4 + tiffOffset;
        const end = target.offset + target.length;
        if (start >= 0 && end <= heicBytes.length && end > start) {
          return heicBytes.slice(start, end);
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Insert a raw EXIF/TIFF blob into a JPEG as a standard APP1 segment. */
export function injectExifIntoJpeg(jpegBytes: Uint8Array, exif: Uint8Array): Uint8Array {
  if (jpegBytes.length < 2 || jpegBytes[0] !== 0xff || jpegBytes[1] !== 0xd8) return jpegBytes;
  const header = new TextEncoder().encode('Exif\0\0');
  const segmentLength = header.length + exif.length + 2; // +2 for the length field itself
  if (segmentLength > 0xffff) return jpegBytes; // absurdly large EXIF — skip rather than produce an invalid file

  const app1 = new Uint8Array(4 + header.length + exif.length);
  app1[0] = 0xff;
  app1[1] = 0xe1;
  app1[2] = (segmentLength >> 8) & 0xff;
  app1[3] = segmentLength & 0xff;
  app1.set(header, 4);
  app1.set(exif, 4 + header.length);

  const out = new Uint8Array(2 + app1.length + (jpegBytes.length - 2));
  out.set(jpegBytes.slice(0, 2), 0); // SOI
  out.set(app1, 2);
  out.set(jpegBytes.slice(2), 2 + app1.length);
  return out;
}
