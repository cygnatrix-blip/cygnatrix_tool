import mysql from 'mysql2/promise';
import { logger } from '@/lib/logger';

/**
 * Lazily-created MySQL pool. Returns null when the database is not configured —
 * every caller must handle null and degrade gracefully (analytics + contact form
 * simply no-op). The pool is kept small for shared hosting.
 */
let pool: mysql.Pool | null | undefined;

function config(): mysql.PoolOptions | null {
  const { DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME } = process.env;
  if (!DATABASE_HOST || !DATABASE_USER || !DATABASE_NAME) return null;
  return {
    host: DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: DATABASE_USER,
    password: DATABASE_PASSWORD ?? '',
    database: DATABASE_NAME,
    connectionLimit: Number(process.env.DATABASE_POOL_LIMIT ?? 5),
    waitForConnections: true,
    queueLimit: 20,
    enableKeepAlive: true,
    timezone: 'Z',
  };
}

export function getPool(): mysql.Pool | null {
  if (pool !== undefined) return pool;
  const cfg = config();
  if (!cfg) {
    logger.warn('Database not configured — persistence features are disabled.');
    pool = null;
    return null;
  }
  try {
    pool = mysql.createPool(cfg);
    return pool;
  } catch (error) {
    logger.error({ err: error }, 'Failed to create MySQL pool');
    pool = null;
    return null;
  }
}

export function isDbEnabled(): boolean {
  return config() !== null;
}

/** Run a parameterised query. Returns null if the DB is unavailable or the query fails. */
export async function query<T = unknown>(
  sql: string,
  params: ReadonlyArray<unknown> = [],
): Promise<T[] | null> {
  const p = getPool();
  if (!p) return null;
  try {
    const [rows] = await p.execute(sql, params as unknown as (string | number | null)[]);
    return rows as T[];
  } catch (error) {
    logger.error({ err: error, sql }, 'Query failed');
    return null;
  }
}
