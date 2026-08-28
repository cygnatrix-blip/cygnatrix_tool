import Link from 'next/link';
import { Container } from './Container';
import { Logo } from './Logo';
import { MobileNav } from './MobileNav';
import { SearchDialog } from './SearchDialog';
import { SearchTrigger } from './SearchTrigger';
import { NAV_LINKS } from '@/config/site';
import { getToolSearchIndex } from '@/config/tools';

export function Header() {
  const index = getToolSearchIndex();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-white/85 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/85">
      <Container>
        <div className="flex h-16 items-center gap-4">
          <Logo />

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <SearchTrigger />
            <SearchDialog index={index} />
            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
  );
}
