import { describe, expect, it } from 'vitest';
import { md5 } from '@/lib/pdf/crypto/md5';
import { rc4 } from '@/lib/pdf/crypto/rc4';

function hex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const enc = new TextEncoder();

describe('md5', () => {
  // RFC 1321 test vectors.
  it.each([
    ['', 'd41d8cd98f00b204e9800998ecf8427e'],
    ['a', '0cc175b9c0f1b6a831c399e269772661'],
    ['abc', '900150983cd24fb0d6963f7d28e17f72'],
    ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
    ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
    [
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      'd174ab98d277d9f5a5611c2c9f419d9f',
    ],
  ])('matches the known digest for %j', (input, expected) => {
    expect(hex(md5(enc.encode(input)))).toBe(expected);
  });

  it('handles input long enough to span multiple 64-byte blocks', () => {
    const long = 'a'.repeat(1000);
    // Cross-checked against a reference MD5 implementation.
    expect(hex(md5(enc.encode(long)))).toBe('cabe45dcc9ae5b66ba86600cca6b8ba8');
  });
});

describe('rc4', () => {
  it('matches the standard "Key"/"Plaintext" test vector', () => {
    const out = rc4(enc.encode('Key'), enc.encode('Plaintext'));
    expect(hex(out)).toBe('bbf316e8d940af0ad3');
  });

  it('is symmetric — encrypting the ciphertext with the same key recovers the plaintext', () => {
    const key = enc.encode('a-test-key');
    const plaintext = enc.encode('The quick brown fox jumps over the lazy dog.');
    const ciphertext = rc4(key, plaintext);
    const roundTrip = rc4(key, ciphertext);
    expect(new TextDecoder().decode(roundTrip)).toBe('The quick brown fox jumps over the lazy dog.');
  });
});
