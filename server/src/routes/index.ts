import { Router } from 'express';
import authRoutes from './auth.js';
import { requireAuth } from '../middleware/auth.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';
import boardRoutes from './boards.js';
import columnRoutes from './columns.js';
import cardRoutes from './cards.js';
import labelRoutes from './labels.js';
import checklistRoutes from './checklists.js';
import commentRoutes from './comments.js';
import memberRoutes from './members.js';
import userRoutes from './users.js';
import projectRoutes from './projects.js';
import appRoutes from './apps.js';
import activityRoutes from './activity.js';
import attachmentRoutes from './attachments.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'kanban',
  });
});

router.use('/auth', authRoutes);
router.use(requireAuth);
router.use(cacheMiddleware());
router.use((req, res, next) => {
  if (req.method !== 'GET') {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) invalidateCache();
    });
  }
  next();
});

router.use('/boards', boardRoutes);
router.use('/', columnRoutes);     // handles /boards/:boardId/columns and /columns/:id
router.use('/', cardRoutes);       // handles /boards/:boardId/cards, /cards/:id, /cards/mine
router.use('/', labelRoutes);      // handles /boards/:boardId/labels, /labels/:id, /cards/:cardId/labels
router.use('/', checklistRoutes);  // handles /cards/:cardId/checklists, /checklists/:id, /checklist-items/:id
router.use('/', commentRoutes);    // handles /cards/:cardId/comments, /comments/:id
router.use('/', memberRoutes);     // handles /boards/:boardId/members
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/apps', appRoutes);
router.use('/', activityRoutes);   // handles /cards/:cardId/activity
router.use('/', attachmentRoutes); // handles /cards/:cardId/attachments, /attachments/:id

export default router;
