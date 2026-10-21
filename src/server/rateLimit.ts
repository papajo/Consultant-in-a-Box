import type { Request, Response, NextFunction } from 'express';

/**
 * Minimal fixed-window rate limiter keyed by client IP.
 * In-memory: on serverless each warm instance keeps its own counters, so this
 * is a best-effort guard against casual abuse, not a hard global quota.
 */
export function rateLimit({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'POST') return next();
    const now = Date.now();
    const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const key = fwd || req.ip || 'unknown';

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count++;

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    if (entry.count > max) {
      const retry = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({ error: `Demo limit reached (${max} per hour). Try again in ${Math.ceil(retry / 60)} min.` });
    }

    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    next();
  };
}
