'use client';

import { Search } from 'lucide-react';

/** Opens the shared search dialog (mounted once in the Header) via a window event. */
export function openSearch() {
  window.dispatchEvent(new Event('cygnatrix:search'));
}

export function SearchTrigger({ variant = 'button' }: { variant?: 'button' | 'inline' }) {
  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={openSearch}
        aria-label="Search tools"
        className="group flex w-full items-center gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3.5 text-left shadow-card transition hover:border-brand-300 hover:shadow-card-hover dark:border-ink-700 dark:bg-ink-900"
      >
        <Search className="h-5 w-5 shrink-0 text-ink-400 transition group-hover:text-brand-500" aria-hidden="true" />
        <span className="text-[15px] text-ink-500 dark:text-ink-400">Search 18 tools…</span>
        <span className="ml-auto hidden items-center gap-1 text-[11px] text-ink-400 sm:flex">
          <kbd className="rounded border border-ink-200 px-1.5 py-0.5 dark:border-ink-700">/</kbd>
          <kbd className="rounded border border-ink-200 px-1.5 py-0.5 dark:border-ink-700">⌘K</kbd>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      aria-label="Search tools"
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-ink-200 px-3 text-sm text-ink-500 transition hover:border-brand-300 hover:text-ink-700 dark:border-ink-700 dark:text-ink-400"
    >
      <Search className="h-4 w-4" aria-hidden="true" />
      <span className="hidden md:inline">Search</span>
      <kbd className="hidden rounded border border-ink-200 px-1 text-[11px] md:inline dark:border-ink-700">
        ⌘K
      </kbd>
    </button>
  );
}
