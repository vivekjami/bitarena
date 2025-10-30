import { ProjectileDuelEngine } from './ProjectileDuel';
import { GravityPaintersEngine } from './GravityPainters';
import { db } from '../config/database';

/**
 * Game types
 */
export enum GameType {
  PROJECTILE_DUEL = 'ProjectileDuel',
  GRAVITY_PAINTERS = 'GravityPainters',
}

/**
 * Match state
 */
interface Match {
  id: string;
  gameType: GameType;
  engine: ProjectileDuelEngine | GravityPaintersEngine;
  playerAddresses: string[];
  startTime: number;
  lastUpdateTime: number;
  tickRate: number;
  isActive: boolean;
}

/**
 * Game Server - Manages all active matches with 60 Hz simulation
 */
export class GameServer {
  private matches: Map<string, Match>;
  private tickRate: number;
  private tickInterval: number;
  private serverLoopId: NodeJS.Timeout | null;

  constructor(tickRate: number = 60) {
    this.matches = new Map();
    this.tickRate = tickRate;
    this.tickInterval = 1000 / tickRate; // 16.67ms for 60 Hz
    this.serverLoopId = null;
  }

  /**
   * Start the game server loop
   */
  public start(): void {
    if (this.serverLoopId) return;

    console.log(`🎮 Game Server starting at ${this.tickRate} Hz (${this.tickInterval.toFixed(2)}ms per tick)`);

    this.serverLoopId = setInterval(() => {
      this.tick();
    }, this.tickInterval);
  }

  /**
   * Stop the game server loop
   */
  public stop(): void {
    if (this.serverLoopId) {
      clearInterval(this.serverLoopId);
      this.serverLoopId = null;
      console.log('🛑 Game Server stopped');
    }
  }

  /**
   * Main server tick (60 Hz)
   */
  private tick(): void {
    const now = Date.now();

    this.matches.forEach((match) => {
      if (!match.isActive) return;

      // Calculate delta time (should be ~0.0167s for 60 Hz)
      const deltaTime = (now - match.lastUpdateTime) / 1000;
      match.lastUpdateTime = now;

      // Update game engine
      match.engine.update(deltaTime);

      // Check win conditions
      const result = match.engine.checkWinCondition();
      if (result.winner) {
        this.endMatch(match, result.winner, result.reason);
      }

      // Broadcast game state to clients (handled by WebSocket in index.ts)
      this.broadcastState(match);
    });
  }

  /**
   * Create a new match
   */
  public createMatch(
    matchId: string,
    gameType: GameType,
    playerAddresses: string[],
    seed: number = Date.now()
  ): void {
    if (this.matches.has(matchId)) {
      throw new Error(`Match ${matchId} already exists`);
    }

    let engine: ProjectileDuelEngine | GravityPaintersEngine;

    switch (gameType) {
      case GameType.PROJECTILE_DUEL:
        engine = new ProjectileDuelEngine(seed, playerAddresses);
        break;
      case GameType.GRAVITY_PAINTERS:
        engine = new GravityPaintersEngine(seed, playerAddresses);
        break;
      default:
        throw new Error(`Unknown game type: ${gameType}`);
    }

    const match: Match = {
      id: matchId,
      gameType,
      engine,
      playerAddresses,
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      tickRate: this.tickRate,
      isActive: true,
    };

    this.matches.set(matchId, match);

    console.log(`✅ Match ${matchId} created (${gameType}, ${playerAddresses.length} players)`);

    // Log match start to database
    this.logGameEvent(matchId, 'match_start', {
      gameType,
      players: playerAddresses,
      seed,
    });
  }

  /**
   * Handle player input
   */
  public handlePlayerInput(matchId: string, playerId: string, input: unknown): void {
    const match = this.matches.get(matchId);
    if (!match || !match.isActive) return;

    // Validate player is in match
    if (!match.playerAddresses.includes(playerId)) {
      console.warn(`Player ${playerId} not in match ${matchId}`);
      return;
    }

    // Pass input to engine
    if ('handleInput' in match.engine) {
      match.engine.handleInput(playerId, input as Parameters<typeof match.engine.handleInput>[1]);
    }

    // Log input to database for replay
    this.logGameEvent(matchId, 'player_input', {
      playerId,
      input,
      timestamp: Date.now(),
    });
  }

  /**
   * End a match
   */
  private async endMatch(match: Match, winner: string, reason: string): Promise<void> {
    match.isActive = false;

    console.log(`🏁 Match ${match.id} ended. Winner: ${winner} (${reason})`);

    // Get final game state
    const finalState = match.engine.getState();

    // Log match end
    await this.logGameEvent(match.id, 'match_end', {
      winner,
      reason,
      duration: (Date.now() - match.startTime) / 1000,
      finalState,
    });

    // Update database
    await db.query(
      'UPDATE matches SET status = $1, winner_address = $2, ended_at = NOW() WHERE id = $3',
      ['completed', winner, match.id]
    );

    // Notify oracle service
    this.notifyOracleService(match.id, winner, finalState);

    // Clean up match after 5 minutes
    setTimeout(() => {
      this.matches.delete(match.id);
      console.log(`🗑️  Match ${match.id} cleaned up`);
    }, 5 * 60 * 1000);
  }

  /**
   * Broadcast game state to WebSocket clients
   */
  private broadcastState(match: Match): void {
    const state = match.engine.getState();
    
    // Access global io instance
    const globalObj = global as { io?: { to: (room: string) => { emit: (event: string, data: unknown) => void } } };
    if (globalObj.io) {
      globalObj.io.to(`match:${match.id}`).emit('game-state', {
        matchId: match.id,
        state,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Log game event to database
   */
  private async logGameEvent(matchId: string, eventType: string, eventData: unknown): Promise<void> {
    try {
      // Determine partition (YYYY-MM format)
      const now = new Date();
      const partition = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      await db.query(
        `INSERT INTO game_logs_${partition} (match_id, event_type, event_data, timestamp)
         VALUES ($1, $2, $3, NOW())`,
        [matchId, eventType, JSON.stringify(eventData)]
      );
    } catch (error) {
      console.error('Failed to log game event:', error);
    }
  }

  /**
   * Notify oracle service of match completion
   */
  private notifyOracleService(matchId: string, winner: string, finalState: unknown): void {
    // Import dynamically to avoid circular dependency
    import('./OracleService').then(({ oracleService }) => {
      oracleService.submitResult(matchId, winner, finalState);
    }).catch((err) => {
      console.error('Failed to notify oracle service:', err);
    });
  }

  /**
   * Get match state
   */
  public getMatch(matchId: string): Match | undefined {
    return this.matches.get(matchId);
  }

  /**
   * Get all active matches
   */
  public getActiveMatches(): Match[] {
    return Array.from(this.matches.values()).filter((m) => m.isActive);
  }

  /**
   * Force end a match (for testing or admin)
   */
  public async forceEndMatch(matchId: string, winner: string): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    await this.endMatch(match, winner, 'forced');
  }
}

// Export singleton instance
export const gameServer = new GameServer(60);
