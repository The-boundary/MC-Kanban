import { Router } from 'express';
import { dbQuery } from '../services/supabase.js';
import { sendServerError, sendNotFound } from '../utils/route-helpers.js';

const router = Router();

// ─── POST /cards/:cardId/checklists ──────────────────────────────────────────
router.post('/cards/:cardId/checklists', async (req, res) => {
  try {
    const cardId = req.params.cardId;
    const { title } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: { message: 'title is required' } });
    }

    // Verify card exists
    const { rows: cardCheck } = await dbQuery('SELECT id FROM cards WHERE id = $1', [cardId]);
    if (cardCheck.length === 0) return sendNotFound(res, 'Card');

    // Get next position
    const { rows: maxRows } = await dbQuery(
      'SELECT COALESCE(MAX(position), 0) AS max_pos FROM checklists WHERE card_id = $1',
      [cardId],
    );
    const position = maxRows[0].max_pos + 1000;

    const { rows } = await dbQuery(
      'INSERT INTO checklists (card_id, title, position) VALUES ($1, $2, $3) RETURNING *',
      [cardId, title.trim(), position],
    );

    // Return with empty items array
    res.status(201).json({ ...rows[0], items: [] });
  } catch (err) {
    sendServerError(res, err, 'POST /cards/:cardId/checklists');
  }
});

// ─── PATCH /checklists/:id ──────────────────────────────────────────────────
router.patch('/checklists/:id', async (req, res) => {
  try {
    const checklistId = req.params.id;
    const { title, position } = req.body;

    const { rows: existing } = await dbQuery('SELECT * FROM checklists WHERE id = $1', [checklistId]);
    if (existing.length === 0) return sendNotFound(res, 'Checklist');

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (position !== undefined) updates.position = position;

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
    values.push(checklistId);

    const { rows } = await dbQuery(
      `UPDATE checklists SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    );

    res.json(rows[0]);
  } catch (err) {
    sendServerError(res, err, 'PATCH /checklists/:id');
  }
});

// ─── DELETE /checklists/:id ─────────────────────────────────────────────────
router.delete('/checklists/:id', async (req, res) => {
  try {
    const checklistId = req.params.id;

    const { rows } = await dbQuery('SELECT id FROM checklists WHERE id = $1', [checklistId]);
    if (rows.length === 0) return sendNotFound(res, 'Checklist');

    await dbQuery('DELETE FROM checklists WHERE id = $1', [checklistId]);
    res.status(204).send();
  } catch (err) {
    sendServerError(res, err, 'DELETE /checklists/:id');
  }
});

// ─── POST /checklists/:checklistId/items ─────────────────────────────────────
router.post('/checklists/:checklistId/items', async (req, res) => {
  try {
    const checklistId = req.params.checklistId;
    const { title } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: { message: 'title is required' } });
    }

    // Verify checklist exists
    const { rows: clCheck } = await dbQuery('SELECT id FROM checklists WHERE id = $1', [checklistId]);
    if (clCheck.length === 0) return sendNotFound(res, 'Checklist');

    // Get next position
    const { rows: maxRows } = await dbQuery(
      'SELECT COALESCE(MAX(position), 0) AS max_pos FROM checklist_items WHERE checklist_id = $1',
      [checklistId],
    );
    const position = maxRows[0].max_pos + 1000;

    const { rows } = await dbQuery(
      'INSERT INTO checklist_items (checklist_id, title, position) VALUES ($1, $2, $3) RETURNING *',
      [checklistId, title.trim(), position],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    sendServerError(res, err, 'POST /checklists/:checklistId/items');
  }
});

// ─── PATCH /checklist-items/:id ─────────────────────────────────────────────
router.patch('/checklist-items/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    const { title, is_checked, position, assignee_id } = req.body;

    const { rows: existing } = await dbQuery('SELECT * FROM checklist_items WHERE id = $1', [itemId]);
    if (existing.length === 0) return sendNotFound(res, 'Checklist item');

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (is_checked !== undefined) updates.is_checked = is_checked;
    if (position !== undefined) updates.position = position;
    if (assignee_id !== undefined) updates.assignee_id = assignee_id;

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
    values.push(itemId);

    const { rows } = await dbQuery(
      `UPDATE checklist_items SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    );

    res.json(rows[0]);
  } catch (err) {
    sendServerError(res, err, 'PATCH /checklist-items/:id');
  }
});

// ─── DELETE /checklist-items/:id ────────────────────────────────────────────
router.delete('/checklist-items/:id', async (req, res) => {
  try {
    const itemId = req.params.id;

    const { rows } = await dbQuery('SELECT id FROM checklist_items WHERE id = $1', [itemId]);
    if (rows.length === 0) return sendNotFound(res, 'Checklist item');

    await dbQuery('DELETE FROM checklist_items WHERE id = $1', [itemId]);
    res.status(204).send();
  } catch (err) {
    sendServerError(res, err, 'DELETE /checklist-items/:id');
  }
});

export default router;
