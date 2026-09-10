/**
 * Precompiles Web Workers to plain static JS files under public/workers/.
 *
 * Why: Next.js's App Router webpack config does not reliably compile
 * `new Worker(new URL('./file.ts', import.meta.url))` for TypeScript worker
 * sources the way plain Vite/webpack5 projects do — it only special-cases
 * `new URL()` pointing at an *existing* built asset (that's how pdf.js's own
 * prebuilt worker gets picked up). So instead we bundle each worker ourselves
 * with esbuild (already a dev-only build tool, never shipped to the browser)
 * into a real static file, and the app constructs the Worker from that plain
 * URL string — which works identically in dev, in `next build`, and once
 * deployed to any static host.
 *
 * Runs automatically via the `predev`/`prebuild` npm script hooks.
 */
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, 'public', 'workers');
mkdirSync(outDir, { recursive: true });

const workers = [
  { entry: 'lib/image/compress-to-target.worker.ts', out: 'compress-to-target.js' },
  { entry: 'lib/scanner/detect.worker.ts', out: 'scanner-detect.js' },
];

for (const w of workers) {
  await build({
    entryPoints: [join(root, w.entry)],
    outfile: join(outDir, w.out),
    bundle: true,
    format: 'iife',
    target: 'es2020',
    minify: true,
    sourcemap: false,
    logLevel: 'info',
  });
}

console.log(`Built ${workers.length} worker(s) → public/workers/`);
