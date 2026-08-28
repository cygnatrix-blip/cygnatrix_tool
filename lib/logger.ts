import pino from 'pino';

/**
 * Structured server-side logger. Never log file contents, raw request bodies or
 * anything that could contain PII — redaction below is a backstop, not a licence.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.email', '*.file', '*.buffer'],
    remove: true,
  },
  base: { service: 'cygnatrix-tools' },
});

export function logError(scope: string, error: unknown, context?: Record<string, unknown>): void {
  const err = error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : { message: String(error) };
  logger.error({ scope, err, ...context }, `[${scope}] ${err.message}`);
}
