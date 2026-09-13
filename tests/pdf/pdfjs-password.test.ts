import { describe, expect, it } from 'vitest';
import { passwordExceptionKind } from '@/lib/pdf/pdfjs';

class FakePasswordException extends Error {
  code: number;
  constructor(code: number) {
    super('password needed');
    this.name = 'PasswordException';
    this.code = code;
  }
}

describe('passwordExceptionKind', () => {
  it('reports "required" for a fresh NEED_PASSWORD (code 1)', () => {
    expect(passwordExceptionKind(new FakePasswordException(1))).toBe('required');
  });

  it('reports "incorrect" for INCORRECT_PASSWORD (code 2)', () => {
    expect(passwordExceptionKind(new FakePasswordException(2))).toBe('incorrect');
  });

  it('returns null for any other error', () => {
    expect(passwordExceptionKind(new Error('boom'))).toBeNull();
    expect(passwordExceptionKind('not an error')).toBeNull();
    expect(passwordExceptionKind(null)).toBeNull();
  });
});
