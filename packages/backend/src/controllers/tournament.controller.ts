import { Response } from 'express';
import { ethers } from 'ethers';
import { AuthRequest } from '../middleware/auth';
import { db } from '../config/database';
import { config, contracts } from '../config';
import { createError } from '../middleware/errorHandler';

// Helper to ensure contracts are initialized
function ensureContracts() {
  if (!contracts.tournamentPool) {
    throw createError.internal('Tournament contract not initialized');
  }
  return contracts as {
    musdToken: typeof contracts.musdToken;
    matchEscrow: typeof contracts.matchEscrow;
    tournamentPool: NonNullable<typeof contracts.tournamentPool>;
  };
}

export class TournamentController {
  /**
   * GET /api/tournaments
   * Get list of active/upcoming tournaments
   */
  static async list(req: AuthRequest, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT 
        t.*,
        COUNT(tp.player_address) as participant_count
      FROM tournaments t
      LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
      WHERE t.status IN ('registration', 'active')
      GROUP BY t.id
      ORDER BY t.start_time ASC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM tournaments WHERE status IN (\'registration\', \'active\')'
    );

    res.json({
      tournaments: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
      },
    });
  }

  /**
   * GET /api/tournaments/:id
   * Get tournament details with participants
   */
  static async get(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        t.*,
        json_agg(
          json_build_object(
            'address', tp.player_address,
            'registrationOrder', tp.registration_order,
            'currentRound', tp.current_round,
            'eliminated', tp.eliminated
          )
        ) FILTER (WHERE tp.player_address IS NOT NULL) as participants
      FROM tournaments t
      LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
      WHERE t.id = $1
      GROUP BY t.id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw createError.notFound('Tournament not found');
    }

    res.json({ tournament: result.rows[0] });
  }

  /**
   * POST /api/tournaments/:id/register
   * Register for tournament
   */
  static async register(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userAddress = req.user!.address;

    // Ensure contracts initialized
    const { tournamentPool, musdToken } = ensureContracts();
    if (!musdToken) {
      throw createError.internal('MUSD contract not initialized');
    }

    // Get tournament details
    const tournamentResult = await db.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );

    if (tournamentResult.rows.length === 0) {
      throw createError.notFound('Tournament not found');
    }

    const tournament = tournamentResult.rows[0];

    if (tournament.status !== 'registration') {
      throw createError.badRequest('Tournament is not open for registration');
    }

    // Check if already registered
    const participantCheck = await db.query(
      'SELECT * FROM tournament_participants WHERE tournament_id = $1 AND player_address = $2',
      [id, userAddress]
    );

    if (participantCheck.rows.length > 0) {
      throw createError.badRequest('Already registered for this tournament');
    }

    // Check participant count
    const participantCount = await db.query(
      'SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = $1',
      [id]
    );

    if (parseInt(participantCount.rows[0].count) >= tournament.max_players) {
      throw createError.badRequest('Tournament is full');
    }

    // Check user's MUSD balance
    const balance = await musdToken.balanceOf(userAddress);
    const entryFee = ethers.parseUnits(tournament.entry_fee, 18);

    if (balance < entryFee) {
      throw createError.badRequest('Insufficient MUSD balance');
    }

    // Check allowance
    const allowance = await musdToken.allowance(
      userAddress,
      config.blockchain.contracts.tournamentPool
    );

    if (allowance < entryFee) {
      throw createError.badRequest('Insufficient MUSD allowance. Please approve the contract first.');
    }

    // Register on blockchain
    const tx = await tournamentPool.registerPlayer(tournament.contract_tournament_id);
    await tx.wait();

    // Update database
    const registrationOrder = parseInt(participantCount.rows[0].count);
    await db.query(
      `INSERT INTO tournament_participants (tournament_id, player_address, registration_order)
       VALUES ($1, $2, $3)`,
      [id, userAddress, registrationOrder]
    );

    res.json({ message: 'Successfully registered for tournament' });
  }
}
