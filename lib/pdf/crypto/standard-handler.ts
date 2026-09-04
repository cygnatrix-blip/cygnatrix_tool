/**
 * PDF Standard Security Handler (ISO 32000-1, §7.6.3). Implements exactly the
 * revisions needed by our Protect/Unlock tools:
 *   - Protect always writes  V2 / R3, RC4, 128-bit key  — the most broadly
 *     compatible "real" encryption every reader (desktop, mobile, browser) opens.
 *   - Unlock additionally reads V2/R2 (40-bit RC4) and V4/R4 (AES-128, "AESV2")
 *     PDFs, since other tools (Word, Adobe) commonly produce those.
 *   - AES-256 (V5/R6, PDF 2.0) is deliberately NOT supported — detected and
 *     reported as a clear "not supported" error rather than silently mishandled.
 *
 * This is a fixed, publicly documented algorithm (unchanged since ~2001), not
 * "invented" cryptography — the risk here is transcription error, not design.
 * It is cross-checked in tests by round-tripping through pdf.js's independent
 * decryption implementation.
 */
import { md5 } from './md5';
import { rc4 } from './rc4';

export const PAD_BYTES = new Uint8Array([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41, 0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
  0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80, 0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

export interface SecurityParams {
  v: number; // /V
  r: number; // /R
  keyLengthBytes: number; // /Length in bits ÷ 8 (default 5 for R2)
  o: Uint8Array; // /O
  u: Uint8Array; // /U
  p: number; // /P (signed 32-bit)
  idFirst: Uint8Array; // first element of trailer /ID
  encryptMetadata: boolean; // /EncryptMetadata, default true
  isAes: boolean; // true when /CF specifies AESV2 (V4, R4)
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

/** Pad or truncate a password to exactly 32 bytes per the spec's Algorithm 2 step (a). */
export function padPassword(password: string): Uint8Array {
  const bytes = new TextEncoder().encode(password).slice(0, 32);
  return concatBytes(bytes, PAD_BYTES).slice(0, 32);
}

function int32LEBytes(n: number): Uint8Array {
  const buf = new Uint8Array(4);
  new DataView(buf.buffer).setInt32(0, n, true);
  return buf;
}

function xorByte(key: Uint8Array, byte: number): Uint8Array {
  const out = new Uint8Array(key.length);
  for (let i = 0; i < key.length; i += 1) out[i] = (key[i] as number) ^ byte;
  return out;
}

/** Algorithm 2 — compute the file encryption key from a (candidate) user password. */
export function computeEncryptionKey(
  userPassword: string,
  o: Uint8Array,
  p: number,
  idFirst: Uint8Array,
  keyLengthBytes: number,
  r: number,
  encryptMetadata: boolean,
): Uint8Array {
  const parts = [padPassword(userPassword), o, int32LEBytes(p), idFirst];
  if (r >= 4 && !encryptMetadata) parts.push(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
  let digest = md5(concatBytes(...parts));
  if (r >= 3) {
    for (let i = 0; i < 50; i += 1) digest = md5(digest.slice(0, keyLengthBytes));
  }
  return digest.slice(0, keyLengthBytes);
}

/** Algorithm 3 — compute /O from the owner and user passwords. */
export function computeO(
  ownerPassword: string,
  userPassword: string,
  keyLengthBytes: number,
  r: number,
): Uint8Array {
  let digest = md5(padPassword(ownerPassword || userPassword));
  if (r >= 3) {
    for (let i = 0; i < 50; i += 1) digest = md5(digest);
  }
  const rc4Key = digest.slice(0, keyLengthBytes);

  let result = padPassword(userPassword);
  if (r === 2) {
    result = rc4(rc4Key, result);
  } else {
    for (let i = 0; i < 20; i += 1) result = rc4(xorByte(rc4Key, i), result);
  }
  return result;
}

/** Algorithm 4/5 — compute /U from the file encryption key. */
export function computeU(encryptionKey: Uint8Array, idFirst: Uint8Array, r: number): Uint8Array {
  if (r === 2) {
    return rc4(encryptionKey, PAD_BYTES);
  }
  let result = md5(concatBytes(PAD_BYTES, idFirst));
  result = rc4(encryptionKey, result);
  for (let i = 1; i <= 19; i += 1) result = rc4(xorByte(encryptionKey, i), result);
  // Bytes 16-31 are "arbitrary padding" per spec — readers only check the first 16.
  return concatBytes(result, new Uint8Array(16));
}

/** Algorithm 7 — recover the user password bytes from a candidate owner password. */
function recoverUserPasswordBytes(
  candidateOwnerPassword: string,
  o: Uint8Array,
  keyLengthBytes: number,
  r: number,
): Uint8Array {
  let digest = md5(padPassword(candidateOwnerPassword));
  if (r >= 3) {
    for (let i = 0; i < 50; i += 1) digest = md5(digest);
  }
  const rc4Key = digest.slice(0, keyLengthBytes);

  if (r === 2) return rc4(rc4Key, o);
  let result = o;
  for (let i = 19; i >= 0; i -= 1) result = rc4(xorByte(rc4Key, i), result);
  return result;
}

export interface AuthResult {
  ok: boolean;
  encryptionKey?: Uint8Array;
}

/**
 * Try `password` as either the user or the owner password (Algorithms 6 and 7).
 * Real-world "remove password" tools accept either, and we don't distinguish
 * open-permission levels — either password unlocks the document for our purposes.
 */
export function authenticate(password: string, params: SecurityParams): AuthResult {
  const tryAsUser = (candidate: string): Uint8Array | null => {
    const key = computeEncryptionKey(
      candidate,
      params.o,
      params.p,
      params.idFirst,
      params.keyLengthBytes,
      params.r,
      params.encryptMetadata,
    );
    const u = computeU(key, params.idFirst, params.r);
    const check = params.r === 2 ? 32 : 16;
    for (let i = 0; i < check; i += 1) {
      if (u[i] !== params.u[i]) return null;
    }
    return key;
  };

  const asUser = tryAsUser(password);
  if (asUser) return { ok: true, encryptionKey: asUser };

  // The owner-password path recovers the *padded* user-password bytes directly
  // (Algorithm 7) — feed them straight into Algorithm 2 without re-padding a string.
  const recovered = recoverUserPasswordBytes(password, params.o, params.keyLengthBytes, params.r);
  const recoveredKey = computeEncryptionKeyFromBytes(
    recovered,
    params.o,
    params.p,
    params.idFirst,
    params.keyLengthBytes,
    params.r,
    params.encryptMetadata,
  );
  const u2 = computeU(recoveredKey, params.idFirst, params.r);
  const check = params.r === 2 ? 32 : 16;
  for (let i = 0; i < check; i += 1) {
    if (u2[i] !== params.u[i]) return { ok: false };
  }
  return { ok: true, encryptionKey: recoveredKey };
}

/** Same as computeEncryptionKey but takes already-32-byte-padded password bytes. */
function computeEncryptionKeyFromBytes(
  paddedPassword: Uint8Array,
  o: Uint8Array,
  p: number,
  idFirst: Uint8Array,
  keyLengthBytes: number,
  r: number,
  encryptMetadata: boolean,
): Uint8Array {
  const parts = [paddedPassword.slice(0, 32), o, int32LEBytes(p), idFirst];
  if (r >= 4 && !encryptMetadata) parts.push(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
  let digest = md5(concatBytes(...parts));
  if (r >= 3) {
    for (let i = 0; i < 50; i += 1) digest = md5(digest.slice(0, keyLengthBytes));
  }
  return digest.slice(0, keyLengthBytes);
}

/** Algorithm 1 — derive the per-object key used to encrypt/decrypt one object's data. */
export function objectKey(
  encryptionKey: Uint8Array,
  objectNumber: number,
  generationNumber: number,
  isAes: boolean,
): Uint8Array {
  const objBytes = new Uint8Array([
    objectNumber & 0xff,
    (objectNumber >> 8) & 0xff,
    (objectNumber >> 16) & 0xff,
  ]);
  const genBytes = new Uint8Array([generationNumber & 0xff, (generationNumber >> 8) & 0xff]);
  const parts = [encryptionKey, objBytes, genBytes];
  if (isAes) parts.push(new Uint8Array([0x73, 0x41, 0x6c, 0x54])); // "sAlT"
  const digest = md5(concatBytes(...parts));
  const n = Math.min(16, encryptionKey.length + 5);
  return digest.slice(0, n);
}
