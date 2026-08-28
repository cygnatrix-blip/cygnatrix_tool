import { describe, expect, it } from 'vitest';
import { extensionFor, swapExtension } from '@/lib/image/canvas';

describe('image canvas helpers', () => {
  it('maps mime types to extensions', () => {
    expect(extensionFor('image/jpeg')).toBe('jpg');
    expect(extensionFor('image/png')).toBe('png');
    expect(extensionFor('image/webp')).toBe('webp');
  });

  it('swaps a file extension', () => {
    expect(swapExtension('photo.jpeg', 'png')).toBe('photo.png');
    expect(swapExtension('my.report.final.PNG', 'webp')).toBe('my.report.final.webp');
    expect(swapExtension('noext', 'jpg')).toBe('noext.jpg');
  });
});
