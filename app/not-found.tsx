import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { CATEGORY_LIST } from '@/config/categories';
import { LinkButton } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">This page could not be found</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-600 dark:text-ink-300">
        The tool or page you are looking for may have moved or never existed. Try one of the
        categories below.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <LinkButton href="/">Go to homepage</LinkButton>
        {CATEGORY_LIST.map((c) => (
          <LinkButton key={c.slug} href={`/${c.slug}`} variant="secondary">
            {c.name}
          </LinkButton>
        ))}
      </div>
      <p className="mt-8 text-sm text-ink-400">
        Or see the <Link href="/tools" className="text-brand-600 underline">full list of tools</Link>.
      </p>
    </Container>
  );
}
