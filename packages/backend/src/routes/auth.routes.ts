import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

/**
 * POST /api/auth/passport
 * Exchange Mezo Passport authorization code for JWT
 */
router.post('/passport', asyncHandler(AuthController.passport));

/**
 * POST /api/auth/wallet
 * Authenticate with wallet address (simplified for testing)
 */
router.post('/wallet', asyncHandler(AuthController.wallet));

/**
 * POST /api/auth/logout
 * Destroy session
 */
router.post('/logout', asyncHandler(AuthController.logout));

export default router;
