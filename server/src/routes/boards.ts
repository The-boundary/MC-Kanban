import { Router } from 'express';
import { dbQuery, dbQueryRaw, dbTransaction } from '../services/supabase.js';
import { sendServerError, sendNotFound } from '../utils/route-helpers.js';
import { requireBoardAccess, checkBoardAccess } from '../middleware/board-access.js';

const router = Router();

const DEFAULT_COLUMNS = [
  { title: 'Backlog', position: 1000, color: '#6b7280' },
  { title: 'To Do', position: 2000, color: '#3b82f6' },
  { title: 'In Progress', position: 3000, color: '#f97316' },
  { title: 'Done', position: 4000, color: '#22c55e' },
];

// ─── GET /boards ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const scope = (req.query.scope as string) || 'all';
    const userId = req.user!.id;
    let whereClause: string;
    let params: any[];

    switch (scope) {
      case 'app':
        whereClause = `b.scope_type = 'app' AND b.is_archived = false`;
        params = [];
        break;
      case 'project':
        whereClause = `b.scope_type = 'project' AND b.is_archived = false`;
        params = [];
        break;
      case 'personal':
        whereClause = `b.scope_type = 'personal' AND b.is_archived = false
          AND (b.created_by = $1 OR EXISTS (
            SELECT 1 FROM board_members bm WHERE bm.board_id = b.id AND bm.user_id = $1
          ))`;
        params = [userId];
        break;
      default: // 'all'
        whereClause = `b.is_archived = false
          AND (
            b.scope_type = 'app'
            OR b.scope_type = 'project'
            OR (b.scope_type = 'personal' AND (
              b.created_by = $1 OR EXISTS (
                SELECT 1 FROM board_members bm WHERE bm.board_id = b.id AND bm.user_id = $1
              )
            ))
          )`;
        params = [userId];
        break;
    }

    const { rows } = await dbQuery(
      `SELECT b.id, b.scope_type, b.scope_ref, b.title, b.description,
              b.created_by, b.is_archived, b.created_at, b.updated_at,
              (SELECT COUNT(*) FROM cards c
               JOIN columns col ON col.id = c.column_id
               WHERE col.board_id = b.id AND c.is_archived = false)::int AS card_count,
              (SELECT COUNT(*) FROM board_members bm WHERE bm.board_id = b.id)::int + 1 AS member_count
       FROM boards b
       WHERE ${whereClause}
       ORDER BY b.updated_at DESC`,
      params,
    );

    res.json(rows);
  } catch (err) {
    sendServerError(res, err, 'GET /boards');
  }
});

// ─── GET /boards/by-scope ────────────────────────────────────────────────────
router.get('/by-scope', async (req, res) => {
  try {
    const scopeType = req.query.scope_type as string;
    const scopeRef = req.query.scope_ref as string;
    const userId = req.user!.id;

    if (!scopeType || !scopeRef) {
      return res.status(400).json({ error: { message: 'scope_type and scope_ref are required' } });
    }

    // Check if board already exists
    const { rows: existing } = await dbQuery(
      'SELECT * FROM boards WHERE scope_type = $1 AND scope_ref = $2 LIMIT 1',
      [scopeType, scopeRef],
    );

    if (existing.length > 0) {
      const board = existing[0];
      // Verify access
      const hasAccess = await checkBoardAccess(userId, req.user!.email || '', board);
      if (!hasAccess) return res.status(403).json({ error: { message: 'Access denied' } });
      return res.json(board);
    }

    // Create new board with default columns
    let title = scopeRef;
    if (scopeType === 'project') {
      const { rows: wsRows } = await dbQueryRaw(
        `SELECT title FROM traffic_light.kantata_workspaces
         WHERE kantata_id = $1 AND is_current = true LIMIT 1`,
        [scopeRef],
      );
      if (wsRows.length > 0) title = wsRows[0].title;
    }

    const board = await dbTransaction(async (client) => {
      const { rows: boardRows } = await client.query(
        `INSERT INTO boards (scope_type, scope_ref, title, created_by)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [scopeType, scopeRef, title, userId],
      );
      const newBoard = boardRows[0];

      for (const col of DEFAULT_COLUMNS) {
        await client.query(
          `INSERT INTO columns (board_id, title, position, color)
           VALUES ($1, $2, $3, $4)`,
          [newBoard.id, col.title, col.position, col.color],
        );
      }

      return newBoard;
    });

    res.status(201).json(board);
  } catch (err) {
    sendServerError(res, err, 'GET /boards/by-scope');
  }
});

// ─── GET /boards/:id ─────────────────────────────────────────────────────────
router.get('/:id', requireBoardAccess(), async (req, res) => {
  try {
    const boardId = req.params.id;

    // 1. Fetch board
    const { rows: boardRows } = await dbQuery('SELECT * FROM boards WHERE id = $1', [boardId]);
    if (boardRows.length === 0) return sendNotFound(res, 'Board');
    const board = boardRows[0];

    // 2. Fetch columns ordered by position
    const { rows: columns } = await dbQuery(
      'SELECT * FROM columns WHERE board_id = $1 ORDER BY position ASC',
      [boardId],
    );

    // 3. Fetch all non-archived cards for the board
    const { rows: cards } = await dbQuery(
      `SELECT c.* FROM cards c
       JOIN columns col ON col.id = c.column_id
       WHERE col.board_id = $1 AND c.is_archived = false
       ORDER BY c.position ASC`,
      [boardId],
    );

    // 4. Fetch labels for the board
    const { rows: labels } = await dbQuery(
      'SELECT * FROM labels WHERE board_id = $1 ORDER BY name ASC',
      [boardId],
    );

    // 5. Fetch card_labels mappings
    const cardIds = cards.map((c: any) => c.id);
    let cardLabelsMap: Record<string, any[]> = {};
    if (cardIds.length > 0) {
      const { rows: cardLabels } = await dbQuery(
        `SELECT cl.card_id, l.id, l.name, l.color, l.board_id
         FROM card_labels cl
         JOIN labels l ON l.id = cl.label_id
         WHERE cl.card_id = ANY($1)`,
        [cardIds],
      );
      for (const cl of cardLabels) {
        if (!cardLabelsMap[cl.card_id]) cardLabelsMap[cl.card_id] = [];
        cardLabelsMap[cl.card_id].push({ id: cl.id, name: cl.name, color: cl.color, board_id: cl.board_id });
      }
    }

    // 6. Fetch checklist progress per card
    let checklistMap: Record<string, { total: number; checked: number }> = {};
    if (cardIds.length > 0) {
      const { rows: checklistCounts } = await dbQuery(
        `SELECT cl.card_id,
                COUNT(ci.id)::int AS total,
                COUNT(ci.id) FILTER (WHERE ci.is_checked = true)::int AS checked
         FROM checklists cl
         LEFT JOIN checklist_items ci ON ci.checklist_id = cl.id
         WHERE cl.card_id = ANY($1)
         GROUP BY cl.card_id`,
        [cardIds],
      );
      for (const cc of checklistCounts) {
        checklistMap[cc.card_id] = { total: cc.total, checked: cc.checked };
      }
    }

    // 7. Fetch comment counts per card
    let commentCountMap: Record<string, number> = {};
    if (cardIds.length > 0) {
      const { rows: commentCounts } = await dbQuery(
        `SELECT card_id, COUNT(*)::int AS count
         FROM comments WHERE card_id = ANY($1)
         GROUP BY card_id`,
        [cardIds],
      );
      for (const cc of commentCounts) {
        commentCountMap[cc.card_id] = cc.count;
      }
    }

    // 8. Fetch attachment counts per card
    let attachmentCountMap: Record<string, number> = {};
    if (cardIds.length > 0) {
      const { rows: attachmentCounts } = await dbQuery(
        `SELECT card_id, COUNT(*)::int AS count
         FROM attachments WHERE card_id = ANY($1)
         GROUP BY card_id`,
        [cardIds],
      );
      for (const ac of attachmentCounts) {
        attachmentCountMap[ac.card_id] = ac.count;
      }
    }

    // 9. Fetch assignee info from tower_watch
    const assigneeIds = [...new Set(cards.map((c: any) => c.assignee_id).filter(Boolean))];
    let assigneeMap: Record<string, any> = {};
    if (assigneeIds.length > 0) {
      const { rows: users } = await dbQueryRaw(
        `SELECT id, email, display_name, full_name, avatar_url
         FROM tower_watch.users WHERE id = ANY($1)`,
        [assigneeIds],
      );
      for (const u of users) {
        assigneeMap[u.id] = u;
      }
    }

    // 10. Assemble nested structure
    const columnMap: Record<string, any> = {};
    for (const col of columns) {
      columnMap[col.id] = { ...col, cards: [] };
    }

    for (const card of cards) {
      const enrichedCard = {
        ...card,
        labels: cardLabelsMap[card.id] || [],
        assignee: card.assignee_id ? assigneeMap[card.assignee_id] || null : null,
        checklist_progress: checklistMap[card.id] || { total: 0, checked: 0 },
        comment_count: commentCountMap[card.id] || 0,
        attachment_count: attachmentCountMap[card.id] || 0,
      };
      if (columnMap[card.column_id]) {
        columnMap[card.column_id].cards.push(enrichedCard);
      }
    }

    board.columns = columns.map((col: any) => columnMap[col.id]);
    board.labels = labels;

    res.json(board);
  } catch (err) {
    sendServerError(res, err, 'GET /boards/:id');
  }
});

// ─── POST /boards ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user!.id;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: { message: 'title is required' } });
    }

    const board = await dbTransaction(async (client) => {
      const { rows: boardRows } = await client.query(
        `INSERT INTO boards (scope_type, title, description, created_by)
         VALUES ('personal', $1, $2, $3) RETURNING *`,
        [title.trim(), description || null, userId],
      );
      const newBoard = boardRows[0];

      for (const col of DEFAULT_COLUMNS) {
        await client.query(
          `INSERT INTO columns (board_id, title, position, color)
           VALUES ($1, $2, $3, $4)`,
          [newBoard.id, col.title, col.position, col.color],
        );
      }

      return newBoard;
    });

    res.status(201).json(board);
  } catch (err) {
    sendServerError(res, err, 'POST /boards');
  }
});

// ─── PATCH /boards/:id ──────────────────────────────────────────────────────
router.patch('/:id', requireBoardAccess(), async (req, res) => {
  try {
    const boardId = req.params.id;
    const board = (req as any).board;
    const { title, description, is_archived } = req.body;

    // Only creator can archive
    if (is_archived !== undefined && board.created_by !== req.user!.id) {
      return res.status(403).json({ error: { message: 'Only the board creator can archive' } });
    }

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (is_archived !== undefined) updates.is_archived = is_archived;

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
    values.push(boardId);

    const { rows } = await dbQuery(
      `UPDATE boards SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    );

    res.json(rows[0]);
  } catch (err) {
    sendServerError(res, err, 'PATCH /boards/:id');
  }
});

// ─── DELETE /boards/:id ──────────────────────────────────────────────────────
router.delete('/:id', requireBoardAccess(), async (req, res) => {
  try {
    const boardId = req.params.id;
    const board = (req as any).board;

    if (board.created_by !== req.user!.id) {
      return res.status(403).json({ error: { message: 'Only the board creator can delete' } });
    }

    await dbQuery('DELETE FROM boards WHERE id = $1', [boardId]);
    res.status(204).send();
  } catch (err) {
    sendServerError(res, err, 'DELETE /boards/:id');
  }
});

export default router;
