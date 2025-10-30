import { Request, Response, NextFunction } from 'express';
import { redis, REDIS_KEYS } from '../config/database';
import { AuthRequest } from './auth';

/**
 * Rate limiting middleware using Redis
 * Implements sliding window counter
 */
export const rateLimiter = (options: {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
}) => {
  const { windowMs, max, keyGenerator } = options;
  
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Generate rate limit key (IP or user address)
      const identifier = keyGenerator 
        ? keyGenerator(req)
        : req.ip || req.socket.remoteAddress || 'unknown';
      
      const key = REDIS_KEYS.RATE_LIMIT(identifier);
      
      // Increment counter
      const current = await redis.incr(key);
      
      // Set expiry on first request
      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }
      
      // Check if limit exceeded
      if (current > max) {
        const ttl = await redis.ttl(key);
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: ttl,
        });
        return;
      }
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', max.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current).toString());
      res.setHeader('X-RateLimit-Reset', Date.now() + (windowMs / 1000));
      
      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open - don't block requests on rate limiter errors
      next();
    }
  };
};

/**
 * Per-user rate limiter
 */
export const userRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest;
    return authReq.user?.address || req.ip || 'anonymous';
  },
});

/**
 * Per-IP rate limiter
 */
export const ipRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
});

/**
 * Stricter rate limiter for expensive operations
 */
export const strictRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest;
    return authReq.user?.address || req.ip || 'anonymous';
  },
});
