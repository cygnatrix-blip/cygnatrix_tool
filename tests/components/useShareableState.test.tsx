import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShareableState } from '@/lib/hooks/useShareableState';

describe('useShareableState', () => {
  it('starts from the given defaults when the URL has no query params', () => {
    window.history.replaceState(null, '', '/finance/income-tax-calculator');
    const { result } = renderHook(() => useShareableState({ income: 1200000, regime: 'new' }));
    expect(result.current[0]).toEqual({ income: 1200000, regime: 'new' });
  });

  it('hydrates numeric and string fields from an existing query string on mount', () => {
    window.history.replaceState(null, '', '/finance/income-tax-calculator?income=1500000&regime=old');
    const { result } = renderHook(() => useShareableState({ income: 1200000, regime: 'new' }));
    expect(result.current[0]).toEqual({ income: 1500000, regime: 'old' });
  });

  it('ignores an unparsable numeric value and keeps the default', () => {
    window.history.replaceState(null, '', '/finance/income-tax-calculator?income=not-a-number');
    const { result } = renderHook(() => useShareableState({ income: 1200000 }));
    expect(result.current[0].income).toBe(1200000);
  });

  it('updates local state immediately when the setter is called', () => {
    window.history.replaceState(null, '', '/finance/income-tax-calculator');
    const { result } = renderHook(() => useShareableState({ income: 1200000 }));
    act(() => {
      result.current[1]({ income: 2000000 });
    });
    expect(result.current[0].income).toBe(2000000);
  });

  it('writes the updated values into the URL after the debounce delay', async () => {
    vi.useFakeTimers();
    window.history.replaceState(null, '', '/finance/income-tax-calculator');
    const { result } = renderHook(() => useShareableState({ income: 1200000, regime: 'new' }));

    act(() => {
      result.current[1]({ income: 900000 });
    });
    // Not yet written — still debouncing.
    expect(window.location.search).toBe('');

    act(() => {
      vi.advanceTimersByTime(500);
    });
    const params = new URLSearchParams(window.location.search);
    expect(params.get('income')).toBe('900000');
    expect(params.get('regime')).toBe('new');
    vi.useRealTimers();
  });

  it('debounces rapid successive updates into a single URL write', async () => {
    vi.useFakeTimers();
    window.history.replaceState(null, '', '/finance/income-tax-calculator');
    const { result } = renderHook(() => useShareableState({ income: 100 }));

    act(() => {
      result.current[1]({ income: 200 });
      result.current[1]({ income: 300 });
      result.current[1]({ income: 400 });
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    const params = new URLSearchParams(window.location.search);
    expect(params.get('income')).toBe('400');
    vi.useRealTimers();
  });
});
