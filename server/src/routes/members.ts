import { Router } from 'express';
import { dbQuery, dbQueryRaw } from '../services/supabase.js';
import { sendServerError, sendNotFound } from '../utils/route-helpers.js';
import { requireBoardAccess } from '../middleware/board-access.js';

const router = Router();

// ─── GET /boards/:boardId/members ────────────────────────────────────────────
router.get('/boards/:boardId/members', requireBoardAccess('boardId'), async (req, res) => {
  try {
    const boardId = req.params.boardId;

    const { rows: members } = await dbQuery(
      'SELECT * FROM board_members WHERE board_id = $1 ORDER BY created_at ASC',
      [boardId],
    );

    // Also include the board creator
    const { rows: boardRows } = await dbQuery(
      'SELECT created_by FROM boards WHERE id = $1',
      [boardId],
    );
    const creatorId = boardRows[0]?.created_by;

    // Gather all user IDs
    const userIds = [...new Set([...members.map((m: any) => m.user_id), creatorId].filter(Boolean))];

    let userMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { rows: users } = await dbQueryRaw(
        `SELECT id, email, display_name, full_name, avatar_url
         FROM tower_watch.users WHERE id = ANY($1)`,
        [userIds],
      );
      for (const u of users) userMap[u.id] = u;
    }

    const enriched = members.map((m: any) => ({
      ...m,
      user: userMap[m.user_id] || null,
    }));

    // Prepend creator as a virtual member (if not already in the list)
    const creatorInList = members.some((m: any) => m.user_id === creatorId);
    if (creatorId && !creatorInList) {
      enriched.unshift({
        board_id: boardId,
        user_id: creatorId,
        added_by: creatorId,
        created_at: boardRows[0]?.created_at,
        user: userMap[creatorId] || null,
        is_creator: true,
      });
    }

    res.json(enriched);
  } catch (err) {
    sendServerError(res, err, 'GET /boards/:boardId/members');
  }
});

// ─── POST /boards/:boardId/members ───────────────────────────────────────────
router.post('/boards/:boardId/members', requireBoardAccess('boardId'), async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const board = (req as any).board;
    const userId = req.user!.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: { message: 'user_id is required' } });
    }

    // Only creator can add members
    if (board.created_by !== userId) {
      return res.status(403).json({ error: { message: 'Only the board creator can add members' } });
    }

    // Only personal boards support explicit members
    if (board.scope_type !== 'personal') {
      return res.status(400).json({ error: { message: 'Members can only be added to personal boards' } });
    }

    const { rows } = await dbQuery(
      `INSERT INTO board_members (board_id, user_id, added_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (board_id, user_id) DO NOTHING
       RETURNING *`,
      [boardId, user_id, userId],
    );

    if (rows.length === 0) {
      return res.status(409).json({ error: { message: 'User is already a member' } });
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    sendServerError(res, err, 'POST /boards/:boardId/members');
  }
});

// ─── DELETE /boards/:boardId/members/:userId ─────────────────────────────────
router.delete('/boards/:boardId/members/:userId', requireBoardAccess('boardId'), async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const targetUserId = req.params.userId;
    const board = (req as any).board;
    const currentUserId = req.user!.id;

    // Only creator can remove members
    if (board.created_by !== currentUserId) {
      return res.status(403).json({ error: { message: 'Only the board creator can remove members' } });
    }

    const result = await dbQuery(
      'DELETE FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, targetUserId],
    );

    if ((result.rowCount ?? 0) === 0) {
      return sendNotFound(res, 'Board member');
    }

    res.status(204).send();
  } catch (err) {
    sendServerError(res, err, 'DELETE /boards/:boardId/members/:userId');
  }
});

export default router;
