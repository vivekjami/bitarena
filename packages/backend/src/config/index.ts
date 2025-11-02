import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local first (for local development), then .env
dotenv.config({ path: path.join(__dirname, '../../.env.local') });
dotenv.config();

// Environment configuration
export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'bitarena',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: '24h',
  },
  
  // Mezo Passport
  mezo: {
    clientId: process.env.MEZO_CLIENT_ID || '',
    clientSecret: process.env.MEZO_CLIENT_SECRET || '',
    redirectUri: process.env.MEZO_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    apiUrl: process.env.MEZO_API_URL || 'https://api.mezo.io',
  },
  
  // Blockchain
  blockchain: {
    rpcUrl: process.env.MEZO_RPC_URL || 'https://testnet-rpc.mezo.network',
    chainId: parseInt(process.env.CHAIN_ID || '20241'),
    oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY || '',
    contracts: {
      musdToken: process.env.MUSD_TOKEN_ADDRESS || '',
      matchEscrow: process.env.MATCH_ESCROW_ADDRESS || '',
      tournamentPool: process.env.TOURNAMENT_POOL_ADDRESS || '',
    },
  },
  
  // CORS
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  },
  
  // Game server
  game: {
    tickRate: 60, // 60 Hz
    tickInterval: 1000 / 60, // ~16.67ms
  },
};

// Initialize blockchain provider and wallet
export const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);

export const oracleWallet = config.blockchain.oraclePrivateKey
  ? new ethers.Wallet(config.blockchain.oraclePrivateKey, provider)
  : null;

if (!oracleWallet && config.nodeEnv === 'production') {
  console.error('❌ Oracle private key not configured');
  process.exit(1);
}

// Contract ABIs (simplified - import full ABIs in production)
export const MatchEscrowABI = [
  'function createMatch(uint8 gameType, uint256 stakeAmount, uint8 maxPlayers) external returns (uint256)',
  'function joinMatch(uint256 matchId) external',
  'function submitResult(uint256 matchId, address winner, bytes32 gameDataHash) external',
  'function getMatch(uint256 matchId) external view returns (tuple(uint256 id, uint8 gameType, uint256 stakeAmount, uint8 maxPlayers, address[] players, address winner, uint256 totalPot, uint8 status, uint256 startTime, uint256 createdAt, bytes32 gameDataHash))',
  'event MatchCreated(uint256 indexed matchId, address indexed creator, uint8 gameType, uint256 stakeAmount, uint8 maxPlayers)',
  'event PlayerJoined(uint256 indexed matchId, address indexed player)',
  'event MatchCompleted(uint256 indexed matchId, address indexed winner, bytes32 gameDataHash)',
];

export const TournamentPoolABI = [
  'function createTournament(string memory name, uint256 entryFee, uint8 maxPlayers, uint8[] memory prizeDistribution) external returns (uint256)',
  'function registerPlayer(uint256 tournamentId) external',
  'function startTournament(uint256 tournamentId) external',
  'function advanceWinner(uint256 tournamentId, address winner) external',
  'event TournamentCreated(uint256 indexed tournamentId, string name, uint256 entryFee, uint8 maxPlayers)',
  'event PlayerRegistered(uint256 indexed tournamentId, address indexed player)',
];

export const MUSDTokenABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
];

// Initialize contract instances
export const contracts = {
  matchEscrow: oracleWallet
    ? new ethers.Contract(config.blockchain.contracts.matchEscrow, MatchEscrowABI, oracleWallet)
    : null,
  tournamentPool: oracleWallet
    ? new ethers.Contract(config.blockchain.contracts.tournamentPool, TournamentPoolABI, oracleWallet)
    : null,
  musdToken: oracleWallet
    ? new ethers.Contract(config.blockchain.contracts.musdToken, MUSDTokenABI, oracleWallet)
    : null,
};
