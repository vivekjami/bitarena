import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../config/database';
import { LeaderboardCache } from '../services/redis.service';

export class LeaderboardController {
  /**
   * GET /api/leaderboard
   * Get top 100 players by ELO (cached)
   */
  static async get(_req: AuthRequest, res: Response): Promise<void> {
    // Check cache first
    const cached = await LeaderboardCache.get();
    if (cached) {
      res.json({ leaderboard: cached });
      return;
    }

    // Query from database view
    const result = await db.query('SELECT * FROM leaderboard LIMIT 100');

    const leaderboard = result.rows;

    // Cache for 5 minutes
    await LeaderboardCache.set(leaderboard);

    res.json({ leaderboard });
  }
}
