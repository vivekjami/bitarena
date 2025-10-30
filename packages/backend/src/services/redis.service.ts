import { redis, REDIS_KEYS, REDIS_TTL } from '../config/database';

/**
 * Matchmaking queue interface
 */
export interface MatchmakingPlayer {
  address: string;
  elo: number;
  gameType: string;
  timestamp: number;
}

/**
 * Matchmaking service using Redis sorted sets
 * Players are stored with their ELO as score for efficient range queries
 */
export class MatchmakingQueue {
  /**
   * Add player to matchmaking queue
   */
  static async addToQueue(player: MatchmakingPlayer): Promise<void> {
    const key = REDIS_KEYS.MATCHMAKING_QUEUE(player.gameType);
    
    // Store player data as JSON with ELO as score
    const value = JSON.stringify({
      address: player.address,
      timestamp: player.timestamp,
    });
    
    await redis.zadd(key, player.elo, value);
  }

  /**
   * Remove player from matchmaking queue
   */
  static async removeFromQueue(address: string, gameType: string): Promise<void> {
    const key = REDIS_KEYS.MATCHMAKING_QUEUE(gameType);
    
    // Get all members and filter by address
    const members = await redis.zrange(key, 0, -1);
    for (const member of members) {
      const data = JSON.parse(member);
      if (data.address === address) {
        await redis.zrem(key, member);
        break;
      }
    }
  }

  /**
   * Find match for player based on ELO range
   * Returns opponent within ±100 ELO, or null if no match found
   */
  static async findMatch(
    address: string,
    elo: number,
    gameType: string
  ): Promise<string | null> {
    const key = REDIS_KEYS.MATCHMAKING_QUEUE(gameType);
    const eloRange = 100;
    
    // Query players within ELO range
    const candidates = await redis.zrangebyscore(
      key,
      elo - eloRange,
      elo + eloRange
    );
    
    // Filter out self and return first available opponent
    for (const candidate of candidates) {
      const data = JSON.parse(candidate);
      if (data.address !== address) {
        // Remove matched players from queue
        await redis.zrem(key, candidate);
        return data.address;
      }
    }
    
    return null;
  }

  /**
   * Get queue size for game type
   */
  static async getQueueSize(gameType: string): Promise<number> {
    const key = REDIS_KEYS.MATCHMAKING_QUEUE(gameType);
    return await redis.zcard(key);
  }

  /**
   * Clear entire queue (admin use)
   */
  static async clearQueue(gameType: string): Promise<void> {
    const key = REDIS_KEYS.MATCHMAKING_QUEUE(gameType);
    await redis.del(key);
  }
}

/**
 * Leaderboard caching service
 */
export class LeaderboardCache {
  /**
   * Cache leaderboard data
   */
  static async set(leaderboard: unknown[]): Promise<void> {
    const key = REDIS_KEYS.LEADERBOARD;
    await redis.setex(
      key,
      REDIS_TTL.LEADERBOARD,
      JSON.stringify(leaderboard)
    );
  }

  /**
   * Get cached leaderboard
   */
  static async get(): Promise<unknown[] | null> {
    const key = REDIS_KEYS.LEADERBOARD;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Invalidate leaderboard cache
   */
  static async invalidate(): Promise<void> {
    const key = REDIS_KEYS.LEADERBOARD;
    await redis.del(key);
  }
}

/**
 * User cache service
 */
export class UserCache {
  /**
   * Cache user profile data
   */
  static async set(address: string, userData: unknown): Promise<void> {
    const key = REDIS_KEYS.USER(address);
    await redis.setex(
      key,
      REDIS_TTL.USER_CACHE,
      JSON.stringify(userData)
    );
  }

  /**
   * Get cached user profile
   */
  static async get(address: string): Promise<unknown | null> {
    const key = REDIS_KEYS.USER(address);
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Invalidate user cache
   */
  static async invalidate(address: string): Promise<void> {
    const key = REDIS_KEYS.USER(address);
    await redis.del(key);
  }
}

/**
 * Match cache service
 */
export class MatchCache {
  /**
   * Cache match data
   */
  static async set(matchId: string, matchData: unknown): Promise<void> {
    const key = REDIS_KEYS.MATCH(matchId);
    // Active matches expire after 2 hours
    await redis.setex(key, 7200, JSON.stringify(matchData));
  }

  /**
   * Get cached match data
   */
  static async get(matchId: string): Promise<unknown | null> {
    const key = REDIS_KEYS.MATCH(matchId);
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Invalidate match cache
   */
  static async invalidate(matchId: string): Promise<void> {
    const key = REDIS_KEYS.MATCH(matchId);
    await redis.del(key);
  }

  /**
   * Update match state (for active matches)
   */
  static async updateState(matchId: string, state: unknown): Promise<void> {
    const key = `${REDIS_KEYS.MATCH(matchId)}:state`;
    await redis.setex(key, 300, JSON.stringify(state)); // 5 min TTL
  }

  /**
   * Get match state
   */
  static async getState(matchId: string): Promise<unknown | null> {
    const key = `${REDIS_KEYS.MATCH(matchId)}:state`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }
}
