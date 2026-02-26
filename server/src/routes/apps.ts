import { Router } from 'express';
import { dbQueryRaw } from '../services/supabase.js';
import { sendServerError } from '../utils/route-helpers.js';

const router = Router();

// ─── GET /apps ───────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.id;

    const { rows } = await dbQueryRaw(
      `SELECT DISTINCT a.slug, a.name
       FROM tower_watch.apps a
       JOIN tower_watch.effective_user_app_access_view e ON a.id = e.app_id
       WHERE e.user_id = $1 AND e.is_active = true AND a.is_active = true
       ORDER BY a.name`,
      [userId],
    );

    res.json(rows);
  } catch (err) {
    sendServerError(res, err, 'GET /apps');
  }
});

export default router;
