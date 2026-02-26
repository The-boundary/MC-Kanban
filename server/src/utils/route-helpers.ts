import type { Response } from 'express';
import { logger } from './logger.js';

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

/** Send a 500 error response and log the error. */
export function sendServerError(res: Response, err: unknown, context: string): void {
  logger.error({ err }, context);
  res.status(500).json({
    error: { message: err instanceof Error ? err.message : 'Internal error' },
  });
}

/** Send a 404 error response. */
export function sendNotFound(res: Response, entity: string): void {
  res.status(404).json({ error: { message: `${entity} not found` } });
}

// ---------------------------------------------------------------------------
// Dynamic UPDATE builder (used by PUT/PATCH routes)
// ---------------------------------------------------------------------------

/**
 * Build a parameterized SET clause from an updates object.
 * Returns { setClauses, values, nextParam } where nextParam is the index
 * for the next parameter (the WHERE id).
 */
export function buildSetClause(updates: Record<string, any>): {
  setClauses: string;
  values: any[];
  nextParam: number;
} {
  const parts: string[] = [];
  const values: any[] = [];
  let i = 1;

  for (const [key, value] of Object.entries(updates)) {
    parts.push(`${key} = $${i}`);
    values.push(value);
    i++;
  }

  return { setClauses: parts.join(', '), values, nextParam: i };
}
