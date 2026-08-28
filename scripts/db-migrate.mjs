#!/usr/bin/env node
/**
 * Minimal forward-only migration runner.
 * Reads lib/db/migrations/*.sql in order and applies any not yet in schema_migrations.
 * Usage: npm run db:migrate   (requires DATABASE_* env vars)
 */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import mysql from 'mysql2/promise';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'db', 'migrations');

const { DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME } = process.env;
if (!DATABASE_HOST || !DATABASE_USER || !DATABASE_NAME) {
  console.error('DATABASE_* environment variables are not set. Aborting.');
  process.exit(1);
}

const conn = await mysql.createConnection({
  host: DATABASE_HOST,
  port: Number(DATABASE_PORT ?? 3306),
  user: DATABASE_USER,
  password: DATABASE_PASSWORD ?? '',
  database: DATABASE_NAME,
  multipleStatements: true,
});

await conn.query(
  `CREATE TABLE IF NOT EXISTS schema_migrations (
     version VARCHAR(20) NOT NULL PRIMARY KEY,
     applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
   ) ENGINE=InnoDB`,
);

const [applied] = await conn.query('SELECT version FROM schema_migrations');
const done = new Set(applied.map((r) => r.version));

const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
let count = 0;

for (const file of files) {
  const version = file.split('_')[0];
  if (done.has(version)) {
    console.log(`• ${file} already applied`);
    continue;
  }
  const sql = await readFile(path.join(dir, file), 'utf8');
  console.log(`→ applying ${file}`);
  await conn.query(sql);
  await conn.query('INSERT IGNORE INTO schema_migrations (version) VALUES (?)', [version]);
  count += 1;
}

await conn.end();
console.log(count ? `Done. ${count} migration(s) applied.` : 'Database already up to date.');
