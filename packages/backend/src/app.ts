import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { ipRateLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/auth.routes';
import matchRoutes from './routes/match.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import profileRoutes from './routes/profile.routes';
import tournamentRoutes from './routes/tournament.routes';

/**
 * Create Express application
 */
export const createApp = (): express.Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  
  // CORS configuration
  app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  }));

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Rate limiting
  app.use(ipRateLimiter);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/tournaments', tournamentRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};
