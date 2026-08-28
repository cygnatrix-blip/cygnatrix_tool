/**
 * Production entry point for hosts that expect a Node script (e.g. Hostinger's
 * Node.js app, Passenger, PM2). It boots the compiled Next.js server.
 *
 * Prerequisite: `npm run build` has been run so `.next/` exists.
 * Hostinger sets PORT automatically; we fall back to 3000 for local use.
 */
const { createServer } = require('node:http');
const next = require('next');

// This is the PRODUCTION entry point: run the compiled build unless NODE_ENV is
// explicitly "development". (Use `npm run dev` for the dev server.)
const dev = process.env.NODE_ENV === 'development';
if (!dev) process.env.NODE_ENV = 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, hostname, () => {
    // eslint-disable-next-line no-console
    console.log(`Cygnatrix Tools ready on http://${hostname}:${port} (dev=${dev})`);
  });
});
