/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

// AdSense + analytics hosts allowed by CSP. Kept narrow on purpose.
const scriptSrc = [
  "'self'",
  "'unsafe-inline'", // Next inline bootstrap + JSON-LD
  "'wasm-unsafe-eval'", // pdf.js / image codecs compile WebAssembly in the browser
  // Next.js dev (webpack HMR + React Refresh) evaluates code strings.
  ...(isProd ? [] : ["'unsafe-eval'"]),
  'https://pagead2.googlesyndication.com',
  'https://partner.googleadservices.com',
  'https://tpc.googlesyndication.com',
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://adservice.google.com',
  'https://ep1.adtrafficquality.google',
];
const frameSrc = [
  "'self'",
  'https://googleads.g.doubleclick.net',
  'https://tpc.googlesyndication.com',
  'https://ep2.adtrafficquality.google',
];
const imgSrc = ["'self'", 'data:', 'blob:', 'https:'];
const connectSrc = [
  "'self'",
  'https://www.google-analytics.com',
  'https://pagead2.googlesyndication.com',
  'https://googleads.g.doubleclick.net',
  'https://ep1.adtrafficquality.google',
];

const csp = [
  `default-src 'self'`,
  `script-src ${scriptSrc.join(' ')}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src ${imgSrc.join(' ')}`,
  `font-src 'self' data:`,
  `connect-src ${connectSrc.join(' ')}`,
  `frame-src ${frameSrc.join(' ')}`,
  `worker-src 'self' blob:`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  isProd ? 'upgrade-insecure-requests' : '',
]
  .filter(Boolean)
  .join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  // docx ships modern ESM that Next's bundler must transpile itself.
  transpilePackages: ['docx'],
  // Note: lucide-react is already in Next's built-in optimizePackageImports list, so no
  // `experimental.optimizePackageImports` is needed here — adding it has been linked to a
  // webpack dev-mode "Cannot read properties of undefined (reading 'call')" chunk error.
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  async redirects() {
    // Normalise category index trailing slash + legacy guesses.
    return [
      { source: '/pdf-tools', destination: '/pdf', permanent: true },
      { source: '/finance-calculators', destination: '/finance', permanent: true },
      { source: '/image-tools', destination: '/image', permanent: true },
    ];
  },
};

export default nextConfig;
