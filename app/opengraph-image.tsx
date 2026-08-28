import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE } from '@/config/site';

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function markDataUri(): string {
  try {
    const svg = readFileSync(join(process.cwd(), 'public/brand/logo-mark.svg'), 'utf8');
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } catch {
    return '';
  }
}

export default function OgImage() {
  const mark = markDataUri();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #042d2c 0%, #0d9089 55%, #0b3f9c 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {mark ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mark} width={96} height={96} alt="" />
          ) : null}
          <div style={{ fontSize: 34, opacity: 0.85, letterSpacing: 2 }}>CYGNATRIX IT SOLUTIONS</div>
        </div>
        <div style={{ fontSize: 88, fontWeight: 700, marginTop: 20, lineHeight: 1.05 }}>
          Cygnatrix Tools
        </div>
        <div style={{ fontSize: 40, marginTop: 24, opacity: 0.92 }}>{SITE.tagline}</div>
        <div style={{ fontSize: 28, marginTop: 'auto', opacity: 0.8 }}>
          PDF tools · Finance calculators · Image tools
        </div>
      </div>
    ),
    size,
  );
}
