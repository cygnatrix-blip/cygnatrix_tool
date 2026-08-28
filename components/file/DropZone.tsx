'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/cn';

export function DropZone({
  onFiles,
  accept,
  multiple = true,
  hint,
  disabled = false,
}: {
  onFiles: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  hint?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const files = Array.from(list);
      if (files.length) onFiles(multiple ? files : files.slice(0, 1));
    },
    [onFiles, multiple],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handle(e.dataTransfer.files);
      }}
      className={cn(
        'rounded-2xl border-2 border-dashed p-8 text-center transition',
        dragging ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30' : 'border-ink-300 dark:border-ink-700',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => handle(e.target.files)}
      />
      <UploadCloud className="mx-auto h-10 w-10 text-brand-500" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-ink-800 dark:text-ink-100">
        Drag &amp; drop {multiple ? 'files' : 'a file'} here, or{' '}
        <label htmlFor={id} className="cursor-pointer text-brand-600 underline">
          browse
        </label>
      </p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
