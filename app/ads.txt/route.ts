import { ADS } from '@/config/site';

export const dynamic = 'force-static';

/**
 * ads.txt is generated from NEXT_PUBLIC_ADSENSE_CLIENT so there is only one place
 * to configure AdSense. Set that env var (e.g. `ca-pub-1234567890123456`) and this
 * file serves the matching authorized-seller line. Until it is set, an empty
 * (but valid) ads.txt is served.
 */
export function GET() {
  const pub = ADS.client.replace(/^ca-/, '').trim(); // "ca-pub-…" → "pub-…"
  const body = pub
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : '# No AdSense publisher configured yet. Set NEXT_PUBLIC_ADSENSE_CLIENT.\n';

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  });
}
