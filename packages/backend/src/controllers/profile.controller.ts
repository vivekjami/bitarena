import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { UserCache } from '../services/redis.service';

export class ProfileController {
  /**
   * GET /api/profile/:address
   * Get user profile and match history
   */
  static async get(req: AuthRequest, res: Response): Promise<void> {
    const { address } = req.params;

    // Check cache first
    const cached = await UserCache.get(address);
    if (cached) {
      res.json(cached);
      return;
    }

    // Get user profile
    const userResult = await db.query(
      'SELECT * FROM users WHERE address = $1',
      [address]
    );

    if (userResult.rows.length === 0) {
      throw createError.notFound('User not found');
    }

    const user = userResult.rows[0];

    // Get last 50 matches
    const matchesResult = await db.query(
      `SELECT * FROM user_match_history 
       WHERE player_address = $1 
       ORDER BY match_date DESC 
       LIMIT 50`,
      [address]
    );

    const profile = {
      user: {
        address: user.address,
        passportId: user.passport_id,
        username: user.username,
        eloRating: user.elo_rating,
        stats: {
          totalMatches: user.total_matches,
          wins: user.wins,
          losses: user.losses,
          totalWagered: user.total_wagered,
          totalWinnings: user.total_winnings,
        },
        createdAt: user.created_at,
      },
      recentMatches: matchesResult.rows,
    };

    // Cache for 5 minutes
    await UserCache.set(address, profile);

    res.json(profile);
  }
}
