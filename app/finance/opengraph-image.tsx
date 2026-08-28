import { ogImage, OG_SIZE, OG_CONTENT_TYPE, categoryEyebrow } from '@/lib/og';
import { getCategory } from '@/config/categories';

export const alt = getCategory('finance')!.title;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  const c = getCategory('finance')!;
  return ogImage({ eyebrow: categoryEyebrow('finance') + 's', title: c.title.replace('Free Online ', ''), description: c.tagline });
}
