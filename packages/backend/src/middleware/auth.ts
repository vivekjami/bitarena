import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { redis, REDIS_KEYS, REDIS_TTL } from '../config/database';

export interface AuthUser {
  address: string;
  passportId: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Authentication middleware
 * Extracts and verifies JWT from httpOnly cookie
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract JWT from cookie
    const token = req.cookies?.auth_token;
    
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if token is in Redis (session management)
    const sessionKey = REDIS_KEYS.SESSION(token);
    const sessionData = await redis.get(sessionKey);
    
    if (!sessionData) {
      res.status(401).json({ error: 'Session expired' });
      return;
    }

    // Verify JWT signature
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
      
      // Attach user to request
      req.user = {
        address: decoded.address,
        passportId: decoded.passportId,
      };
      
      // Refresh session TTL
      await redis.expire(sessionKey, REDIS_TTL.SESSION);
      
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token exists, but doesn't require it
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies?.auth_token;
  
  if (!token) {
    next();
    return;
  }

  try {
    const sessionKey = REDIS_KEYS.SESSION(token);
    const sessionData = await redis.get(sessionKey);
    
    if (sessionData) {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
      req.user = decoded;
      await redis.expire(sessionKey, REDIS_TTL.SESSION);
    }
  } catch (err) {
    // Silently fail for optional auth
  }
  
  next();
};

/**
 * Generate JWT token for user
 */
export const generateToken = (user: AuthUser): string => {
  const payload = {
    address: user.address,
    passportId: user.passportId,
  };
  
  return jwt.sign(payload, config.jwt.secret, { 
    expiresIn: '24h' 
  });
};

/**
 * Store session in Redis
 */
export const createSession = async (token: string, user: AuthUser): Promise<void> => {
  const sessionKey = REDIS_KEYS.SESSION(token);
  await redis.setex(
    sessionKey,
    REDIS_TTL.SESSION,
    JSON.stringify(user)
  );
};

/**
 * Delete session from Redis
 */
export const destroySession = async (token: string): Promise<void> => {
  const sessionKey = REDIS_KEYS.SESSION(token);
  await redis.del(sessionKey);
};

/**
 * Hash token for storage (simple hash)
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
