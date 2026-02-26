import { Router } from 'express';
import { dbQuery, dbQueryRaw } from '../services/supabase.js';
import { sendServerError, sendNotFound } from '../utils/route-helpers.js';

const router = Router();

// ─── GET /cards/:cardId/activity ─────────────────────────────────────────────
router.get('/cards/:cardId/activity', async (req, res) => {
  try {
    const cardId = req.params.cardId;

    // Verify card exists
    const { rows: cardCheck } = await dbQuery('SELECT id FROM cards WHERE id = $1', [cardId]);
    if (cardCheck.length === 0) return sendNotFound(res, 'Card');

    const { rows: activity } = await dbQuery(
      'SELECT * FROM card_activity WHERE card_id = $1 ORDER BY created_at DESC',
      [cardId],
    );

    // Enrich with actor info
    const actorIds = [...new Set(activity.map((a: any) => a.actor_id))];
    let actorMap: Record<string, any> = {};
    if (actorIds.length > 0) {
      const { rows: users } = await dbQueryRaw(
        `SELECT id, email, display_name, full_name, avatar_url
         FROM tower_watch.users WHERE id = ANY($1)`,
        [actorIds],
      );
      for (const u of users) actorMap[u.id] = u;
    }

    const enriched = activity.map((a: any) => ({
      ...a,
      actor: actorMap[a.actor_id] || null,
    }));

    res.json(enriched);
  } catch (err) {
    sendServerError(res, err, 'GET /cards/:cardId/activity');
  }
});

export default router;
