'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react';
// The trigger buttons live in <SearchTrigger>; this component only owns the modal.
import { categoryLabel, type ToolIndexEntry } from '@/config/tools';
import { ToolIcon } from '@/components/ui/ToolIcon';
import { track } from '@/lib/analytics/client';
import { cn } from '@/lib/cn';

function scoreEntry(entry: ToolIndexEntry, terms: string[]): number {
  const fields: [string, number][] = [
    [entry.name.toLowerCase(), 10],
    [entry.id.replace(/-/g, ' '), 8],
    [entry.category, 6],
    [entry.keywords.join(' ').toLowerCase(), 5],
    [entry.shortDescription.toLowerCase(), 2],
  ];
  let total = 0;
  for (const term of terms) {
    let best = 0;
    for (const [text, weight] of fields) {
      if (text === term) best = Math.max(best, weight * 3);
      else if (text.startsWith(term)) best = Math.max(best, weight * 2);
      else if (text.includes(term)) best = Math.max(best, weight);
    }
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

export function SearchDialog({ index }: { index: ToolIndexEntry[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const router = useRouter();

  const popular = useMemo(
    () => index.filter((e) => e.popular).slice(0, 6),
    [index],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    return index
      .map((entry) => ({ entry, score: scoreEntry(entry, terms) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
      .slice(0, 8)
      .map((r) => r.entry);
  }, [query, index]);

  const isSearching = query.trim() !== '';
  const shown = isSearching ? results : popular;

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if (e.key === '/' && /input|textarea/i.test((e.target as HTMLElement)?.tagName)) return;
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('cygnatrix:search', onOpenEvent);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('cygnatrix:search', onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      // Return focus to whatever opened the dialog.
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
      return;
    }
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    document.body.style.overflow = 'hidden';

    // Simple focus trap: keep Tab cycling inside the panel.
    function onTrap(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onTrap);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onTrap);
    };
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = useCallback(
    (path: string) => {
      if (isSearching) track('tool_search', { meta: { query: query.slice(0, 60), result: path } });
      setOpen(false);
      setQuery('');
      router.push(path);
    },
    [query, router, isSearching],
  );

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, shown.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && shown[active]) {
      e.preventDefault();
      go(shown[active]!.path);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  // Portal to <body> so the overlay is not trapped by the sticky header's
  // backdrop-filter (which would create a containing block for `position: fixed`).
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink-950/60 p-4 pt-[8vh] backdrop-blur-sm sm:pt-[12vh] animate-fade-in"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            ref={panelRef}
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-ink-950/10 dark:bg-ink-900 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Search tools"
          >
            {/* input */}
            <div className="flex items-center gap-3 border-b border-ink-100 px-4 dark:border-ink-800">
              <Search className="h-5 w-5 shrink-0 text-ink-400" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search 18 tools…"
                aria-label="Search tools"
                className="h-14 w-full appearance-none border-0 bg-transparent text-base text-ink-900 outline-none ring-0 focus:outline-none focus:ring-0 placeholder:text-ink-400 dark:text-white [&::-webkit-search-cancel-button]:hidden"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                className="rounded-md p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* body */}
            <div className="max-h-[min(60vh,26rem)] overflow-y-auto px-2 py-2">
              <p
                aria-live="polite"
                className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400"
              >
                {isSearching
                  ? results.length > 0
                    ? `${results.length} result${results.length === 1 ? '' : 's'} for “${query.trim()}”`
                    : 'No matches'
                  : 'Popular tools'}
              </p>

              {isSearching && results.length === 0 && (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    Nothing matches “<span className="font-medium text-ink-700 dark:text-ink-200">{query.trim()}</span>”.
                  </p>
                  <p className="mt-1 text-xs text-ink-400">Try “loan”, “compress”, “pdf” or “resize”.</p>
                </div>
              )}

              <ul ref={listRef} className="space-y-0.5">
                {shown.map((entry, i) => (
                  <li key={entry.id}>
                    <Link
                      href={entry.path}
                      data-active={i === active}
                      onClick={() => go(entry.path)}
                      onMouseMove={() => setActive(i)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 no-underline outline-none transition',
                        i === active
                          ? 'bg-brand-50 dark:bg-brand-950/40'
                          : 'hover:bg-ink-50 dark:hover:bg-ink-800/60',
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                          i === active
                            ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200'
                            : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300',
                        )}
                      >
                        <ToolIcon name={entry.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-ink-900 dark:text-white">
                            {entry.name}
                          </span>
                          <span className="shrink-0 rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                            {categoryLabel(entry.category)}
                          </span>
                        </span>
                        <span className="mt-0.5 line-clamp-1 block text-xs text-ink-500 dark:text-ink-400">
                          {entry.shortDescription}
                        </span>
                      </span>
                      {i === active && (
                        <CornerDownLeft className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* footer */}
            <div className="hidden items-center gap-4 border-t border-ink-100 px-4 py-2.5 text-[11px] text-ink-400 sm:flex dark:border-ink-800">
              <span className="flex items-center gap-1">
                <kbd className="inline-grid h-4 w-4 place-items-center rounded border border-ink-200 dark:border-ink-700">
                  <ArrowUp className="h-2.5 w-2.5" />
                </kbd>
                <kbd className="inline-grid h-4 w-4 place-items-center rounded border border-ink-200 dark:border-ink-700">
                  <ArrowDown className="h-2.5 w-2.5" />
                </kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="inline-grid h-4 w-4 place-items-center rounded border border-ink-200 dark:border-ink-700">
                  <CornerDownLeft className="h-2.5 w-2.5" />
                </kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-ink-200 px-1 dark:border-ink-700">esc</kbd>
                close
              </span>
              <Link
                href="/tools"
                onClick={() => setOpen(false)}
                className="ml-auto font-medium text-brand-600 no-underline hover:underline"
              >
                Browse all tools →
              </Link>
            </div>
          </div>
        </div>,
    document.body,
  );
}
