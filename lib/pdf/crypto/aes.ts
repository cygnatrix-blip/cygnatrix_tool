/**
 * AES-128-CBC decrypt for the "AESV2" crypt filter (PDF V4/R4), via the Web
 * Crypto API — available identically in browsers and in Node ≥19 (used by tests),
 * so no extra dependency and no hand-rolled AES.
 */

function subtle(): SubtleCrypto {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c?.subtle) throw new Error('Web Crypto is not available in this environment.');
  return c.subtle;
}

/** PDF AES streams/strings are laid out as: 16-byte IV followed by PKCS#7-padded ciphertext. */
export async function aesCbcDecryptPdfBlob(key: Uint8Array, blob: Uint8Array): Promise<Uint8Array> {
  if (blob.length <= 16) return new Uint8Array(0);
  const iv = blob.slice(0, 16);
  const ciphertext = blob.slice(16);
  const cryptoKey = await subtle().importKey('raw', key as BufferSource, { name: 'AES-CBC' }, false, [
    'decrypt',
  ]);
  const plain = await subtle().decrypt({ name: 'AES-CBC', iv: iv as BufferSource }, cryptoKey, ciphertext as BufferSource);
  return new Uint8Array(plain);
}
