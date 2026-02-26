import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

interface CacheEntry {
  body: any;
  statusCode: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCacheKey(req: Request): string {
  return req.originalUrl || req.url;
}

/**
 * Express middleware that caches JSON responses for GET requests.
 * Responses are keyed by the full request URL (including query params).
 */
export function cacheMiddleware(ttlOverride?: number) {
  const ttlMs = (ttlOverride ?? config.cacheTtl) * 1000;

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();

    const key = getCacheKey(req);
    const entry = cache.get(key);

    if (entry && entry.expiresAt > Date.now()) {
      res.set('X-Cache', 'HIT');
      return res.status(entry.statusCode).json(entry.body);
    }

    // Intercept res.json to capture the response body for caching
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          body,
          statusCode: res.statusCode,
          expiresAt: Date.now() + ttlMs,
        });
      }
      res.set('X-Cache', 'MISS');
      return originalJson(body);
    } as Response['json'];

    next();
  };
}

/**
 * Clear cache entries. If a pattern is provided, only entries whose key
 * contains the pattern string are removed. Otherwise the entire cache is cleared.
 */
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    const size = cache.size;
    cache.clear();
    if (size > 0) logger.debug({ cleared: size }, 'Cache cleared');
    return;
  }

  let removed = 0;
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      removed++;
    }
  }
  if (removed > 0) logger.debug({ pattern, removed }, 'Cache entries invalidated');
}

/** Expose cache size for testing/monitoring. */
export function cacheSize(): number {
  return cache.size;
}
