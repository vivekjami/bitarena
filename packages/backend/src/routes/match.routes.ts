import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, optionalAuth } from '../middleware/auth';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { MatchController } from '../controllers/match.controller';

const router = Router();

/**
 * GET /api/matches
 * Get list of pending matches (public)
 */
router.get('/', optionalAuth, asyncHandler(MatchController.list));

/**
 * POST /api/matches
 * Create new match (authenticated)
 */
router.post(
  '/',
  authenticate,
  strictRateLimiter,
  asyncHandler(MatchController.create)
);

/**
 * GET /api/matches/:id
 * Get match details (public)
 */
router.get('/:id', optionalAuth, asyncHandler(MatchController.get));

/**
 * POST /api/matches/:id/join
 * Join existing match (authenticated)
 */
router.post(
  '/:id/join',
  authenticate,
  strictRateLimiter,
  asyncHandler(MatchController.join)
);

export default router;
