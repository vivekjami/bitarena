import { Response } from 'express';
import { ethers } from 'ethers';
import { AuthRequest } from '../middleware/auth';
import { db } from '../config/database';
import { config, contracts } from '../config';
import { createError } from '../middleware/errorHandler';
import { MatchCache } from '../services/redis.service';

// Helper to ensure contracts are initialized
function ensureContracts() {
  if (!contracts.musdToken || !contracts.matchEscrow) {
    throw createError.internal('Blockchain contracts not initialized');
  }
  return contracts as {
    musdToken: NonNullable<typeof contracts.musdToken>;
    matchEscrow: NonNullable<typeof contracts.matchEscrow>;
    tournamentPool: typeof contracts.tournamentPool;
  };
}

export class MatchController {
  /**
   * GET /api/matches
   * Get list of pending matches
   */
  static async list(req: AuthRequest, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const gameType = req.query.gameType as string;

    let query = `
      SELECT 
        m.*,
        COUNT(mp.*) as player_count
      FROM matches m
      LEFT JOIN match_players mp ON m.id = mp.match_id
      WHERE m.status = 'pending'
    `;
    const params: unknown[] = [];

    if (gameType) {
      params.push(gameType);
      query += ` AND m.game_type = $${params.length}`;
    }

    query += `
      GROUP BY m.id
      ORDER BY m.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM matches WHERE status = \'pending\'';
    if (gameType) {
      countQuery += ' AND game_type = $1';
    }
    const countResult = await db.query(
      countQuery,
      gameType ? [gameType] : []
    );

    res.json({
      matches: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
      },
    });
  }

  /**
   * POST /api/matches
   * Create new match
   */
  static async create(req: AuthRequest, res: Response): Promise<void> {
    const { gameType, stakeAmount } = req.body;
    const userAddress = req.user!.address;

    // Validate inputs
    if (!gameType || !['ProjectileDuel', 'GravityPainters'].includes(gameType)) {
      throw createError.badRequest('Invalid game type');
    }

    if (!stakeAmount || stakeAmount <= 0) {
      throw createError.badRequest('Invalid stake amount');
    }

    // Ensure contracts are initialized
    const { musdToken, matchEscrow } = ensureContracts();

    // Check user's MUSD balance
    const balance = await musdToken.balanceOf(userAddress);
    const stake = ethers.parseUnits(stakeAmount.toString(), 18);

    if (balance < stake) {
      throw createError.badRequest('Insufficient MUSD balance');
    }

    // Check allowance
    const allowance = await musdToken.allowance(
      userAddress,
      config.blockchain.contracts.matchEscrow
    );

    if (allowance < stake) {
      throw createError.badRequest('Insufficient MUSD allowance. Please approve the contract first.');
    }

    // Create match on blockchain
    const tx = await matchEscrow.createMatch(stake);
    const receipt = await tx.wait();

    // Get match ID from event
    const event = receipt?.logs.find(
      (log: ethers.Log) => log.topics[0] === ethers.id('MatchCreated(uint256,address,uint256)')
    );
    
    if (!event) {
      throw createError.internal('Failed to create match on blockchain');
    }

    const contractMatchId = ethers.toNumber((event as ethers.EventLog).args[0]);

    // Insert into database
    const result = await db.query(
      `INSERT INTO matches (contract_match_id, game_type, stake_amount, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [contractMatchId, gameType, stakeAmount]
    );

    const match = result.rows[0];

    // Add creator as first player
    await db.query(
      `INSERT INTO match_players (match_id, player_address, join_order)
       VALUES ($1, $2, 0)`,
      [match.id, userAddress]
    );

    res.status(201).json({ match });
  }

  /**
   * GET /api/matches/:id
   * Get match details
   */
  static async get(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    // Check cache first
    const cached = await MatchCache.get(id);
    if (cached) {
      res.json({ match: cached });
      return;
    }

    // Query database
    const result = await db.query(
      `SELECT 
        m.*,
        json_agg(
          json_build_object(
            'address', mp.player_address,
            'joinOrder', mp.join_order,
            'score', mp.final_score
          )
        ) as players
      FROM matches m
      LEFT JOIN match_players mp ON m.id = mp.match_id
      WHERE m.id = $1
      GROUP BY m.id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw createError.notFound('Match not found');
    }

    const match = result.rows[0];

    // Cache for 5 minutes
    await MatchCache.set(id, match);

    res.json({ match });
  }

  /**
   * POST /api/matches/:id/join
   * Join existing match
   */
  static async join(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userAddress = req.user!.address;

    // Get match details
    const matchResult = await db.query(
      'SELECT * FROM matches WHERE id = $1',
      [id]
    );

    if (matchResult.rows.length === 0) {
      throw createError.notFound('Match not found');
    }

    const match = matchResult.rows[0];

    if (match.status !== 'pending') {
      throw createError.badRequest('Match is not available to join');
    }

    // Check if user already in match
    const playerCheck = await db.query(
      'SELECT * FROM match_players WHERE match_id = $1 AND player_address = $2',
      [id, userAddress]
    );

    if (playerCheck.rows.length > 0) {
      throw createError.badRequest('Already joined this match');
    }

    // Check player count
    const playerCount = await db.query(
      'SELECT COUNT(*) FROM match_players WHERE match_id = $1',
      [id]
    );

    if (parseInt(playerCount.rows[0].count) >= 2) {
      throw createError.badRequest('Match is full');
    }

    // Ensure contracts are initialized
    const { musdToken, matchEscrow } = ensureContracts();

    // Check user's MUSD balance
    const balance = await musdToken.balanceOf(userAddress);
    const stake = ethers.parseUnits(match.stake_amount, 18);

    if (balance < stake) {
      throw createError.badRequest('Insufficient MUSD balance');
    }

    // Check allowance
    const allowance = await musdToken.allowance(
      userAddress,
      config.blockchain.contracts.matchEscrow
    );

    if (allowance < stake) {
      throw createError.badRequest('Insufficient MUSD allowance. Please approve the contract first.');
    }

    // Join match on blockchain
    const tx = await matchEscrow.joinMatch(match.contract_match_id);
    await tx.wait();

    // Update database
    await db.query(
      `INSERT INTO match_players (match_id, player_address, join_order)
       VALUES ($1, $2, 1)`,
      [id, userAddress]
    );

    await db.query(
      'UPDATE matches SET status = \'active\' WHERE id = $1',
      [id]
    );

    // Invalidate cache
    await MatchCache.invalidate(id);

    res.json({ message: 'Successfully joined match' });
  }
}
