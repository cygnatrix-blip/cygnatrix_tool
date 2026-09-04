'use client';

import { PDFDocument, PDFHexString } from 'pdf-lib';
import { rc4 } from './rc4';
import { computeEncryptionKey, computeO, computeU, objectKey } from './standard-handler';
import { transformObjectGraph } from './traverse';

export interface ProtectOptions {
  /** Required to open the file at all. */
  userPassword: string;
  /** Optional — defaults to the user password when not given. */
  ownerPassword?: string;
}

function randomIdHex(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

/**
 * Add an open password. Always writes 128-bit RC4 (V2/R3) — the classic PDF
 * encryption every reader (desktop, mobile, browser) can open, deliberately
 * chosen over AES here to keep the encryption path simple and maximally
 * compatible. See ARCHITECTURE.md for why AES is Unlock-only.
 */
export async function protectPdf(data: ArrayBuffer, opts: ProtectOptions): Promise<Uint8Array> {
  if (!opts.userPassword) throw new Error('Enter a password to protect this PDF with.');

  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  if (doc.isEncrypted) {
    throw new Error('This PDF is already password-protected. Unlock it first, then protect it again.');
  }

  const context = doc.context;
  const keyLengthBytes = 16; // 128-bit
  const r = 3;
  const p = -4; // conventional "no additional restrictions" permission value

  const idHex = randomIdHex();
  context.trailerInfo.ID = context.obj([PDFHexString.of(idHex), PDFHexString.of(idHex)]);
  const idFirst = PDFHexString.of(idHex).asBytes();

  const o = computeO(opts.ownerPassword ?? opts.userPassword, opts.userPassword, keyLengthBytes, r);
  const encryptionKey = computeEncryptionKey(opts.userPassword, o, p, idFirst, keyLengthBytes, r, true);
  const u = computeU(encryptionKey, idFirst, r);

  const toHex = (bytes: Uint8Array) => {
    let hex = '';
    for (const b of bytes) hex += b.toString(16).padStart(2, '0');
    return hex;
  };

  // Encrypt every string/stream BEFORE registering the Encrypt dict, so the
  // dict's own O/U values (and the trailer's ID) are never re-encrypted.
  await transformObjectGraph(
    context,
    (objNum, gen) => objectKey(encryptionKey, objNum, gen, false),
    (key, bytes) => rc4(key, bytes),
  );

  const encryptDict = context.obj({
    Filter: 'Standard',
    V: 2,
    R: r,
    O: PDFHexString.of(toHex(o)),
    U: PDFHexString.of(toHex(u)),
    P: p,
    Length: keyLengthBytes * 8,
  });
  const encryptRef = context.register(encryptDict);
  context.trailerInfo.Encrypt = encryptRef;

  return doc.save({ useObjectStreams: false });
}
