/**
 * Contract ABIs for frontend interaction
 */

export const MUSD_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const;

export const MATCH_ESCROW_ABI = [
  'function createMatch(uint8 gameType, uint256 stakeAmount, uint8 maxPlayers) returns (uint256)',
  'function joinMatch(uint256 matchId)',
  'function claimWinnings(uint256 matchId)',
  'function matchCounter() view returns (uint256)',
  'function matches(uint256) view returns (uint256 id, uint8 gameType, uint256 stakeAmount, uint8 maxPlayers, address winner, uint256 totalPot, uint8 status, uint256 startTime, uint256 createdAt)',
  'function getMatchPlayers(uint256 matchId) view returns (address[])',
  'event MatchCreated(uint256 indexed matchId, address indexed creator, uint8 gameType, uint256 stakeAmount, uint8 maxPlayers)',
  'event PlayerJoined(uint256 indexed matchId, address indexed player)',
  'event MatchCompleted(uint256 indexed matchId, address indexed winner, uint256 prize)',
  'event WinningsClaimed(uint256 indexed matchId, address indexed winner, uint256 amount)',
] as const;

export const TOURNAMENT_POOL_ABI = [
  'function createTournament(string name, uint256 entryFee, uint8 maxPlayers, uint8[] prizeDistribution) returns (uint256)',
  'function registerPlayer(uint256 tournamentId)',
  'function tournamentCounter() view returns (uint256)',
  'function tournaments(uint256) view returns (uint256 id, string name, uint256 entryFee, uint256 prizePool, uint8 maxPlayers, uint8 currentRound, uint8 status)',
  'event TournamentCreated(uint256 indexed tournamentId, string name, uint256 entryFee, uint8 maxPlayers)',
  'event PlayerRegistered(uint256 indexed tournamentId, address indexed player)',
  'event TournamentStarted(uint256 indexed tournamentId)',
] as const;

// Game type enum
export enum GameType {
  PROJECTILE_DUEL = 0,
  GRAVITY_PAINTERS = 1,
}

// Match status enum
export enum MatchStatus {
  PENDING = 0,
  ACTIVE = 1,
  COMPLETED = 2,
  DISPUTED = 3,
  REFUNDED = 4,
}

// Tournament status enum
export enum TournamentStatus {
  REGISTRATION = 0,
  ACTIVE = 1,
  COMPLETED = 2,
  CANCELLED = 3,
}
