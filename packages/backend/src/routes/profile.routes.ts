import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
import { ProfileController } from '../controllers/profile.controller';

const router = Router();

/**
 * GET /api/profile/:address
 * Get user profile and stats (public)
 */
router.get('/:address', optionalAuth, asyncHandler(ProfileController.get));

export default router;
