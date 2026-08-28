'use client';

import { ArrowDown, ArrowUp, X, FileIcon } from 'lucide-react';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/cn';

export interface ManagedFile {
  id: string;
  file: File;
  error?: string;
}

export function FileList({
  files,
  onRemove,
  onMove,
  reorderable = false,
}: {
  files: ManagedFile[];
  onRemove: (id: string) => void;
  onMove?: (id: string, dir: -1 | 1) => void;
  reorderable?: boolean;
}) {
  if (!files.length) return null;
  return (
    <ul className="mt-4 space-y-2">
      {files.map((mf, i) => (
        <li
          key={mf.id}
          className={cn(
            'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm',
            mf.error ? 'border-red-300 bg-red-50 dark:bg-red-950/30' : 'border-ink-200 dark:border-ink-800',
          )}
        >
          <FileIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-ink-800 dark:text-ink-100">{mf.file.name}</span>
            {mf.error ? (
              <span className="block text-xs text-red-600">{mf.error}</span>
            ) : (
              <span className="block text-xs text-ink-400">{formatBytes(mf.file.size)}</span>
            )}
          </span>

          {reorderable && onMove && !mf.error && (
            <span className="flex gap-1">
              <button
                type="button"
                aria-label={`Move ${mf.file.name} up`}
                disabled={i === 0}
                onClick={() => onMove(mf.id, -1)}
                className="rounded-md p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-800"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Move ${mf.file.name} down`}
                disabled={i === files.length - 1}
                onClick={() => onMove(mf.id, 1)}
                className="rounded-md p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-800"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </span>
          )}

          <button
            type="button"
            aria-label={`Remove ${mf.file.name}`}
            onClick={() => onRemove(mf.id)}
            className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-red-600 dark:hover:bg-ink-800"
          >
            <X className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
