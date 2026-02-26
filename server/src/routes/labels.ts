import { Router } from 'express';
import { dbQuery } from '../services/supabase.js';
import { sendServerError, sendNotFound } from '../utils/route-helpers.js';
import { requireBoardAccess } from '../middleware/board-access.js';
import { logActivity } from '../services/activity.js';

const router = Router();

// ─── GET /boards/:boardId/labels ─────────────────────────────────────────────
router.get('/boards/:boardId/labels', requireBoardAccess('boardId'), async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const { rows } = await dbQuery(
      'SELECT * FROM labels WHERE board_id = $1 ORDER BY name ASC',
      [boardId],
    );
    res.json(rows);
  } catch (err) {
    sendServerError(res, err, 'GET /boards/:boardId/labels');
  }
});

// ─── POST /boards/:boardId/labels ────────────────────────────────────────────
router.post('/boards/:boardId/labels', requireBoardAccess('boardId'), async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const { name, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({ error: { message: 'name and color are required' } });
    }

    const { rows } = await dbQuery(
      'INSERT INTO labels (board_id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [boardId, name.trim(), color],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    sendServerError(res, err, 'POST /boards/:boardId/labels');
  }
});

// ─── PATCH /labels/:id ──────────────────────────────────────────────────────
router.patch('/labels/:id', async (req, res) => {
  try {
    const labelId = req.params.id;
    const { name, color } = req.body;

    const { rows: existing } = await dbQuery('SELECT * FROM labels WHERE id = $1', [labelId]);
    if (existing.length === 0) return sendNotFound(res, 'Label');

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (color !== undefined) updates.color = color;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: { message: 'No fields to update' } });
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${i}`);
      values.push(value);
      i++;
    }
    values.push(labelId);

    const { rows } = await dbQuery(
      `UPDATE labels SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    );

    res.json(rows[0]);
  } catch (err) {
    sendServerError(res, err, 'PATCH /labels/:id');
  }
});

// ─── DELETE /labels/:id ─────────────────────────────────────────────────────
router.delete('/labels/:id', async (req, res) => {
  try {
    const labelId = req.params.id;

    const { rows } = await dbQuery('SELECT id FROM labels WHERE id = $1', [labelId]);
    if (rows.length === 0) return sendNotFound(res, 'Label');

    await dbQuery('DELETE FROM labels WHERE id = $1', [labelId]);
    res.status(204).send();
  } catch (err) {
    sendServerError(res, err, 'DELETE /labels/:id');
  }
});

// ─── POST /cards/:cardId/labels ──────────────────────────────────────────────
router.post('/cards/:cardId/labels', async (req, res) => {
  try {
    const cardId = req.params.cardId;
    const userId = req.user!.id;
    const { label_id } = req.body;

    if (!label_id) {
      return res.status(400).json({ error: { message: 'label_id is required' } });
    }

    // Verify card exists
    const { rows: cardCheck } = await dbQuery('SELECT id FROM cards WHERE id = $1', [cardId]);
    if (cardCheck.length === 0) return sendNotFound(res, 'Card');

    // Verify label exists
    const { rows: labelCheck } = await dbQuery('SELECT * FROM labels WHERE id = $1', [label_id]);
    if (labelCheck.length === 0) return sendNotFound(res, 'Label');

    await dbQuery(
      'INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [cardId, label_id],
    );

    await logActivity(cardId, userId, 'label_added', { label_id, label_name: labelCheck[0].name });

    res.status(201).json({ card_id: cardId, label_id });
  } catch (err) {
    sendServerError(res, err, 'POST /cards/:cardId/labels');
  }
});

// ─── DELETE /cards/:cardId/labels/:labelId ───────────────────────────────────
router.delete('/cards/:cardId/labels/:labelId', async (req, res) => {
  try {
    const { cardId, labelId } = req.params;
    const userId = req.user!.id;

    const { rows: labelCheck } = await dbQuery('SELECT * FROM labels WHERE id = $1', [labelId]);

    const result = await dbQuery(
      'DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2',
      [cardId, labelId],
    );

    if ((result.rowCount ?? 0) === 0) {
      return sendNotFound(res, 'Card label');
    }

    await logActivity(cardId, userId, 'label_removed', {
      label_id: labelId,
      label_name: labelCheck[0]?.name,
    });

    res.status(204).send();
  } catch (err) {
    sendServerError(res, err, 'DELETE /cards/:cardId/labels/:labelId');
  }
});

export default router;
