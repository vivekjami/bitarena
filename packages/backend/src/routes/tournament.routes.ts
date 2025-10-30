import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, optionalAuth } from '../middleware/auth';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { TournamentController } from '../controllers/tournament.controller';

const router = Router();

/**
 * GET /api/tournaments
 * Get list of active/upcoming tournaments (public)
 */
router.get('/', optionalAuth, asyncHandler(TournamentController.list));

/**
 * GET /api/tournaments/:id
 * Get tournament details (public)
 */
router.get('/:id', optionalAuth, asyncHandler(TournamentController.get));

/**
 * POST /api/tournaments/:id/register
 * Register for tournament (authenticated)
 */
router.post(
  '/:id/register',
  authenticate,
  strictRateLimiter,
  asyncHandler(TournamentController.register)
);

export default router;
