'use client';

import { useEffect } from 'react';
import { Container } from '@/components/layout/Container';
import { Button, LinkButton } from '@/components/ui/Button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Client-side visibility only; server logs capture the real detail.
    console.error('Unhandled error', error.digest ?? error.message);
  }, [error]);

  return (
    <Container className="py-24 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-600 dark:text-ink-300">
        An unexpected error occurred while loading this page. Your files and data are safe — nothing
        was uploaded. Please try again.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <LinkButton href="/" variant="secondary">
          Go to homepage
        </LinkButton>
      </div>
    </Container>
  );
}
