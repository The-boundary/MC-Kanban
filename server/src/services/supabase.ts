import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import pg from 'pg';

import { logger } from '../utils/logger.js';

// ============================================================
// Supabase REST client (tower_watch schema — for auth/access views)
// ============================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase: SupabaseClient<any, any, any> | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, { db: { schema: 'tower_watch' } })
    : null;

if (!supabaseUrl || !supabaseKey) {
  logger.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set - Supabase API client disabled');
}

export function getAuthSupabaseClient(): SupabaseClient<any, any, any> | null {
  return supabase;
}

// ============================================================
// Direct Postgres pool (kanban schema)
// We use pg directly for the kanban schema — same
// pattern as MC-TrafficLight uses for traffic_light schema.
// ============================================================

const SCHEMA = process.env.KANBAN_SCHEMA || 'kanban';
export const KANTATA_SCHEMA = process.env.KANTATA_SCHEMA || 'traffic_light';

const pool = process.env.SUPABASE_DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.SUPABASE_DATABASE_URL, max: 10 })
  : null;

if (!pool) {
  logger.warn('SUPABASE_DATABASE_URL not set - kanban direct DB access disabled');
}

/** Run a query against the kanban schema. Automatically sets search_path. */
export async function dbQuery<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<pg.QueryResult<T>> {
  if (!pool) throw new Error('Database not configured (SUPABASE_DATABASE_URL missing)');
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO ${SCHEMA}`);
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}

/** Run a raw query without setting search_path (for cross-schema queries like tower_watch and traffic_light). */
export async function dbQueryRaw<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<pg.QueryResult<T>> {
  if (!pool) throw new Error('Database not configured');
  const client = await pool.connect();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}

/** Run multiple queries in a transaction against kanban schema. */
export async function dbTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  if (!pool) throw new Error('Database not configured (SUPABASE_DATABASE_URL missing)');
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO ${SCHEMA}`);
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
