import { Pool, PoolConfig } from 'pg';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Database connection pool configuration
const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bitarena',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum 20 connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// PostgreSQL connection pool
export const db = new Pool(poolConfig);

// Test database connection
db.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

db.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
  process.exit(1);
});

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
};

// Redis client
export const redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

// Redis key prefixes
export const REDIS_KEYS = {
  SESSION: (token: string) => `session:${token}`,
  USER: (address: string) => `user:${address}`,
  MATCH: (matchId: string) => `match:${matchId}`,
  LEADERBOARD: 'leaderboard',
  MATCHMAKING_QUEUE: (gameType: string) => `matchmaking:${gameType}`,
  RATE_LIMIT: (identifier: string) => `ratelimit:${identifier}`,
};

// Redis TTLs (in seconds)
export const REDIS_TTL = {
  SESSION: 24 * 60 * 60, // 24 hours
  USER_CACHE: 5 * 60, // 5 minutes
  MATCH_CACHE: 60, // 1 minute
  LEADERBOARD: 5 * 60, // 5 minutes
  RATE_LIMIT_WINDOW: 60, // 1 minute
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await db.end();
  await redis.quit();
  process.exit(0);
});
