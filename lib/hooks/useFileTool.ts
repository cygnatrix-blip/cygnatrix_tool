'use client';

import { useCallback, useState } from 'react';
import type { ManagedFile } from '@/components/file/FileList';
import { validateFile, type FileKind } from '@/lib/security/file-validation';
import { track } from '@/lib/analytics/client';

let counter = 0;
const nextId = () => `f${Date.now()}-${counter++}`;

export interface UseFileToolOptions {
  toolSlug: string;
  category: 'pdf' | 'image';
  accept: FileKind[];
  maxSizeMB: number;
  maxFiles: number;
  multiple: boolean;
}

export function useFileTool(opts: UseFileToolOptions) {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    async (incoming: File[]) => {
      setError(null);
      const room = opts.multiple ? opts.maxFiles - files.length : 1;
      if (room <= 0) {
        setError(`You can process up to ${opts.maxFiles} files at once.`);
        return;
      }
      const slice = incoming.slice(0, room);
      const validated: ManagedFile[] = [];
      for (const file of slice) {
        const outcome = await validateFile(file, { accept: opts.accept, maxSizeMB: opts.maxSizeMB });
        validated.push({ id: nextId(), file, error: outcome.ok ? undefined : outcome.error });
      }
      setFiles((prev) => (opts.multiple ? [...prev, ...validated] : validated));
      track('tool_started', { toolSlug: opts.toolSlug, category: opts.category, meta: { count: slice.length } });
    },
    [files.length, opts],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const moveFile = useCallback((id: string, dir: -1 | 1) => {
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target]!, copy[idx]!];
      return copy;
    });
  }, []);

  const reset = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  const validFiles = files.filter((f) => !f.error);

  return { files, validFiles, error, setError, addFiles, removeFile, moveFile, reset };
}
