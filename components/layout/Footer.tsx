import Link from 'next/link';
import { Container } from './Container';
import { Logo } from './Logo';
import { FOOTER_LINKS, SITE } from '@/config/site';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-ink-200 bg-ink-50/60 dark:border-ink-800 dark:bg-ink-950">
      <Container className="py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-6 text-ink-500 dark:text-ink-400">
              {SITE.description}
            </p>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">{group.title}</h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-600 hover:text-brand-600 hover:underline dark:text-ink-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-ink-200 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between dark:border-ink-800">
          <p>
            © {year} {SITE.company.name}. All rights reserved.
          </p>
          <p>
            Tools run in your browser — files are never uploaded. Calculators are estimates, not
            financial advice.
          </p>
        </div>
      </Container>
    </footer>
  );
}
