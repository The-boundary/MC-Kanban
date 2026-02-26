import type { Request, Response, NextFunction } from 'express';
import { dbQuery, dbQueryRaw } from '../services/supabase.js';
import { sendNotFound } from '../utils/route-helpers.js';

export async function checkBoardAccess(
  userId: string,
  userEmail: string,
  board: { id: string; scope_type: string; scope_ref: string | null; created_by: string },
): Promise<boolean> {
  // DEV_AUTH_BYPASS
  if (process.env.NODE_ENV === 'development' && process.env.DEV_AUTH_BYPASS === 'true') return true;

  switch (board.scope_type) {
    case 'app': {
      const result = await dbQueryRaw(
        `SELECT 1 FROM tower_watch.effective_user_app_access_view
         WHERE user_id = $1 AND app_slug = $2 AND is_active = true`,
        [userId, board.scope_ref],
      );
      return (result.rowCount ?? 0) > 0;
    }
    case 'project': {
      // Must have kanban app access
      const kanbanAccess = await dbQueryRaw(
        `SELECT is_admin FROM tower_watch.effective_user_app_access_view
         WHERE user_id = $1 AND app_slug = 'kanban' AND is_active = true`,
        [userId],
      );
      if ((kanbanAccess.rowCount ?? 0) === 0) return false;

      // Admins can access all project boards
      if (kanbanAccess.rows[0]?.is_admin) return true;

      // Non-admins must be a workspace resource or primary maven
      const workspaceAccess = await dbQueryRaw(
        `SELECT 1 FROM traffic_light.kantata_workspace_resources wr
         JOIN traffic_light.kantata_users u ON u.kantata_id = wr.user_id AND u.is_current = true
         WHERE wr.workspace_id = $1 AND wr.is_current = true AND lower(u.email_address) = $2
         UNION ALL
         SELECT 1 FROM traffic_light.kantata_workspaces w
         JOIN traffic_light.kantata_users u ON u.kantata_id = w.primary_maven_id AND u.is_current = true
         WHERE w.kantata_id = $1 AND w.is_current = true AND lower(u.email_address) = $2`,
        [board.scope_ref, userEmail.toLowerCase()],
      );
      return (workspaceAccess.rowCount ?? 0) > 0;
    }
    case 'personal': {
      if (board.created_by === userId) return true;
      const result = await dbQuery(
        `SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2`,
        [board.id, userId],
      );
      return (result.rowCount ?? 0) > 0;
    }
    default:
      return false;
  }
}

/** Express middleware that loads a board and checks access. */
export function requireBoardAccess(idParam = 'id') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const boardId = req.params[idParam];
    if (!boardId) return sendNotFound(res, 'Board');
    try {
      const { rows } = await dbQuery(
        'SELECT id, scope_type, scope_ref, created_by FROM boards WHERE id = $1',
        [boardId],
      );
      if (rows.length === 0) return sendNotFound(res, 'Board');
      const board = rows[0];
      const hasAccess = await checkBoardAccess(req.user!.id, req.user!.email || '', board);
      if (!hasAccess) return res.status(403).json({ error: { message: 'Access denied' } });
      (req as any).board = board;
      next();
    } catch (err) {
      next(err);
    }
  };
}
