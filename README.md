# BitArena: Project Overview & Architecture

## Executive Summary

BitArena is a competitive multiplayer gaming platform integrating MUSD wagering and Mezo Passport authentication into skill-based games. Players stake MUSD to enter matches, with winners claiming the prize pool. The platform transforms casual gaming into economically meaningful competition using Bitcoin-backed stablecoins.

**Hackathon Track**: Daily Bitcoin Applications  
**Target Audience**: Crypto-native gamers, DeFi users seeking entertainment-based yield  
**Core Innovation**: Real economic stakes in skill-based games without custody risk

---

## System Architecture

### High-Level Design

```
┌──────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 14)                  │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐       │
│  │  Lobby UI  │  │ Game Canvas  │  │  Wallet UI  │       │
│  │  (React)   │  │  (Three.js)  │  │   (Mezo)    │       │
│  └────────────┘  └──────────────┘  └─────────────┘       │
└──────────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────────┐
│              Application Services Layer                  │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │  Authentication  │  │  Match Manager   │              │ 
│  │ (Mezo Passport)  │  │  (Room System)   │              │
│  └──────────────────┘  └──────────────────┘              │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │  Payment Engine  │  │ Game State Sync  │              │
│  │  (MUSD Stakes)   │  │   (WebSocket)    │              │
│  └──────────────────┘  └──────────────────┘              │
└──────────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────────┐
│               Smart Contract Layer (Mezo)                │
│  ┌────────────────────────────────────────────────┐      │
│  │         Match Escrow Contract                  │      │
│  │  • Locks MUSD stakes from all players          │      │
│  │  • Releases to winner after verification       │      │
│  │  • Handles disputes with timelock refunds      │      │
│  └────────────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────────────┐      │
│  │         Tournament Pool Contract               │      │
│  │  • Manages bracket-style tournaments           │      │
│  │  • Progressive prize pool distribution         │      │
│  └────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────────┐
│            Backend Infrastructure (Node.js)              │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐       │
│  │   Game     │  │  WebSocket   │  │   Oracle    │       │
│  │   Server   │  │   Gateway    │  │  (Verifier) │       │
│  └────────────┘  └──────────────┘  └─────────────┘       │
│                                                          │
│  ┌────────────────────────────────────────────────┐      │
│  │     PostgreSQL + Redis (State/Cache)           │      │
│  └────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend**
- Next.js 14 (App Router, RSC)
- React 18 + TypeScript
- Three.js + React Three Fiber (3D rendering)
- TailwindCSS (styling)
- Zustand (state management)
- Wagmi + Viem (blockchain)

**Backend**
- Node.js + Express (REST API)
- Socket.io (WebSocket server)
- PostgreSQL (persistent data)
- Redis (caching, sessions)

**Blockchain**
- Solidity 0.8.x
- Hardhat (development)
- Mezo Testnet
- Mezo Passport SDK
- MUSD ERC-20 token

**Infrastructure**
- Vercel (frontend)
- Railway (backend)
- IPFS (asset storage)

---

## Game Specifications

### Game 1: Projectile Duel

**Type**: 2-player competitive shooter  
**Duration**: 3 minutes or first to 5 kills  
**Perspective**: Top-down orthographic

**Core Mechanics**:
- Physics-based projectile trajectories (velocity, gravity, bounce)
- Destructible and reflective obstacles
- Timed power-up spawns (shield, rapid-fire, heavy shot)
- Deterministic simulation (client prediction + server reconciliation)

**Technical Requirements**:
- 60 tick rate server simulation
- AABB collision detection for players
- Ray-casting for projectiles
- Client-side prediction with server authority

**Visual Style**:
- Cyberpunk/neon aesthetic
- Particle effects for impacts and trails
- Minimalist HUD (health, ammo, kills, timer)

### Game 2: Gravity Painters

**Type**: 3-10 player territorial control  
**Duration**: 3 minutes  
**Perspective**: 2D top-down

**Core Mechanics**:
- Each player controls a colored gravity well
- Clicking emits colored particles following gravity physics
- Particles attracted to nearest wells (inverse-square law)
- Paint sticks permanently where particles land
- Color mixing: RGB additive blending
- Gravity strength slider: stronger pull = slower movement
- Synchronized 30-second pulse: all wells emit particle burst
- Winner: most canvas coverage

**Physics Implementation**:
- 10,000+ concurrent particle simulation
- Quadtree spatial partitioning for optimization
- Canvas rendered as WebGL texture
- Deterministic physics for state synchronization

**Visual Style**:
- Dark canvas background
- Vibrant particle glow effects
- Real-time territory heatmap overlay
- Flow field visualization (optional)

---

## Smart Contract Architecture

### MatchEscrow.sol

**Purpose**: Trustless MUSD stake management for individual matches

**Core Functions**:
```
createMatch(gameType, stakeAmount, maxPlayers)
  → Locks MUSD from match creator
  → Returns matchId
  → Emits MatchCreated event

joinMatch(matchId)
  → Requires MUSD approval
  → Locks player's stake
  → Emits PlayerJoined event
  → Auto-starts when maxPlayers reached

submitResult(matchId, winner, gameDataHash, signatures[])
  → Requires 3/5 oracle signatures
  → Validates game data integrity
  → Marks match complete
  → Emits MatchCompleted event

claimWinnings(matchId)
  → Verifies caller is winner
  → Transfers prize pool to winner
  → Takes 2.5% platform fee
  → Emits WinningsClaimed event

disputeMatch(matchId)
  → Requires 10-minute timelock expired
  → Refunds all players if no result submitted
  → Emits MatchDisputed event
```

**State Variables**:
```solidity
struct Match {
    uint256 id;
    GameType gameType;
    uint256 stakeAmount;
    uint8 maxPlayers;
    address[] players;
    address winner;
    uint256 totalPot;
    MatchStatus status;
    uint256 startTime;
    bytes32 gameDataHash;
}

mapping(uint256 => Match) public matches;
mapping(address => bool) public authorizedOracles;
uint256 public matchCounter;
uint256 public constant PLATFORM_FEE_BPS = 250; // 2.5%
```

**Security Features**:
- ReentrancyGuard on withdrawals
- 10-minute timelock for auto-refunds
- Multi-signature oracle verification (3/5 threshold)
- Emergency pause mechanism
- Input validation on all external calls

### TournamentPool.sol

**Purpose**: Bracket-style tournament management

**Core Functions**:
```
createTournament(name, entryFee, maxPlayers, prizeDistribution[])
  → Initializes tournament structure
  → Sets prize pool percentages
  → Returns tournamentId

registerPlayer(tournamentId)
  → Locks player's entry fee
  → Assigns bracket position
  → Emits PlayerRegistered event

startTournament(tournamentId)
  → Requires minimum players met
  → Creates first-round matches
  → Emits TournamentStarted event

advanceWinner(matchId, tournamentId)
  → Called by MatchEscrow when match completes
  → Progresses winner to next round
  → Creates new bracket match

distributePrizes(tournamentId)
  → Called when tournament complete
  → Transfers winnings per prizeDistribution
  → Takes platform fee
```

**Tournament Structure**:
```solidity
struct Tournament {
    uint256 id;
    string name;
    uint256 entryFee;
    uint256 prizePool;
    address[] participants;
    uint8 currentRound;
    uint8 maxRounds;
    uint8[] prizeDistribution; // [50, 30, 20] = 50% 1st, 30% 2nd, 20% 3rd
    TournamentStatus status;
    mapping(uint8 => uint256[]) roundMatches;
}
```

**Prize Distribution Examples**:
- 8-player: 60% / 30% / 10% (top 3)
- 16-player: 50% / 25% / 15% / 10% (top 4)
- Platform fee: 2.5% deducted from total pool

---

## Mezo Passport Integration

### Authentication Flow

```
1. User clicks "Connect with Mezo Passport"
   ↓
2. SDK generates authorization URL
   ↓
3. Redirect to Mezo auth page
   ↓
4. User approves app + signs message
   ↓
5. Redirect to /auth/callback with code
   ↓
6. Exchange code for JWT + user data
   ↓
7. Store JWT in httpOnly cookie
   ↓
8. Redirect to game lobby
```

**SDK Implementation**:
```typescript
import { MezoPassport } from '@mezo/passport-sdk';

const passport = new MezoPassport({
  clientId: process.env.NEXT_PUBLIC_MEZO_CLIENT_ID,
  redirectUri: `${process.env.NEXT_PUBLIC_URL}/auth/callback`,
  network: 'testnet',
  scopes: ['profile', 'wallet']
});

// Initiate flow
const authUrl = await passport.getAuthorizationUrl();

// Handle callback
const { user, token } = await passport.handleCallback(code);
// user: { address, passportId, createdAt }
```

### Authorization Tiers

**Tier 1: Guest**
- View leaderboards
- Watch live matches
- Access documentation

**Tier 2: Authenticated** (Mezo Passport)
- Play free practice matches
- View personal stats
- Access lobby chat

**Tier 3: Funded** (MUSD balance > 0)
- Enter staked matches
- Create custom matches
- Join tournaments

**Tier 4: Verified** (KYC complete)
- High-stakes tournaments (>50 MUSD)
- Large withdrawals (>100 MUSD)
- Host sponsored events

### Session Management

- JWT stored in httpOnly cookie (XSS protection)
- 24-hour expiration with refresh tokens
- Redis-backed session store
- Automatic WebSocket reconnection with token refresh

---

## MUSD Integration

### Wagering Flow

```
1. Select game mode + stake amount
   ↓
2. Approve MUSD spending (ERC-20 approval)
   ↓
3. Create/join match (MUSD locked in contract)
   ↓
4. Play game (no blockchain interaction)
   ↓
5. Match ends → Oracle submits result
   ↓
6. Winner claims MUSD from contract
```

**Smart Contract Calls**:
```typescript
// Approve spending
await musdToken.approve(
  matchEscrowAddress, 
  parseUnits(stakeAmount, 18)
);

// Create match
const tx = await matchEscrow.createMatch(
  GameType.GRAVITY_PAINTERS,
  parseUnits("5", 18), // 5 MUSD
  6 // max players
);

// Join match
await matchEscrow.joinMatch(matchId);

// Claim winnings
await matchEscrow.claimWinnings(matchId);
```

### Additional MUSD Use Cases

**Leaderboard Rewards**:
- Weekly prize pool distributed to top 10 players by ELO
- Distribution: 30% / 20% / 15% / 10% / 5% / 5% / 5% / 4% / 3% / 3%
- Automated Chainlink oracle triggers payouts

**Tournament Economy**:
- Guaranteed prize pool tournaments
- Satellite tournaments (winners advance to larger events)
- Freeroll tournaments for user acquisition

**Marketplace** (Future):
- NFT skins/cosmetics purchasable with MUSD
- 5% royalty on secondary sales

---

## Network Architecture

### Game State Synchronization

**Model**: Authoritative server with client prediction

**Flow**:
```
1. Player Input → Sent to server
2. Client Prediction → Immediate local simulation
3. Server Authority → Validates + simulates true state
4. State Broadcast → Server sends to all clients (60 Hz)
5. Reconciliation → Clients correct if prediction wrong
```

**Message Format**:

Server → Client (GameState):
```json
{
  "tick": 12345,
  "players": [
    {
      "id": "0xabc...",
      "pos": {"x": 100, "y": 200},
      "vel": {"x": 5, "y": -2},
      "health": 80,
      "score": 3
    }
  ],
  "projectiles": [...],
  "particles": [...],
  "canvas": "base64_compressed_image"
}
```

Client → Server (Input):
```json
{
  "clientTick": 12340,
  "action": "shoot",
  "data": {
    "angle": 1.57,
    "power": 0.8
  }
}
```

**Optimizations**:
- Delta compression (only changed values)
- Interest management (cull off-screen data)
- Snapshot interpolation (smooth 60 Hz → 144 Hz display)
- Lag compensation (server rewinds for hit detection)

### Backend Services

**Game Server** (Node.js + Socket.io):
- Hosts authoritative game simulations
- 60 Hz tick rate per active match
- Validates all player inputs
- Detects win conditions
- Submits results to oracle service

**API Server** (Express):
- REST endpoints for match/tournament CRUD
- Authentication middleware
- Database queries
- Blockchain interaction wrapper

**Oracle Service**:
- Collects game results from game servers
- Multi-signature result verification
- Submits to smart contracts
- Handles dispute resolution

---

## Database Schema

### Core Tables

```sql
CREATE TABLE users (
  address VARCHAR(42) PRIMARY KEY,
  passport_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50),
  elo_rating INTEGER DEFAULT 1200,
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  total_wagered DECIMAL(18,2) DEFAULT 0,
  total_winnings DECIMAL(18,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_elo (elo_rating DESC)
);

CREATE TABLE matches (
  id VARCHAR(36) PRIMARY KEY,
  game_type VARCHAR(20) NOT NULL,
  stake_amount DECIMAL(18,2) NOT NULL,
  max_players INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  winner_address VARCHAR(42),
  contract_match_id INTEGER,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_status (status),
  INDEX idx_created (created_at DESC)
);

CREATE TABLE match_players (
  match_id VARCHAR(36) REFERENCES matches(id),
  player_address VARCHAR(42) REFERENCES users(address),
  join_order INTEGER,
  final_score INTEGER,
  PRIMARY KEY (match_id, player_address)
);

CREATE TABLE tournaments (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  entry_fee DECIMAL(18,2) NOT NULL,
  prize_pool DECIMAL(18,2),
  max_players INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'registration',
  bracket_data JSONB,
  prize_distribution INTEGER[],
  start_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE game_logs (
  id BIGSERIAL PRIMARY KEY,
  match_id VARCHAR(36) REFERENCES matches(id),
  tick INTEGER NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  INDEX idx_match_tick (match_id, tick)
) PARTITION BY RANGE (timestamp);
```

---

## Security Considerations

### Smart Contract Security

- **Reentrancy**: OpenZeppelin ReentrancyGuard on all fund transfers
- **Access Control**: Role-based permissions for oracle submissions
- **Time Locks**: 10-minute auto-refund if no result submitted
- **Input Validation**: Strict bounds checking on all parameters
- **Emergency Pause**: Circuit breaker for critical vulnerabilities
- **Audit**: Professional audit before mainnet (CertiK/Trail of Bits)

### Backend Security

- **Input Validation**: Sanitize all player actions server-side
- **Rate Limiting**: 100 req/min per IP, 10 actions/sec per player
- **SQL Injection**: Parameterized queries only (TypeORM)
- **CORS**: Restrict to frontend domain
- **JWT Security**: httpOnly + SameSite=Strict cookies
- **WebSocket Auth**: Verify token before socket connection

### Anti-Cheat Mechanisms

- **Server Authority**: Never trust client-reported positions/scores
- **Physics Validation**: Verify actions are physically possible
- **Heuristic Analysis**: Flag perfect aim, impossible timing
- **Replay System**: Store all inputs for post-match audit
- **Rate Limiting**: Cap input frequency per player

---

## Deployment Strategy

### Development Environment

```bash
# Local blockchain
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.ts --network localhost

# Start services
npm run dev:backend  # Express + Socket.io
npm run dev          # Next.js frontend
```

### Testnet Deployment

**Smart Contracts** → Mezo Testnet (Hardhat)
**Frontend** → Vercel (main branch auto-deploy)
**Backend** → Railway (Express + Socket.io + PostgreSQL + Redis)

**Environment Variables**:
```env
# Contracts
NEXT_PUBLIC_MATCH_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_MUSD_TOKEN_ADDRESS=0x...

# Mezo
NEXT_PUBLIC_MEZO_CLIENT_ID=bitarena-testnet
MEZO_CLIENT_SECRET=xxx

# Backend
API_URL=https://bitarena-api.railway.app
WS_URL=wss://bitarena-api.railway.app
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# RPC
NEXT_PUBLIC_MEZO_RPC_URL=https://testnet.mezo.io
ORACLE_PRIVATE_KEY=0x...
```

### Monitoring

**Business Metrics**:
- Daily Active Users (DAU)
- MUSD wagered per day
- Player retention (D7, D30)
- Average match duration

**Technical Metrics**:
- API response times (p50, p95, p99)
- WebSocket latency
- Game server tick consistency
- Smart contract gas usage

**Tools**:
- Vercel Analytics (frontend)
- Grafana + Prometheus (backend)
- Sentry (error tracking)
- Dune Analytics (on-chain metrics)

---

## Success Criteria

### Hackathon Demo Requirements

✅ MUSD integration (staking, escrow, payouts)  
✅ Mezo Passport authentication  
✅ Both games playable on testnet  
✅ Working match lifecycle (create → join → play → claim)  
✅ Smart contracts deployed and verified  
✅ Clean UI/UX with wallet connection  

### Post-Hackathon Goals

- 1,000+ testnet users
- 100+ daily matches played
- 10,000+ MUSD total volume wagered
- <100ms average WebSocket latency
- 99.9% uptime
- Smart contract audit completion
- Mainnet deployment readiness
