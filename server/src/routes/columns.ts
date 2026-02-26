import { Router } from 'express';
import { dbQuery, dbTransaction } from '../services/supabase.js';
import { sendServerError, sendNotFound } from '../utils/route-helpers.js';
import { requireBoardAccess } from '../middleware/board-access.js';

const router = Router();

// ─── POST /boards/:boardId/columns ──────────────────────────────────────────
router.post('/boards/:boardId/columns', requireBoardAccess('boardId'), async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const { title, color, wip_limit } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: { message: 'title is required' } });
    }

    // Get max position
    const { rows: maxRows } = await dbQuery(
      'SELECT COALESCE(MAX(position), 0) AS max_pos FROM columns WHERE board_id = $1',
      [boardId],
    );
    const position = maxRows[0].max_pos + 1000;

    const { rows } = await dbQuery(
      `INSERT INTO columns (board_id, title, position, color, wip_limit)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [boardId, title.trim(), position, color || null, wip_limit ?? null],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    sendServerError(res, err, 'POST /boards/:boardId/columns');
  }
});

// ─── PATCH /columns/:id ─────────────────────────────────────────────────────
router.patch('/columns/:id', async (req, res) => {
  try {
    const columnId = req.params.id;
    const { title, color, wip_limit } = req.body;

    // Find the column and verify board access
    const { rows: colRows } = await dbQuery(
      'SELECT c.*, b.id AS b_id, b.scope_type, b.scope_ref, b.created_by FROM columns c JOIN boards b ON b.id = c.board_id WHERE c.id = $1',
      [columnId],
    );
    if (colRows.length === 0) return sendNotFound(res, 'Column');

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (color !== undefined) updates.color = color;
    if (wip_limit !== undefined) updates.wip_limit = wip_limit;

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
    values.push(columnId);

    const { rows } = await dbQuery(
      `UPDATE columns SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    );

    res.json(rows[0]);
  } catch (err) {
    sendServerError(res, err, 'PATCH /columns/:id');
  }
});

// ─── DELETE /columns/:id ────────────────────────────────────────────────────
router.delete('/columns/:id', async (req, res) => {
  try {
    const columnId = req.params.id;

    const { rows: colRows } = await dbQuery(
      'SELECT * FROM columns WHERE id = $1',
      [columnId],
    );
    if (colRows.length === 0) return sendNotFound(res, 'Column');
    const column = colRows[0];

    await dbTransaction(async (client) => {
      // Check if other columns exist
      const { rows: otherCols } = await client.query(
        'SELECT id, position FROM columns WHERE board_id = $1 AND id != $2 ORDER BY position ASC',
        [column.board_id, columnId],
      );

      if (otherCols.length > 0) {
        // Find previous column by position (or first if none before)
        const prevCols = otherCols.filter((c: any) => c.position < column.position);
        const targetCol = prevCols.length > 0 ? prevCols[prevCols.length - 1] : otherCols[0];

        // Move cards to target column
        await client.query(
          'UPDATE cards SET column_id = $1 WHERE column_id = $2',
          [targetCol.id, columnId],
        );
      } else {
        // Last column — delete cards too
        await client.query('DELETE FROM cards WHERE column_id = $1', [columnId]);
      }

      await client.query('DELETE FROM columns WHERE id = $1', [columnId]);
    });

    res.status(204).send();
  } catch (err) {
    sendServerError(res, err, 'DELETE /columns/:id');
  }
});

// ─── POST /boards/:boardId/columns/reorder ──────────────────────────────────
router.post('/boards/:boardId/columns/reorder', requireBoardAccess('boardId'), async (req, res) => {
  try {
    const { column_ids } = req.body;

    if (!Array.isArray(column_ids) || column_ids.length === 0) {
      return res.status(400).json({ error: { message: 'column_ids array is required' } });
    }

    await dbTransaction(async (client) => {
      for (let i = 0; i < column_ids.length; i++) {
        await client.query(
          'UPDATE columns SET position = $1 WHERE id = $2',
          [(i + 1) * 1000, column_ids[i]],
        );
      }
    });

    res.json({ success: true });
  } catch (err) {
    sendServerError(res, err, 'POST /boards/:boardId/columns/reorder');
  }
});

export default router;
