import { Router } from 'express';
import authRoutes from './auth.js';
import { requireAuth } from '../middleware/auth.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';

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

export default router;
