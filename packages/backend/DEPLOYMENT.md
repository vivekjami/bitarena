# 🚀 Backend Deployment Guide - Railway

Complete guide to deploy BitArena backend to Railway with PostgreSQL and Redis.

---

## Quick Deploy (5 Minutes)

### 1. Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Verify your email

### 2. Create New Project

```bash
# Option A: Deploy from GitHub (Recommended)
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your bitarena repository
4. Select "packages/backend" as root directory

# Option B: Deploy using Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

### 3. Add PostgreSQL Database

1. In Railway project dashboard, click **"+ New"**
2. Select **"Database" → "PostgreSQL"**
3. Railway will automatically:
   - ✅ Create PostgreSQL instance
   - ✅ Generate `DATABASE_URL` environment variable
   - ✅ Connect it to your backend service

### 4. Add Redis Database

1. Click **"+ New"** again
2. Select **"Database" → "Redis"**
3. Railway will automatically:
   - ✅ Create Redis instance
   - ✅ Generate `REDIS_URL` environment variable
   - ✅ Connect it to your backend service

### 5. Configure Environment Variables

In your backend service settings, add these variables:

```env
# Server
NODE_ENV=production
PORT=3001

# Frontend URL (update after deploying frontend)
FRONTEND_URL=https://your-frontend.vercel.app

# JWT Secret (generate a secure random string)
JWT_SECRET=<GENERATE_SECURE_RANDOM_STRING>

# Mezo Passport
MEZO_CLIENT_ID=bitarena-testnet
MEZO_CLIENT_SECRET=<YOUR_MEZO_SECRET>
MEZO_REDIRECT_URI=https://your-frontend.vercel.app/auth/callback

# Blockchain
MEZO_RPC_URL=https://testnet.mezo.io
CHAIN_ID=20241
ORACLE_PRIVATE_KEY=<YOUR_ORACLE_PRIVATE_KEY>

# Smart Contract Addresses (from deployment)
MATCH_ESCROW_ADDRESS=<CONTRACT_ADDRESS>
TOURNAMENT_POOL_ADDRESS=<CONTRACT_ADDRESS>
MUSD_TOKEN_ADDRESS=<CONTRACT_ADDRESS>
```

**Note**: `DATABASE_URL` and `REDIS_URL` are automatically set by Railway!

### 6. Run Database Migration

After first deployment:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migration
railway run npm run migrate:prod

# (Optional) Seed test data
railway run npm run seed:prod
```

### 7. Verify Deployment

Your backend will be available at: `https://your-app.up.railway.app`

**Test endpoints:**

```bash
# Health check
curl https://your-app.up.railway.app/health

# Ping
curl https://your-app.up.railway.app/ping

# API endpoints
curl https://your-app.up.railway.app/api/matches
```

---

## Detailed Configuration

### Environment Variables Explained

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Auto-generated | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | ✅ Auto-generated | `redis://host:6379` |
| `NODE_ENV` | Environment mode | ✅ | `production` |
| `PORT` | Server port | ❌ (default: 3001) | `3001` |
| `FRONTEND_URL` | Frontend domain for CORS | ✅ | `https://bitarena.vercel.app` |
| `JWT_SECRET` | Secret for JWT tokens | ✅ | `super_secret_key_123` |
| `MEZO_CLIENT_ID` | Mezo Passport client ID | ✅ | `bitarena-testnet` |
| `MEZO_CLIENT_SECRET` | Mezo Passport secret | ✅ | `secret_xyz` |
| `MEZO_REDIRECT_URI` | OAuth callback URL | ✅ | `https://app.com/auth/callback` |
| `MEZO_RPC_URL` | Mezo blockchain RPC | ✅ | `https://testnet.mezo.io` |
| `ORACLE_PRIVATE_KEY` | Oracle wallet private key | ✅ | `0x123...` |
| `MATCH_ESCROW_ADDRESS` | MatchEscrow contract | ✅ | `0xabc...` |
| `TOURNAMENT_POOL_ADDRESS` | TournamentPool contract | ✅ | `0xdef...` |
| `MUSD_TOKEN_ADDRESS` | MUSD token contract | ✅ | `0x789...` |

### Generate Secure JWT Secret

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64

# Option 3: Online
# Visit: https://randomkeygen.com/
```

### Get Your Railway URLs

After deployment, Railway provides:

- **Backend URL**: `https://your-app.up.railway.app`
- **PostgreSQL**: Internal host (auto-configured)
- **Redis**: Internal host (auto-configured)

---

## Database Setup

### Automatic Migration on Deploy

The backend automatically runs migrations on startup if tables don't exist.

### Manual Migration

If you need to run migrations manually:

```bash
# Using Railway CLI
railway run npm run migrate:prod

# Or connect directly
railway run psql $DATABASE_URL -c "SELECT version();"
```

### Seed Test Data

```bash
# Add test users and matches
railway run npm run seed:prod
```

### View Database

```bash
# Open Railway dashboard
railway open

# Or connect with psql
railway run psql $DATABASE_URL

# Inside psql:
\dt                          # List tables
SELECT * FROM users;         # View users
SELECT * FROM matches;       # View matches
```

---

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
railway logs

# Follow logs
railway logs --follow

# Filter by service
railway logs --service backend
```

### Railway Dashboard

1. Go to your project on Railway
2. Click on backend service
3. View tabs:
   - **Deployments**: Build history
   - **Logs**: Real-time logs
   - **Metrics**: CPU, Memory, Network
   - **Settings**: Environment variables

### Health Monitoring

Railway automatically monitors `/health` endpoint:

- ✅ Returns 200: Service is healthy
- ❌ Returns 503: Service is unhealthy
- 🔄 Auto-restart on repeated failures

---

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**

```bash
# Make sure dependencies are installed
railway run npm install
```

**Error: "TypeScript compilation failed"**

```bash
# Check TypeScript errors locally
npm run build
```

### Runtime Errors

**Error: "ECONNREFUSED ::1:5432"**

- Database not connected
- Check `DATABASE_URL` environment variable exists
- Verify PostgreSQL service is running

**Error: "ECONNREFUSED ::1:6379"**

- Redis not connected
- Check `REDIS_URL` environment variable exists
- Verify Redis service is running

**Error: "Port already in use"**

- Remove `PORT` environment variable
- Let Railway assign port automatically

### Connection Issues

**CORS errors from frontend**

```env
# Update FRONTEND_URL in Railway
FRONTEND_URL=https://your-actual-frontend-domain.vercel.app
```

**WebSocket not connecting**

- Railway supports WebSocket by default
- Check WebSocket URL in frontend: `wss://your-app.up.railway.app`

### Database Issues

**Tables not created**

```bash
# Run migration manually
railway run npm run migrate:prod
```

**Connection pool exhausted**

- Increase max connections in database config
- Check for connection leaks in code

---

## Scaling & Performance

### Vertical Scaling

Railway plans:
- **Hobby**: $5/month, 512MB RAM, shared CPU
- **Pro**: $20/month, 8GB RAM, dedicated CPU
- **Team**: Custom pricing

### Horizontal Scaling

For multiple instances:

1. Upgrade to Pro/Team plan
2. Enable horizontal scaling in service settings
3. Increase replica count

### Database Performance

```sql
-- Add indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_users_elo ON users(elo_rating DESC);

-- Monitor slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

### Redis Caching

Already implemented for:
- ✅ User sessions (24h TTL)
- ✅ Match cache (1min TTL)
- ✅ Leaderboard (5min TTL)

---

## Security Checklist

Before going live:

- [ ] Change default JWT_SECRET
- [ ] Set strong ORACLE_PRIVATE_KEY
- [ ] Update FRONTEND_URL to production domain
- [ ] Enable Railway's environment variable encryption
- [ ] Set up Railway's IP allowlist (optional)
- [ ] Enable 2FA on Railway account
- [ ] Review CORS settings
- [ ] Enable rate limiting (already implemented)
- [ ] Set up monitoring alerts

---

## CI/CD Pipeline

Railway auto-deploys on GitHub push:

```yaml
# Automatic deployment triggers:
- Push to main branch → Deploy to production
- Push to dev branch → Deploy to staging (configure separately)
- Pull request → Deploy preview environment
```

### Custom Deploy Script

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Railway
        run: npm install -g @railway/cli
      
      - name: Deploy
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## Alternative Platforms

If Railway doesn't work, try these:

### Render

1. Similar to Railway
2. Free tier available
3. Automatic HTTPS
4. GitHub integration

### Fly.io

1. Global edge deployment
2. Postgres included
3. Redis via Upstash
4. CLI-based deployment

### Heroku

1. Classic PaaS
2. Lots of addons
3. Dyno-based pricing
4. PostgreSQL + Redis addons

---

## Post-Deployment

### Update Frontend

Update frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend.up.railway.app
```

### Test Full Flow

1. Create match from frontend
2. Check Railway logs for API calls
3. Join match with another user
4. Verify WebSocket connection
5. Complete match and check database

### Monitor Usage

```bash
# Check Railway metrics
railway status

# View resource usage
railway metrics
```

---

## Cost Estimate

**Railway Pricing:**

- **Hobby Plan**: $5/month
  - Backend: ~$3/month (always-on)
  - PostgreSQL: ~$1/month (1GB)
  - Redis: ~$1/month (256MB)

**Total**: ~$5-10/month for hobby project
**Production**: ~$20-50/month with Pro plan

---

## Quick Commands Reference

```bash
# Deploy
railway up

# View logs
railway logs --follow

# Run migration
railway run npm run migrate:prod

# Seed data
railway run npm run seed:prod

# Open dashboard
railway open

# Connect to database
railway run psql $DATABASE_URL

# Connect to Redis
railway run redis-cli -u $REDIS_URL

# Restart service
railway restart

# View status
railway status

# Set environment variable
railway variables set KEY=value
```

---

## Success Checklist

You've successfully deployed when:

- ✅ Backend URL is accessible
- ✅ `/health` returns `{"status":"healthy"}`
- ✅ `/ping` returns `pong`
- ✅ Database tables exist
- ✅ Redis is connected
- ✅ Frontend can call API endpoints
- ✅ WebSocket connects successfully
- ✅ No errors in Railway logs

---

## Need Help?

**Railway Support:**
- Discord: [railway.app/discord](https://railway.app/discord)
- Docs: [docs.railway.app](https://docs.railway.app)
- Status: [status.railway.app](https://status.railway.app)

**BitArena Issues:**
- Check logs: `railway logs --follow`
- Review health endpoint: `/health`
- Test locally first: `npm run dev`
- Check environment variables are set

---

**Ready to deploy! 🚀**

Run: `railway init` to get started!
