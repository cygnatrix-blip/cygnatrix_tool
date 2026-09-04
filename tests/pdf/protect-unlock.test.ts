import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { protectPdf } from '@/lib/pdf/crypto/protect';
import { unlockPdf, WrongPasswordError } from '@/lib/pdf/crypto/unlock';

const MARKER_TEXT = 'Cygnatrix crypto round trip marker 8f3c1a';

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer;
}

async function makeTestPdf(): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([300, 300]);
  page.drawText(MARKER_TEXT, { x: 20, y: 250, size: 14, font });
  doc.setTitle('Crypto test document');
  return toArrayBuffer(await doc.save());
}

/** Extract plain text via pdf.js — an independent implementation from pdf-lib. */
async function extractText(bytes: Uint8Array, password?: string): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({
    data: bytes,
    password,
    isEvalSupported: false,
    useWorkerFetch: false,
    disableFontFace: true,
  });
  const doc = await task.promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  const text = content.items.map((it) => ('str' in it ? it.str : '')).join('');
  await doc.destroy();
  return text;
}

describe('protectPdf + unlockPdf round trip', () => {
  it('produces a PDF that pdf.js (an independent reader) can open with the password and read', async () => {
    const original = await makeTestPdf();
    const protectedBytes = await protectPdf(original, { userPassword: 'sesame123' });

    // pdf-lib itself must see it as encrypted.
    const reopened = await PDFDocument.load(protectedBytes, { ignoreEncryption: true });
    expect(reopened.isEncrypted).toBe(true);

    // An independent, mature implementation (pdf.js) must be able to open it
    // with the password and read the original content back out. This is the
    // strongest available check that the encryption is spec-correct, not just
    // self-consistent with our own decrypt code.
    const text = await extractText(protectedBytes, 'sesame123');
    expect(text).toContain(MARKER_TEXT);
  });

  it('pdf.js refuses the wrong password on our protected output', async () => {
    const original = await makeTestPdf();
    const protectedBytes = await protectPdf(original, { userPassword: 'sesame123' });
    await expect(extractText(protectedBytes, 'wrong-password')).rejects.toThrow();
  });

  it('unlockPdf removes the password and pdf-lib can load the result with no password', async () => {
    const original = await makeTestPdf();
    const protectedBytes = await protectPdf(original, { userPassword: 'sesame123' });
    const unlocked = await unlockPdf(toArrayBuffer(protectedBytes), 'sesame123');

    const doc = await PDFDocument.load(unlocked); // throws if still encrypted
    expect(doc.isEncrypted).toBe(false);

    const text = await extractText(unlocked);
    expect(text).toContain(MARKER_TEXT);
  });

  it('unlockPdf accepts the owner password too', async () => {
    const original = await makeTestPdf();
    const protectedBytes = await protectPdf(original, {
      userPassword: 'user-pw',
      ownerPassword: 'owner-pw',
    });
    const unlocked = await unlockPdf(toArrayBuffer(protectedBytes), 'owner-pw');
    const doc = await PDFDocument.load(unlocked);
    expect(doc.isEncrypted).toBe(false);
  });

  it('unlockPdf rejects an incorrect password', async () => {
    const original = await makeTestPdf();
    const protectedBytes = await protectPdf(original, { userPassword: 'correct-horse' });
    await expect(unlockPdf(toArrayBuffer(protectedBytes), 'incorrect-battery')).rejects.toThrow(
      WrongPasswordError,
    );
  });

  it('protectPdf refuses to double-encrypt an already-protected PDF', async () => {
    const original = await makeTestPdf();
    const protectedBytes = await protectPdf(original, { userPassword: 'first-pass' });
    await expect(
      protectPdf(toArrayBuffer(protectedBytes), { userPassword: 'second-pass' }),
    ).rejects.toThrow();
  });

  it('unlockPdf refuses a PDF that is not protected', async () => {
    const original = await makeTestPdf();
    await expect(unlockPdf(original, 'anything')).rejects.toThrow();
  });

  it('protectPdf requires a non-empty password', async () => {
    const original = await makeTestPdf();
    await expect(protectPdf(original, { userPassword: '' })).rejects.toThrow();
  });
});
