import type { Metadata } from 'next';
import { CategoryPage } from '@/components/category/CategoryPage';
import { CATEGORIES } from '@/config/categories';
import { categoryMetadata } from '@/lib/seo/pageHelpers';
import { FinanceDisclaimer } from '@/components/tool/sections';
import { Container } from '@/components/layout/Container';

export const dynamic = 'force-static';
export const metadata: Metadata = categoryMetadata('finance');

export default function FinanceCategoryPage() {
  return (
    <>
      <CategoryPage category={CATEGORIES.finance} />
      <Container>
        <FinanceDisclaimer />
      </Container>
    </>
  );
}
