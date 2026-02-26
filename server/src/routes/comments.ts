import { Router } from 'express';
import { dbQuery, dbQueryRaw } from '../services/supabase.js';
import { sendServerError, sendNotFound } from '../utils/route-helpers.js';

const router = Router();

// ─── GET /cards/:cardId/comments ─────────────────────────────────────────────
router.get('/cards/:cardId/comments', async (req, res) => {
  try {
    const cardId = req.params.cardId;

    // Verify card exists
    const { rows: cardCheck } = await dbQuery('SELECT id FROM cards WHERE id = $1', [cardId]);
    if (cardCheck.length === 0) return sendNotFound(res, 'Card');

    const { rows: comments } = await dbQuery(
      'SELECT * FROM comments WHERE card_id = $1 ORDER BY created_at DESC',
      [cardId],
    );

    // Enrich with author info
    const authorIds = [...new Set(comments.map((c: any) => c.author_id))];
    let authorMap: Record<string, any> = {};
    if (authorIds.length > 0) {
      const { rows: users } = await dbQueryRaw(
        `SELECT id, email, display_name, full_name, avatar_url
         FROM tower_watch.users WHERE id = ANY($1)`,
        [authorIds],
      );
      for (const u of users) authorMap[u.id] = u;
    }

    const enriched = comments.map((c: any) => ({
      ...c,
      author: authorMap[c.author_id] || null,
    }));

    res.json(enriched);
  } catch (err) {
    sendServerError(res, err, 'GET /cards/:cardId/comments');
  }
});

// ─── POST /cards/:cardId/comments ────────────────────────────────────────────
router.post('/cards/:cardId/comments', async (req, res) => {
  try {
    const cardId = req.params.cardId;
    const userId = req.user!.id;
    const { body } = req.body;

    if (!body || typeof body !== 'string') {
      return res.status(400).json({ error: { message: 'body is required' } });
    }

    // Verify card exists
    const { rows: cardCheck } = await dbQuery('SELECT id FROM cards WHERE id = $1', [cardId]);
    if (cardCheck.length === 0) return sendNotFound(res, 'Card');

    const { rows } = await dbQuery(
      'INSERT INTO comments (card_id, author_id, body) VALUES ($1, $2, $3) RETURNING *',
      [cardId, userId, body.trim()],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    sendServerError(res, err, 'POST /cards/:cardId/comments');
  }
});

// ─── PATCH /comments/:id ────────────────────────────────────────────────────
router.patch('/comments/:id', async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user!.id;
    const { body } = req.body;

    if (!body || typeof body !== 'string') {
      return res.status(400).json({ error: { message: 'body is required' } });
    }

    const { rows: existing } = await dbQuery('SELECT * FROM comments WHERE id = $1', [commentId]);
    if (existing.length === 0) return sendNotFound(res, 'Comment');

    if (existing[0].author_id !== userId) {
      return res.status(403).json({ error: { message: 'Only the author can edit this comment' } });
    }

    const { rows } = await dbQuery(
      'UPDATE comments SET body = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [body.trim(), commentId],
    );

    res.json(rows[0]);
  } catch (err) {
    sendServerError(res, err, 'PATCH /comments/:id');
  }
});

// ─── DELETE /comments/:id ───────────────────────────────────────────────────
router.delete('/comments/:id', async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user!.id;

    const { rows: existing } = await dbQuery('SELECT * FROM comments WHERE id = $1', [commentId]);
    if (existing.length === 0) return sendNotFound(res, 'Comment');

    if (existing[0].author_id !== userId) {
      return res.status(403).json({ error: { message: 'Only the author can delete this comment' } });
    }

    await dbQuery('DELETE FROM comments WHERE id = $1', [commentId]);
    res.status(204).send();
  } catch (err) {
    sendServerError(res, err, 'DELETE /comments/:id');
  }
});

export default router;
