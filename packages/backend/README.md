# BitArena Backend Server 🎮

Real-time multiplayer game server with WebSocket, PostgreSQL, Redis, and smart contract integration.

## Features

- ✅ **Express REST API** - Match management, tournaments, leaderboards
- ✅ **Socket.io WebSocket** - Real-time 60Hz game state synchronization
- ✅ **PostgreSQL Database** - Persistent data storage
- ✅ **Redis Cache** - Session management and caching
- ✅ **Game Server** - Authoritative server simulation (Projectile Duel, Gravity Painters)
- ✅ **Oracle Service** - Result verification and smart contract submission
- ✅ **Mezo Passport** - OAuth authentication
- ✅ **Rate Limiting** - DDoS protection
- ✅ **TypeScript** - Full type safety

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL 16
- Redis 7+

### Installation

```bash
cd packages/backend
npm install
```

### Configuration

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/bitarena

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_key

# Mezo Passport
MEZO_CLIENT_ID=bitarena-testnet
MEZO_CLIENT_SECRET=your_secret

# Blockchain
ORACLE_PRIVATE_KEY=0x...
MATCH_ESCROW_ADDRESS=0x...
TOURNAMENT_POOL_ADDRESS=0x...
MUSD_TOKEN_ADDRESS=0x...
```

### Database Setup

```bash
# Run migrations
npm run migrate

# Seed test data
npm run seed
```

### Start Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm run build
npm start
```

Server runs on: `http://localhost:3001`

---

## API Endpoints

### Health Check

```http
GET /health
GET /ping
```

### Authentication

```http
POST /api/auth/passport
GET /api/auth/me
POST /api/auth/logout
```

### Matches

```http
GET /api/matches
GET /api/matches/:id
POST /api/matches
POST /api/matches/:id/join
POST /api/matches/:id/forfeit
```

### Tournaments

```http
GET /api/tournaments
GET /api/tournaments/:id
POST /api/tournaments
POST /api/tournaments/:id/register
```

### Leaderboard

```http
GET /api/leaderboard
```

### Profile

```http
GET /api/profile/:address
PATCH /api/profile/:address
```

---

## WebSocket Events

### Client → Server

- `join-match` - Join a match room
- `leave-match` - Leave match room
- `player-input` - Send game input
- `ready` - Mark player as ready

### Server → Client

- `game-state` - Game state update (60 Hz)
- `match-started` - Match has begun
- `match-ended` - Match concluded
- `player-joined` - New player joined
- `player-left` - Player disconnected
- `error` - Error message

---

## Database Schema

### Tables

- `users` - User profiles and stats
- `matches` - Match records
- `match_players` - Junction table for participants
- `tournaments` - Tournament data
- `tournament_participants` - Tournament roster
- `game_logs` - Detailed event logs

### Indexes

- `idx_users_elo` - Fast leaderboard queries
- `idx_matches_status` - Filter pending/active matches
- `idx_matches_created` - Sort by creation time

---

## Deployment

### Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Run deploy script
./deploy.ps1
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Docker

```bash
# Build image
docker build -t bitarena-backend .

# Run container
docker run -p 3001:3001 --env-file .env bitarena-backend
```

### Manual Deployment

```bash
# Build
npm run build

# Set environment variables
export DATABASE_URL=postgresql://...
export REDIS_URL=redis://...

# Run migrations
npm run migrate:prod

# Start
npm start
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│          Express HTTP Server            │
│  ┌───────────┐  ┌───────────────────┐  │
│  │    API    │  │   Middleware      │  │
│  │  Routes   │  │  (Auth, CORS,     │  │
│  │           │  │   Rate Limit)     │  │
│  └───────────┘  └───────────────────┘  │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│        Socket.io WebSocket Server       │
│  ┌───────────────────────────────────┐  │
│  │   Room Management & Events        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          Game Server (60Hz)             │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │  Projectile  │  │  Gravity        │ │
│  │    Duel      │  │  Painters       │ │
│  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────┘
         │                     │
┌────────────────┐    ┌────────────────┐
│   PostgreSQL   │    │     Redis      │
│   (Persistent) │    │    (Cache)     │
└────────────────┘    └────────────────┘
```

---

## Game Server

### Tick Loop (60 Hz)

```typescript
// Every ~16.67ms:
1. Process queued player inputs
2. Update physics simulation
3. Check win conditions
4. Broadcast state to clients
```

### Match Lifecycle

```
PENDING → ACTIVE → FINALIZING → COMPLETED
   ↓         ↓           ↓            ↓
 Join    Play Game   Submit      Claim
 Match   Gameplay    Result     Winnings
```

---

## Oracle Service

Handles result submission to smart contracts:

1. **Collect Result** - Game server reports winner
2. **Sign Result** - Oracle signs game data hash
3. **Submit to Chain** - Call `submitResult()` on MatchEscrow
4. **Monitor Disputes** - Watch for dispute events

---

## Development

### Run Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Database Commands

```bash
# View tables
psql $DATABASE_URL -c "\dt"

# Query users
psql $DATABASE_URL -c "SELECT * FROM users LIMIT 5;"

# Clear data
psql $DATABASE_URL -c "TRUNCATE users, matches CASCADE;"

# Re-seed
npm run seed
```

### Redis Commands

```bash
# Connect
redis-cli

# List keys
KEYS *

# Get session
GET session:abc123

# Clear cache
FLUSHALL
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `NODE_ENV` | Environment (development/production) | ✅ |
| `PORT` | Server port | ❌ (default: 3001) |
| `JWT_SECRET` | Secret for JWT tokens | ✅ |
| `MEZO_CLIENT_ID` | Mezo Passport client ID | ✅ |
| `MEZO_CLIENT_SECRET` | Mezo Passport secret | ✅ |
| `ORACLE_PRIVATE_KEY` | Oracle wallet private key | ✅ |
| `MATCH_ESCROW_ADDRESS` | MatchEscrow contract | ✅ |
| `TOURNAMENT_POOL_ADDRESS` | TournamentPool contract | ✅ |
| `MUSD_TOKEN_ADDRESS` | MUSD token contract | ✅ |
| `FRONTEND_URL` | Frontend domain for CORS | ✅ |

---

## Monitoring

### Health Endpoint

```bash
curl http://localhost:3001/health
```

Returns:

```json
{
  "status": "healthy",
  "timestamp": 1699000000000,
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Logs

```bash
# Development
npm run dev

# Production (Railway)
railway logs --follow
```

---

## Security

- ✅ **Helmet.js** - Security headers
- ✅ **CORS** - Whitelist frontend domain only
- ✅ **Rate Limiting** - 100 requests/minute per IP
- ✅ **JWT Auth** - httpOnly cookies
- ✅ **Input Validation** - Sanitize all inputs
- ✅ **SQL Injection** - Parameterized queries only
- ✅ **Server Authority** - Never trust client data

---

## Performance

### Optimizations

- Connection pooling (20 connections)
- Redis caching (sessions, leaderboards)
- Database indexes on frequent queries
- WebSocket delta compression
- Spatial partitioning for physics

### Scalability

- Horizontal scaling supported
- Stateless design (session in Redis)
- Database read replicas ready
- Load balancer compatible

---

## Troubleshooting

### Server won't start

```bash
# Check if PostgreSQL is running
psql $DATABASE_URL -c "SELECT 1"

# Check if Redis is running
redis-cli ping

# Check if port is available
netstat -ano | findstr :3001
```

### Database errors

```bash
# Re-run migrations
npm run migrate

# Check connection string
echo $DATABASE_URL
```

### WebSocket not connecting

- Check CORS settings in `.env`
- Verify WebSocket URL in frontend
- Check firewall rules

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and test
4. Commit: `git commit -m "Add new feature"`
5. Push: `git push origin feature/new-feature`
6. Create Pull Request

---

## License

MIT License - see LICENSE file for details

---

## Support

- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: GitHub Issues
- **Discord**: Community server

---

**Built with ❤️ for hackathon by BitArena Team**
