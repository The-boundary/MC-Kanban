import { Router } from 'express';
import { dbQueryRaw } from '../services/supabase.js';
import { sendServerError } from '../utils/route-helpers.js';

const router = Router();

// ─── GET /users ──────────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const { rows } = await dbQueryRaw(
      `SELECT DISTINCT u.id, u.email, u.display_name, u.full_name, u.avatar_url
       FROM tower_watch.users u
       JOIN tower_watch.effective_user_app_access_view e ON u.id = e.user_id
       WHERE e.app_slug = 'kanban' AND e.is_active = true AND u.is_active = true
       ORDER BY COALESCE(u.display_name, u.email)`,
    );

    res.json(rows);
  } catch (err) {
    sendServerError(res, err, 'GET /users');
  }
});

export default router;
