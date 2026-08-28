import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE } from '@/config/site';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

let cachedMark: string | null = null;
function markDataUri(): string {
  if (cachedMark !== null) return cachedMark;
  try {
    const svg = readFileSync(join(process.cwd(), 'public/brand/logo-mark.svg'), 'utf8');
    cachedMark = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } catch {
    cachedMark = '';
  }
  return cachedMark;
}

export interface OgInput {
  /** Small uppercase label, e.g. "PDF TOOL" or "FINANCE CALCULATOR". */
  eyebrow: string;
  title: string;
  description: string;
}

/**
 * Shared Open Graph card. One consistent, on-brand 1200×630 image used by every
 * category and tool page (each supplies its own title + eyebrow).
 */
export function ogImage({ eyebrow, title, description }: OgInput): ImageResponse {
  const mark = markDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '72px',
          background: 'linear-gradient(135deg, #042d2c 0%, #0d9089 52%, #0b3f9c 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {mark ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mark} width={64} height={64} alt="" />
          ) : null}
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3 }}>CYGNATRIX TOOLS</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#77e7db',
            }}
          >
            {eyebrow}
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, marginTop: 16 }}>{title}</div>
          <div style={{ fontSize: 34, marginTop: 20, opacity: 0.92, maxWidth: 900, lineHeight: 1.3 }}>
            {description}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginTop: 'auto',
            fontSize: 24,
            opacity: 0.85,
          }}
        >
          <span>{SITE.url.replace('https://', '')}</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>Free</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>No sign-up</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>Runs in your browser</span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}

const CATEGORY_EYEBROW: Record<string, string> = {
  pdf: 'PDF Tool',
  finance: 'Finance Calculator',
  image: 'Image Tool',
};

export function categoryEyebrow(slug: string): string {
  return CATEGORY_EYEBROW[slug] ?? 'Online Tool';
}
