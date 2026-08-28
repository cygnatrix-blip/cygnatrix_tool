import { ogImage, OG_SIZE, OG_CONTENT_TYPE, categoryEyebrow } from '@/lib/og';
import { getTool } from '@/config/tools';

const tool = getTool('finance', 'cagr-calculator')!;

export const alt = tool.name;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({ eyebrow: categoryEyebrow('finance'), title: tool.name, description: tool.shortDescription });
}
