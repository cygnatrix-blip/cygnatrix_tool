'use client';

import { useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { FILE_LIMITS } from '@/config/site';
import { useFileTool } from '@/lib/hooks/useFileTool';
import { downloadBlob, bytesToBlob } from '@/lib/download';
import { track } from '@/lib/analytics/client';
import { DropZone } from '@/components/file/DropZone';
import { FileList } from '@/components/file/FileList';
import { ProcessButton, DownloadButton } from '@/components/file/ProcessBar';
import { Alert } from '@/components/ui/primitives';
import { SegmentedControl } from '@/components/calculator/shell';

const L = FILE_LIMITS.pdf;
type Mode = 'protect' | 'unlock';

export function ProtectUnlockPdfTool() {
  const ft = useFileTool({
    toolSlug: 'protect-unlock-pdf',
    category: 'pdf',
    accept: ['pdf'],
    maxSizeMB: L.maxFileSizeMB,
    maxFiles: 1,
    multiple: false,
  });
  const file = ft.validFiles[0]?.file ?? null;

  const [mode, setMode] = useState<Mode>('protect');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setOutput(null);
    setError(null);
  };

  const run = async () => {
    if (!file) return;
    setError(null);
    setOutput(null);

    if (mode === 'protect') {
      if (password.length < 4) {
        setError('Choose a password with at least 4 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('The two passwords do not match.');
        return;
      }
    } else if (!password) {
      setError('Enter the PDF’s current password.');
      return;
    }

    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      if (mode === 'protect') {
        const { protectPdf } = await import('@/lib/pdf/crypto/protect');
        const bytes = await protectPdf(buf, { userPassword: password });
        setOutput(bytesToBlob(bytes, 'application/pdf'));
        track('tool_completed', { toolSlug: 'protect-unlock-pdf', category: 'pdf', meta: { action: 'protect' } });
      } else {
        const { unlockPdf } = await import('@/lib/pdf/crypto/unlock');
        const bytes = await unlockPdf(buf, password);
        setOutput(bytesToBlob(bytes, 'application/pdf'));
        track('tool_completed', { toolSlug: 'protect-unlock-pdf', category: 'pdf', meta: { action: 'unlock' } });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      track('tool_failed', { toolSlug: 'protect-unlock-pdf', category: 'pdf', meta: { action: mode } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SegmentedControl
        label="What do you want to do?"
        value={mode}
        onChange={(v) => {
          setMode(v);
          setPassword('');
          setConfirmPassword('');
          reset();
        }}
        options={[
          { value: 'protect', label: 'Add a password' },
          { value: 'unlock', label: 'Remove a password' },
        ]}
      />

      <Alert tone="info" className="mb-4">
        <span className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {mode === 'protect'
              ? 'Adds standard 128-bit encryption that every PDF reader supports. Choose a password you can remember — we do not store it anywhere.'
              : 'This only removes a password you already know. It cannot crack, guess or bypass a password you don’t have, and it does not support PDFs protected with the newer AES-256 (PDF 2.0) encryption.'}
          </span>
        </span>
      </Alert>

      <DropZone onFiles={ft.addFiles} accept="application/pdf,.pdf" multiple={false} hint={`One PDF, up to ${L.maxFileSizeMB} MB`} disabled={busy} />
      <FileList files={ft.files} onRemove={ft.removeFile} />

      {file && (
        <div className="mt-4 card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pw" className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
                {mode === 'protect' ? 'New password' : 'Current password'}
              </label>
              <input
                id="pw"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950"
              />
            </div>
            {mode === 'protect' && (
              <div>
                <label htmlFor="pw2" className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
                  Confirm password
                </label>
                <input
                  id="pw2"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950"
                />
              </div>
            )}
          </div>

          <ProcessButton onClick={run} busy={busy}>
            <Lock className="h-4 w-4" aria-hidden="true" />
            {mode === 'protect' ? 'Protect PDF' : 'Unlock PDF'}
          </ProcessButton>
        </div>
      )}

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      {output && (
        <div className="mt-4 space-y-3">
          <Alert tone="success">
            {mode === 'protect' ? 'Your password-protected PDF is ready.' : 'Your unlocked PDF is ready.'}
          </Alert>
          <DownloadButton
            onClick={() => downloadBlob(output, mode === 'protect' ? 'protected.pdf' : 'unlocked.pdf')}
          >
            Download {mode === 'protect' ? 'protected.pdf' : 'unlocked.pdf'}
          </DownloadButton>
        </div>
      )}
    </div>
  );
}
