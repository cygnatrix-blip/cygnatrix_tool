import { describe, expect, it } from 'vitest';
import { extractHeicExif, injectExifIntoJpeg } from '@/lib/image/heic-exif';

/**
 * Builds a minimal synthetic HEIF (ISOBMFF) container with exactly the boxes
 * our parser reads (meta > iinf > infe, meta > iloc, mdat) so the box-walking
 * and offset arithmetic can be verified without needing a real camera photo.
 * Layout mirrors what real encoders (libheif, iPhone) produce for version 0
 * iinf/infe and version 0 iloc with 4-byte offset/length fields.
 */
function buildSyntheticHeic(exifPayload: Uint8Array): Uint8Array {
  const itemId = 3;

  // infe: FullBox(version=2) + item_ID(2) + protection_index(2) + item_type(4)
  const infeBody = new Uint8Array(4 + 2 + 2 + 4);
  const infeView = new DataView(infeBody.buffer);
  infeBody[0] = 2; // version 2 -> item_ID is 2 bytes
  infeView.setUint16(4, itemId);
  infeView.setUint16(6, 0); // protection index
  infeBody.set(new TextEncoder().encode('Exif'), 8);
  const infe = box('infe', infeBody);

  const iinfBody = new Uint8Array(4 + 2);
  new DataView(iinfBody.buffer).setUint16(4, 1); // entry_count = 1
  const iinf = box('iinf', concat(iinfBody, infe));

  // We'll know mdat's start only after laying out ftyp+meta, so reserve the
  // EXIF item's byte range to start right at the beginning of mdat's payload,
  // prefixed by the 4-byte "TIFF offset" field the HEIF spec requires (0 here).
  const exifItemData = concat(new Uint8Array(4), exifPayload); // 4-byte offset(=0) + TIFF bytes

  // iloc: FullBox(version=0) + sizes byte + index_size byte + item_count(2)
  //   then: item_ID(2) + data_ref_index(2) + base_offset(4) + extent_count(2)
  //         + extent_offset(4) + extent_length(4)
  const ilocBody = new Uint8Array(4 + 1 + 1 + 2 + (2 + 2 + 4 + 2 + 4 + 4));
  const ilocView = new DataView(ilocBody.buffer);
  ilocBody[0] = 0; // version 0
  ilocBody[4] = 0x44; // offset_size=4 (high nibble), length_size=4 (low nibble)
  ilocBody[5] = 0x00; // base_offset_size / index_size = 0
  ilocView.setUint16(6, 1); // item_count = 1
  let o = 8;
  ilocView.setUint16(o, itemId);
  o += 2;
  o += 2; // data_reference_index (0)
  ilocView.setUint32(o, 0);
  o += 4; // base_offset
  ilocView.setUint16(o, 1);
  o += 2; // extent_count = 1
  // extent_offset is filled in below once we know mdat's absolute position.
  const extentOffsetPos = o;
  ilocView.setUint32(o, 0);
  o += 4;
  ilocView.setUint32(o, exifItemData.length);

  const iloc = box('iloc', ilocBody);
  const metaBody = concat(new Uint8Array(4), iinf, iloc); // FullBox header + children
  const meta = box('meta', metaBody);
  const ftyp = box('ftyp', new TextEncoder().encode('heic\0\0\0\0heic'));

  const head = concat(ftyp, meta);
  const mdatHeaderSize = 8;
  const mdatDataOffset = head.length + mdatHeaderSize;

  // Patch the extent_offset in place, at its real absolute position within
  // `head` (patching the standalone `iloc` array would be too late — its
  // bytes were already copied into `metaBody`/`meta`/`head` above).
  const ilocStartInHead = ftyp.length + 8 /* meta box header */ + 4 /* meta FullBox */ + iinf.length;
  const extentOffsetAbsolute = ilocStartInHead + 8 /* iloc box header */ + extentOffsetPos;
  new DataView(head.buffer).setUint32(extentOffsetAbsolute, mdatDataOffset);

  const mdat = box('mdat', exifItemData);
  return concat(head, mdat);
}

function box(type: string, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(8 + body.length);
  new DataView(out.buffer).setUint32(0, out.length);
  out.set(new TextEncoder().encode(type), 4);
  out.set(body, 8);
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

describe('extractHeicExif', () => {
  it('locates and extracts the Exif item from a synthetic HEIF container', () => {
    const fakeExif = new TextEncoder().encode('FAKE-TIFF-EXIF-PAYLOAD-0123456789');
    const heic = buildSyntheticHeic(fakeExif);
    const extracted = extractHeicExif(heic);
    expect(extracted).not.toBeNull();
    expect(new TextDecoder().decode(extracted!)).toBe('FAKE-TIFF-EXIF-PAYLOAD-0123456789');
  });

  it('returns null for a file with no meta box rather than throwing', () => {
    const notHeic = new Uint8Array(64);
    expect(extractHeicExif(notHeic)).toBeNull();
  });
});

describe('injectExifIntoJpeg', () => {
  it('inserts a valid APP1 Exif segment right after the SOI marker', () => {
    const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x01, 0xaa]);
    const exif = new TextEncoder().encode('TIFFDATA');
    const result = injectExifIntoJpeg(fakeJpeg, exif);

    expect(result[0]).toBe(0xff);
    expect(result[1]).toBe(0xd8);
    expect(result[2]).toBe(0xff);
    expect(result[3]).toBe(0xe1); // APP1 marker
    const declaredLength = (result[4]! << 8) | result[5]!;
    expect(declaredLength).toBe(2 + 6 + exif.length); // length field + "Exif\0\0" + payload
    const header = new TextDecoder().decode(result.slice(6, 12));
    expect(header).toBe('Exif\0\0');
    expect(new TextDecoder().decode(result.slice(12, 12 + exif.length))).toBe('TIFFDATA');
    // The rest of the original JPEG must follow untouched.
    expect(Array.from(result.slice(12 + exif.length))).toEqual([0xff, 0xdb, 0x00, 0x01, 0xaa]);
  });

  it('leaves non-JPEG input untouched', () => {
    const notJpeg = new Uint8Array([0x00, 0x01, 0x02]);
    expect(injectExifIntoJpeg(notJpeg, new Uint8Array([0xaa]))).toEqual(notJpeg);
  });
});
