import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatBytes,
  percentReduction,
  formatPercent,
} from '@/lib/format';

describe('format helpers', () => {
  it('formats INR without paise by default', () => {
    expect(formatCurrency(2500000)).toMatch(/₹\s?25,00,000/);
  });

  it('formats compact Indian currency', () => {
    expect(formatCurrencyCompact(12000000)).toBe('₹1.20 Cr');
    expect(formatCurrencyCompact(450000)).toBe('₹4.50 L');
    expect(formatCurrencyCompact(8000)).toMatch(/₹\s?8,000/);
  });

  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('computes percent reduction', () => {
    expect(percentReduction(1000, 250)).toBe(75);
    expect(percentReduction(1000, 1200)).toBe(0);
    expect(percentReduction(0, 100)).toBe(0);
  });

  it('formats percentages', () => {
    expect(formatPercent(14.8666)).toBe('14.87%');
    expect(formatPercent(Number.NaN)).toBe('—');
  });
});
