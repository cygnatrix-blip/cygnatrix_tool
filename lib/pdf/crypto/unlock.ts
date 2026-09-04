'use client';

import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFNumber } from 'pdf-lib';
import { aesCbcDecryptPdfBlob } from './aes';
import { rc4 } from './rc4';
import { authenticate, objectKey, type SecurityParams } from './standard-handler';
import { transformObjectGraph } from './traverse';

export class UnsupportedEncryptionError extends Error {}
export class WrongPasswordError extends Error {}

function readSecurityParams(doc: PDFDocument): SecurityParams {
  const context = doc.context;
  const encryptRef = context.trailerInfo.Encrypt;
  if (!encryptRef) throw new Error('This PDF is not password-protected.');
  const encrypt = context.lookup(encryptRef, PDFDict);

  const v = context.lookupMaybe(encrypt.get(PDFName.of('V')), PDFNumber)?.asNumber() ?? 0;
  const r = context.lookupMaybe(encrypt.get(PDFName.of('R')), PDFNumber)?.asNumber() ?? 2;
  if (v >= 5 || r >= 5) {
    throw new UnsupportedEncryptionError(
      'This PDF uses AES-256 (PDF 2.0) encryption, which this tool does not support yet. Try a desktop PDF reader to remove the password.',
    );
  }

  const oObj = context.lookupMaybe(encrypt.get(PDFName.of('O')), PDFHexString);
  const uObj = context.lookupMaybe(encrypt.get(PDFName.of('U')), PDFHexString);
  if (!oObj || !uObj) {
    throw new UnsupportedEncryptionError('This PDF’s encryption details could not be read.');
  }
  const o = oObj.asBytes();
  const u = uObj.asBytes();
  const p = context.lookupMaybe(encrypt.get(PDFName.of('P')), PDFNumber)?.asNumber() ?? 0;
  const lengthBits = context.lookupMaybe(encrypt.get(PDFName.of('Length')), PDFNumber)?.asNumber() ?? 40;
  const keyLengthBytes = Math.round(lengthBits / 8);

  const encryptMetadataObj = encrypt.get(PDFName.of('EncryptMetadata'));
  const encryptMetadata = encryptMetadataObj ? String(encryptMetadataObj) !== 'false' : true;

  const idArray = context.trailerInfo.ID;
  let idFirst: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  if (idArray instanceof PDFArray && idArray.size() > 0) {
    const first = context.lookup(idArray.get(0));
    if (first instanceof PDFHexString) idFirst = first.asBytes();
  }

  let isAes = false;
  if (v === 4) {
    const cf = context.lookupMaybe(encrypt.get(PDFName.of('CF')), PDFDict);
    const stmF = encrypt.get(PDFName.of('StmF'));
    if (cf && stmF) {
      const filterName = stmF instanceof PDFName ? stmF.asString() : 'StdCF';
      const filterDict = context.lookupMaybe(cf.get(PDFName.of(filterName)), PDFDict);
      const cfm = filterDict?.get(PDFName.of('CFM'));
      isAes = cfm instanceof PDFName && cfm.asString() === 'AESV2';
    }
  }

  return { v, r, keyLengthBytes: keyLengthBytes || 16, o, u, p, idFirst, encryptMetadata, isAes };
}

/**
 * Remove a *known* password. This authenticates against the document's own
 * /O and /U checksums — it cannot recover or brute-force an unknown password,
 * by design (that is a different, much less honest product to build).
 */
export async function unlockPdf(data: ArrayBuffer, password: string): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  if (!doc.isEncrypted) throw new Error('This PDF is not password-protected.');

  const params = readSecurityParams(doc);
  const auth = authenticate(password, params);
  if (!auth.ok || !auth.encryptionKey) {
    throw new WrongPasswordError('That password is incorrect.');
  }
  const encryptionKey = auth.encryptionKey;

  await transformObjectGraph(
    doc.context,
    (objNum, gen) => objectKey(encryptionKey, objNum, gen, params.isAes),
    async (key, bytes) =>
      params.isAes ? aesCbcDecryptPdfBlob(key, bytes) : rc4(key, bytes),
  );

  delete doc.context.trailerInfo.Encrypt;
  return doc.save({ useObjectStreams: false });
}
