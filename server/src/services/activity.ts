import { dbQuery } from './supabase.js';

export async function logActivity(
  cardId: string,
  actorId: string,
  action: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await dbQuery(
    'INSERT INTO card_activity (card_id, actor_id, action, details) VALUES ($1, $2, $3, $4)',
    [cardId, actorId, action, details ? JSON.stringify(details) : null],
  );
}
