/**
 * MD5 (RFC 1321). Required by the PDF Standard Security Handler's key-derivation
 * algorithm — PDF encryption is defined in terms of MD5 regardless of how weak MD5
 * is as a general-purpose hash today. Pure, dependency-free, byte-in/byte-out.
 */

function rotl(x: number, c: number): number {
  return (x << c) | (x >>> (32 - c));
}

const K = new Int32Array(64);
for (let i = 0; i < 64; i += 1) {
  K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32);
}
const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10,
  15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

export function md5(input: Uint8Array): Uint8Array {
  const msgLenBits = input.length * 8;
  const withOne = new Uint8Array(((input.length + 8) >> 6) * 64 + 64);
  withOne.set(input);
  withOne[input.length] = 0x80;
  const view = new DataView(withOne.buffer);
  view.setUint32(withOne.length - 8, msgLenBits >>> 0, true);
  view.setUint32(withOne.length - 4, Math.floor(msgLenBits / 2 ** 32) >>> 0, true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const M = new Int32Array(16);
  for (let chunk = 0; chunk < withOne.length; chunk += 64) {
    for (let i = 0; i < 16; i += 1) M[i] = view.getInt32(chunk + i * 4, true);

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i += 1) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const tmp = d;
      d = c;
      c = b;
      const sum = (a + f + (K[i] as number) + (M[g] as number)) | 0;
      b = (b + rotl(sum, S[i] as number)) | 0;
      a = tmp;
    }

    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setInt32(0, a0, true);
  outView.setInt32(4, b0, true);
  outView.setInt32(8, c0, true);
  outView.setInt32(12, d0, true);
  return out;
}
