import { ogImage, OG_SIZE, OG_CONTENT_TYPE, categoryEyebrow } from '@/lib/og';
import { getCategory } from '@/config/categories';

export const alt = getCategory('image')!.title;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  const c = getCategory('image')!;
  return ogImage({ eyebrow: categoryEyebrow('image') + 's', title: c.title.replace('Free Online ', ''), description: c.tagline });
}
