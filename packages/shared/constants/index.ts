/**
 * Shared constants for BitArena
 * Configuration values and constants used across the application
 */

export const GAME_CONFIG = {
  PROJECTILE_DUEL: {
    ARENA_WIDTH: 1600,
    ARENA_HEIGHT: 1200,
    PLAYER_RADIUS: 20,
    MAX_PLAYERS: 2,
    MATCH_DURATION: 180, // seconds
  },
  GRAVITY_PAINTERS: {
    CANVAS_WIDTH: 1920,
    CANVAS_HEIGHT: 1080,
    MAX_PLAYERS: 10,
    MATCH_DURATION: 180, // seconds
  },
} as const;

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  MATCHES: '/api/matches',
  TOURNAMENTS: '/api/tournaments',
  LEADERBOARD: '/api/leaderboard',
  PROFILE: '/api/profile',
} as const;
