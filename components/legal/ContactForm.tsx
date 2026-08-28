'use client';

import { useState } from 'react';
import { contactSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/primitives';

type Status = 'idle' | 'submitting' | 'done' | 'error';

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const parsed = contactSchema.safeParse(data);
    if (!parsed.success) {
      setStatus('error');
      setMessage(parsed.error.issues[0]?.message ?? 'Please check the form and try again.');
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error();
      setStatus('done');
      setMessage('Thanks — your message has been received. We read every message.');
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus('error');
      setMessage('Something went wrong sending your message. Please try again shortly.');
    }
  }

  if (status === 'done') {
    return <Alert tone="success">{message}</Alert>;
  }

  return (
    <form onSubmit={onSubmit} className="not-prose space-y-4">
      {status === 'error' && <Alert tone="error">{message}</Alert>}

      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" required />
        <Field label="Email" name="email" type="email" required />
      </div>
      <Field label="Subject" name="subject" required />
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950"
        />
      </div>
      <Button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950"
      />
    </div>
  );
}
