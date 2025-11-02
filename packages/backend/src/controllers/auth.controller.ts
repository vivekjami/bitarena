import { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';
import { db } from '../config/database';
import { generateToken, createSession, destroySession } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

export class AuthController {
  /**
   * POST /api/auth/passport
   * Exchange Mezo Passport authorization code for JWT
   */
  static async passport(req: Request, res: Response): Promise<void> {
    const { code } = req.body;

    if (!code) {
      throw createError.badRequest('Authorization code required');
    }

    try {
      // Exchange code for access token with Mezo Passport
      const tokenResponse = await axios.post(
        `${config.mezo.apiUrl}/oauth/token`,
        {
          grant_type: 'authorization_code',
          code,
          client_id: config.mezo.clientId,
          client_secret: config.mezo.clientSecret,
          redirect_uri: config.mezo.redirectUri,
        }
      );

      const { access_token } = tokenResponse.data;

      // Get user info from Mezo Passport
      const userResponse = await axios.get(
        `${config.mezo.apiUrl}/api/v1/user`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      const { passport_id, wallet_address } = userResponse.data;

      // Check if user exists
      let user = await db.query(
        'SELECT * FROM users WHERE address = $1',
        [wallet_address]
      );

      // Create user if doesn't exist
      if (user.rows.length === 0) {
        user = await db.query(
          `INSERT INTO users (address, passport_id, elo_rating)
           VALUES ($1, $2, 1500)
           RETURNING *`,
          [wallet_address, passport_id]
        );
      }

      const userData = user.rows[0];

      // Generate JWT
      const token = generateToken({
        address: userData.address,
        passportId: userData.passport_id,
      });

      // Store session in Redis
      await createSession(token, {
        address: userData.address,
        passportId: userData.passport_id,
      });

      // Set httpOnly cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        user: {
          address: userData.address,
          passportId: userData.passport_id,
          username: userData.username,
          eloRating: userData.elo_rating,
          stats: {
            totalMatches: userData.total_matches,
            wins: userData.wins,
            losses: userData.losses,
            totalWagered: userData.total_wagered,
            totalWinnings: userData.total_winnings,
          },
        },
      });
    } catch (error) {
      console.error('Passport auth error:', error);
      throw createError.unauthorized('Failed to authenticate with Mezo Passport');
    }
  }

  /**
   * POST /api/auth/wallet
   * Authenticate with wallet signature
   */
  static async wallet(req: Request, res: Response): Promise<void> {
    const { address } = req.body;

    if (!address) {
      throw createError.badRequest('Wallet address required');
    }

    try {
      // Normalize address to lowercase
      const normalizedAddress = address.toLowerCase();

      // Check if user exists
      let user = await db.query(
        'SELECT * FROM users WHERE address = $1',
        [normalizedAddress]
      );

      // Create user if doesn't exist
      if (user.rows.length === 0) {
        user = await db.query(
          `INSERT INTO users (address, elo_rating)
           VALUES ($1, 1500)
           RETURNING *`,
          [normalizedAddress]
        );
      }

      const userData = user.rows[0];

      // Generate JWT (without passport_id for wallet-only auth)
      const token = generateToken({
        address: userData.address,
        passportId: userData.passport_id || 'wallet-' + normalizedAddress.slice(0, 10),
      });

      // Store session in Redis
      await createSession(token, {
        address: userData.address,
        passportId: userData.passport_id || 'wallet-' + normalizedAddress.slice(0, 10),
      });

      // Set httpOnly cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        token, // Also return token for frontend to store
        user: {
          address: userData.address,
          username: userData.username,
          eloRating: userData.elo_rating,
          totalMatches: userData.total_matches || 0,
          wins: userData.wins || 0,
          totalWagered: userData.total_wagered || '0',
          totalWinnings: userData.total_winnings || '0',
        },
      });
    } catch (error) {
      console.error('Wallet auth error:', error);
      throw createError.unauthorized('Failed to authenticate with wallet');
    }
  }

  /**
   * POST /api/auth/logout
   * Destroy session
   */
  static async logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies.auth_token;

    if (token) {
      await destroySession(token);
    }

    res.clearCookie('auth_token');
    res.json({ message: 'Logged out successfully' });
  }
}
