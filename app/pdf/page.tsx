import type { Metadata } from 'next';
import { CategoryPage } from '@/components/category/CategoryPage';
import { CATEGORIES } from '@/config/categories';
import { categoryMetadata } from '@/lib/seo/pageHelpers';

export const dynamic = 'force-static';
export const metadata: Metadata = categoryMetadata('pdf');

export default function PdfCategoryPage() {
  return <CategoryPage category={CATEGORIES.pdf} />;
}
