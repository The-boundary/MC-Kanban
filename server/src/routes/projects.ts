import { Router } from 'express';
import { dbQueryRaw } from '../services/supabase.js';
import { sendServerError } from '../utils/route-helpers.js';

const router = Router();

// ─── GET /projects ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const userEmail = (req.user!.email || '').toLowerCase();
    const isAdmin = req.user!.appAccess?.is_admin === true;

    let rows;

    if (isAdmin) {
      // Admins see all active workspaces
      const result = await dbQueryRaw(
        `SELECT kantata_id, title, description, status, start_date, due_date, archived
         FROM traffic_light.kantata_workspaces
         WHERE is_current = true AND archived = false
         ORDER BY title`,
      );
      rows = result.rows;
    } else {
      // Non-admins see workspaces where they are a resource or primary maven
      const result = await dbQueryRaw(
        `SELECT DISTINCT w.kantata_id, w.title, w.description, w.status, w.start_date, w.due_date, w.archived
         FROM traffic_light.kantata_workspaces w
         LEFT JOIN traffic_light.kantata_workspace_resources wr
           ON wr.workspace_id = w.kantata_id AND wr.is_current = true
         LEFT JOIN traffic_light.kantata_users u_res
           ON u_res.kantata_id = wr.user_id AND u_res.is_current = true
         LEFT JOIN traffic_light.kantata_users u_pm
           ON u_pm.kantata_id = w.primary_maven_id AND u_pm.is_current = true
         WHERE w.is_current = true AND w.archived = false
           AND (lower(u_res.email_address) = $1 OR lower(u_pm.email_address) = $1)
         ORDER BY w.title`,
        [userEmail],
      );
      rows = result.rows;
    }

    res.json(rows);
  } catch (err) {
    sendServerError(res, err, 'GET /projects');
  }
});

export default router;
