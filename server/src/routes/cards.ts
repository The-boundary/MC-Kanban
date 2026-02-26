import { Router } from 'express';
import { dbQuery, dbQueryRaw, dbTransaction } from '../services/supabase.js';
import { sendServerError, sendNotFound } from '../utils/route-helpers.js';
import { requireBoardAccess } from '../middleware/board-access.js';
import { logActivity } from '../services/activity.js';

const router = Router();

// ─── GET /cards/mine ─────────────────────────────────────────────────────────
// Must be before /cards/:id to avoid matching 'mine' as an id
router.get('/cards/mine', async (req, res) => {
  try {
    const userId = req.user!.id;

    const { rows } = await dbQuery(
      `SELECT c.*, col.title AS column_title, b.title AS board_title, b.id AS board_id
       FROM cards c
       JOIN columns col ON col.id = c.column_id
       JOIN boards b ON b.id = col.board_id
       WHERE c.assignee_id = $1 AND c.is_archived = false AND b.is_archived = false
       ORDER BY c.due_date ASC NULLS LAST, c.created_at DESC`,
      [userId],
    );

    res.json(rows);
  } catch (err) {
    sendServerError(res, err, 'GET /cards/mine');
  }
});

// ─── GET /cards/:id ──────────────────────────────────────────────────────────
router.get('/cards/:id', async (req, res) => {
  try {
    const cardId = req.params.id;

    // Card with board info
    const { rows: cardRows } = await dbQuery(
      `SELECT c.*, col.title AS column_title, b.title AS board_title
       FROM cards c
       JOIN columns col ON col.id = c.column_id
       JOIN boards b ON b.id = col.board_id
       WHERE c.id = $1`,
      [cardId],
    );
    if (cardRows.length === 0) return sendNotFound(res, 'Card');
    const card = cardRows[0];

    // Labels
    const { rows: labels } = await dbQuery(
      `SELECT l.* FROM labels l
       JOIN card_labels cl ON cl.label_id = l.id
       WHERE cl.card_id = $1
       ORDER BY l.name`,
      [cardId],
    );

    // Checklists with items
    const { rows: checklists } = await dbQuery(
      'SELECT * FROM checklists WHERE card_id = $1 ORDER BY position ASC',
      [cardId],
    );
    const checklistIds = checklists.map((cl: any) => cl.id);
    let itemsByChecklist: Record<string, any[]> = {};
    if (checklistIds.length > 0) {
      const { rows: items } = await dbQuery(
        'SELECT * FROM checklist_items WHERE checklist_id = ANY($1) ORDER BY position ASC',
        [checklistIds],
      );
      for (const item of items) {
        if (!itemsByChecklist[item.checklist_id]) itemsByChecklist[item.checklist_id] = [];
        itemsByChecklist[item.checklist_id].push(item);
      }
    }
    const checklistsWithItems = checklists.map((cl: any) => ({
      ...cl,
      items: itemsByChecklist[cl.id] || [],
    }));

    // Comments with author info
    const { rows: comments } = await dbQuery(
      'SELECT * FROM comments WHERE card_id = $1 ORDER BY created_at DESC',
      [cardId],
    );

    // Attachments
    const { rows: attachments } = await dbQuery(
      'SELECT * FROM attachments WHERE card_id = $1 ORDER BY created_at DESC',
      [cardId],
    );

    // Activity with actor info
    const { rows: activity } = await dbQuery(
      'SELECT * FROM card_activity WHERE card_id = $1 ORDER BY created_at DESC',
      [cardId],
    );

    // Gather all user IDs for enrichment
    const userIds = new Set<string>();
    if (card.assignee_id) userIds.add(card.assignee_id);
    if (card.created_by) userIds.add(card.created_by);
    for (const c of comments) userIds.add(c.author_id);
    for (const a of attachments) userIds.add(a.uploaded_by);
    for (const a of activity) userIds.add(a.actor_id);
    for (const cl of checklistsWithItems) {
      for (const item of cl.items) {
        if (item.assignee_id) userIds.add(item.assignee_id);
      }
    }

    let userMap: Record<string, any> = {};
    if (userIds.size > 0) {
      const { rows: users } = await dbQueryRaw(
        `SELECT id, email, display_name, full_name, avatar_url
         FROM tower_watch.users WHERE id = ANY($1)`,
        [[...userIds]],
      );
      for (const u of users) userMap[u.id] = u;
    }

    // Enrich
    card.labels = labels;
    card.assignee = card.assignee_id ? userMap[card.assignee_id] || null : null;
    card.creator = card.created_by ? userMap[card.created_by] || null : null;
    card.checklists = checklistsWithItems.map((cl: any) => ({
      ...cl,
      items: cl.items.map((item: any) => ({
        ...item,
        assignee: item.assignee_id ? userMap[item.assignee_id] || null : null,
      })),
    }));
    card.comments = comments.map((c: any) => ({
      ...c,
      author: userMap[c.author_id] || null,
    }));
    card.attachments = attachments.map((a: any) => ({
      ...a,
      uploader: userMap[a.uploaded_by] || null,
    }));
    card.activity = activity.map((a: any) => ({
      ...a,
      actor: userMap[a.actor_id] || null,
    }));

    res.json(card);
  } catch (err) {
    sendServerError(res, err, 'GET /cards/:id');
  }
});

// ─── POST /boards/:boardId/cards ─────────────────────────────────────────────
router.post('/boards/:boardId/cards', requireBoardAccess('boardId'), async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const userId = req.user!.id;
    const { column_id, title, description, priority, due_date, assignee_id, label_ids } = req.body;

    if (!column_id || !title) {
      return res.status(400).json({ error: { message: 'column_id and title are required' } });
    }

    // Verify column belongs to this board
    const { rows: colCheck } = await dbQuery(
      'SELECT id FROM columns WHERE id = $1 AND board_id = $2',
      [column_id, boardId],
    );
    if (colCheck.length === 0) {
      return res.status(400).json({ error: { message: 'Column does not belong to this board' } });
    }

    // Get max position in column
    const { rows: maxRows } = await dbQuery(
      'SELECT COALESCE(MAX(position), 0) AS max_pos FROM cards WHERE column_id = $1',
      [column_id],
    );
    const position = maxRows[0].max_pos + 1000;

    const card = await dbTransaction(async (client) => {
      const { rows: cardRows } = await client.query(
        `INSERT INTO cards (column_id, board_id, title, description, position, priority, due_date, assignee_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [column_id, boardId, title.trim(), description || null, position, priority || null, due_date || null, assignee_id || null, userId],
      );
      const newCard = cardRows[0];

      // Attach labels
      if (Array.isArray(label_ids) && label_ids.length > 0) {
        for (const labelId of label_ids) {
          await client.query(
            'INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [newCard.id, labelId],
          );
        }
      }

      // Log activity
      await client.query(
        'INSERT INTO card_activity (card_id, actor_id, action) VALUES ($1, $2, $3)',
        [newCard.id, userId, 'created'],
      );

      return newCard;
    });

    res.status(201).json(card);
  } catch (err) {
    sendServerError(res, err, 'POST /boards/:boardId/cards');
  }
});

// ─── PATCH /cards/:id ────────────────────────────────────────────────────────
router.patch('/cards/:id', async (req, res) => {
  try {
    const cardId = req.params.id;
    const userId = req.user!.id;

    const { rows: existing } = await dbQuery('SELECT * FROM cards WHERE id = $1', [cardId]);
    if (existing.length === 0) return sendNotFound(res, 'Card');
    const oldCard = existing[0];

    const allowedFields = ['title', 'description', 'priority', 'due_date', 'assignee_id', 'is_archived'];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: { message: 'No fields to update' } });
    }

    updates.updated_at = new Date().toISOString();

    const setClauses: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${i}`);
      values.push(value);
      i++;
    }
    values.push(cardId);

    const { rows } = await dbQuery(
      `UPDATE cards SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    );

    // Log activity for specific changes
    if (updates.assignee_id !== undefined && updates.assignee_id !== oldCard.assignee_id) {
      await logActivity(cardId, userId, 'assigned', {
        from: oldCard.assignee_id,
        to: updates.assignee_id,
      });
    }
    if (updates.priority !== undefined && updates.priority !== oldCard.priority) {
      await logActivity(cardId, userId, 'priority_changed', {
        from: oldCard.priority,
        to: updates.priority,
      });
    }
    if (updates.due_date !== undefined && updates.due_date !== oldCard.due_date) {
      await logActivity(cardId, userId, 'due_date_changed', {
        from: oldCard.due_date,
        to: updates.due_date,
      });
    }
    if (updates.is_archived !== undefined && updates.is_archived !== oldCard.is_archived) {
      await logActivity(cardId, userId, updates.is_archived ? 'archived' : 'unarchived');
    }

    res.json(rows[0]);
  } catch (err) {
    sendServerError(res, err, 'PATCH /cards/:id');
  }
});

// ─── DELETE /cards/:id ───────────────────────────────────────────────────────
router.delete('/cards/:id', async (req, res) => {
  try {
    const cardId = req.params.id;

    const { rows } = await dbQuery('SELECT id FROM cards WHERE id = $1', [cardId]);
    if (rows.length === 0) return sendNotFound(res, 'Card');

    await dbQuery('DELETE FROM cards WHERE id = $1', [cardId]);
    res.status(204).send();
  } catch (err) {
    sendServerError(res, err, 'DELETE /cards/:id');
  }
});

// ─── POST /cards/:id/move ────────────────────────────────────────────────────
router.post('/cards/:id/move', async (req, res) => {
  try {
    const cardId = req.params.id;
    const userId = req.user!.id;
    const { column_id, position } = req.body;

    if (!column_id || position === undefined) {
      return res.status(400).json({ error: { message: 'column_id and position are required' } });
    }

    const { rows: cardRows } = await dbQuery('SELECT * FROM cards WHERE id = $1', [cardId]);
    if (cardRows.length === 0) return sendNotFound(res, 'Card');
    const card = cardRows[0];

    // Get from/to column info
    const { rows: fromCol } = await dbQuery('SELECT id, title FROM columns WHERE id = $1', [card.column_id]);
    const { rows: toCol } = await dbQuery('SELECT id, title FROM columns WHERE id = $1', [column_id]);
    if (toCol.length === 0) return sendNotFound(res, 'Target column');

    await dbQuery(
      'UPDATE cards SET column_id = $1, position = $2, updated_at = NOW() WHERE id = $3',
      [column_id, position, cardId],
    );

    // Log move activity
    if (card.column_id !== column_id) {
      await logActivity(cardId, userId, 'moved', {
        from_column_id: fromCol[0]?.id,
        from_column_title: fromCol[0]?.title,
        to_column_id: toCol[0].id,
        to_column_title: toCol[0].title,
      });
    }

    const { rows: updated } = await dbQuery('SELECT * FROM cards WHERE id = $1', [cardId]);
    res.json(updated[0]);
  } catch (err) {
    sendServerError(res, err, 'POST /cards/:id/move');
  }
});

// ─── POST /boards/:boardId/cards/reorder ─────────────────────────────────────
router.post('/boards/:boardId/cards/reorder', requireBoardAccess('boardId'), async (req, res) => {
  try {
    const { card_ids, column_id } = req.body;

    if (!Array.isArray(card_ids) || !column_id) {
      return res.status(400).json({ error: { message: 'card_ids array and column_id are required' } });
    }

    await dbTransaction(async (client) => {
      for (let i = 0; i < card_ids.length; i++) {
        await client.query(
          'UPDATE cards SET position = $1, column_id = $2, updated_at = NOW() WHERE id = $3',
          [(i + 1) * 1000, column_id, card_ids[i]],
        );
      }
    });

    res.json({ success: true });
  } catch (err) {
    sendServerError(res, err, 'POST /boards/:boardId/cards/reorder');
  }
});

export default router;
