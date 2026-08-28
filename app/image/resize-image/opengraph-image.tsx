import { ogImage, OG_SIZE, OG_CONTENT_TYPE, categoryEyebrow } from '@/lib/og';
import { getTool } from '@/config/tools';

const tool = getTool('image', 'resize-image')!;

export const alt = tool.name;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({ eyebrow: categoryEyebrow('image'), title: tool.name, description: tool.shortDescription });
}
