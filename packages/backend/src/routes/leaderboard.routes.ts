import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
import { LeaderboardController } from '../controllers/leaderboard.controller';

const router = Router();

/**
 * GET /api/leaderboard
 * Get top players by ELO (public, cached)
 */
router.get('/', optionalAuth, asyncHandler(LeaderboardController.get));

export default router;
