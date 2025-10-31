/**
 * Shared type definitions for BitArena frontend
 */

// Game types
export enum GameType {
  PROJECTILE_DUEL = 'ProjectileDuel',
  GRAVITY_PAINTERS = 'GravityPainters',
}

// Match status
export enum MatchStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
}

// User interface
export interface User {
  address: string;
  username?: string;
  eloRating: number;
  totalMatches: number;
  wins: number;
  totalWagered: string;
  totalWinnings: string;
}

// Match interface
export interface Match {
  id: string;
  gameType: GameType;
  stakeAmount: string;
  maxPlayers: number;
  status: MatchStatus;
  contractMatchId?: number;
  playerCount?: number;
  players?: MatchPlayer[];
  winnerAddress?: string;
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

// Match player
export interface MatchPlayer {
  address: string;
  joinOrder: number;
  score?: number;
}

// Tournament interface
export interface Tournament {
  id: string;
  name: string;
  entryFee: string;
  prizePool: string;
  maxPlayers: number;
  currentPlayers: number;
  status: 'registration' | 'active' | 'completed' | 'cancelled';
  prizeDistribution: number[];
  startTime?: string;
  createdAt: string;
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  address: string;
  username?: string;
  eloRating: number;
  wins: number;
  totalMatches: number;
  winRate: number;
}

// Game state types
export interface Vector2 {
  x: number;
  y: number;
}

// ProjectileDuel game state
export interface ProjectileDuelState {
  tick: number;
  players: ProjectileDuelPlayer[];
  projectiles: Projectile[];
  obstacles: Obstacle[];
  powerUps: PowerUp[];
  timeRemaining: number;
}

export interface ProjectileDuelPlayer {
  address: string;
  position: Vector2;
  velocity: Vector2;
  rotation: number;
  health: number;
  score: number;
  ammo: number;
  powerUps: Record<string, number>; // powerUpType -> remainingTime
}

export interface Projectile {
  id: string;
  position: Vector2;
  velocity: Vector2;
  owner: string;
  damage: number;
  type: 'normal' | 'heavy';
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health?: number;
  destructible: boolean;
}

export interface PowerUp {
  id: string;
  position: Vector2;
  type: 'shield' | 'rapid-fire' | 'heavy-shot';
  spawnTime: number;
}

// GravityPainters game state
export interface GravityPaintersState {
  tick: number;
  players: GravityPaintersPlayer[];
  particles: Particle[];
  canvas: string; // base64 compressed
  timeRemaining: number;
}

export interface GravityPaintersPlayer {
  address: string;
  wellPosition: Vector2;
  color: { r: number; g: number; b: number };
  gravityStrength: number;
  territoryPercentage: number;
  isEmitting: boolean;
}

export interface Particle {
  id: string;
  position: Vector2;
  velocity: Vector2;
  color: { r: number; g: number; b: number };
  owner: string;
  stuck: boolean;
}

// Input types
export interface PlayerInput {
  action: 'move' | 'rotate' | 'shoot' | 'emit' | 'adjust-gravity';
  data: Record<string, unknown>;
  timestamp: number;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
