/** RC4 stream cipher. Symmetric — the same function encrypts and decrypts. */
export function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
  const S = new Uint8Array(256);
  for (let i = 0; i < 256; i += 1) S[i] = i;

  let j = 0;
  for (let i = 0; i < 256; i += 1) {
    j = (j + (S[i] as number) + (key[i % key.length] as number)) & 0xff;
    const tmp = S[i] as number;
    S[i] = S[j] as number;
    S[j] = tmp;
  }

  const out = new Uint8Array(data.length);
  let i = 0;
  j = 0;
  for (let n = 0; n < data.length; n += 1) {
    i = (i + 1) & 0xff;
    j = (j + (S[i] as number)) & 0xff;
    const tmp = S[i] as number;
    S[i] = S[j] as number;
    S[j] = tmp;
    const k = S[(((S[i] as number) + (S[j] as number)) & 0xff) as number] as number;
    out[n] = (data[n] as number) ^ k;
  }
  return out;
}
