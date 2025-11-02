# 🚀 Railway Deployment - Next Steps for BitArena Backend

## Current Situation

You've successfully:
- ✅ Installed Railway CLI
- ✅ Logged in as vivek (vivek.quadratyx@gmail.com)
- ✅ Created project "bitarena" on Railway
- ✅ Built backend TypeScript files

**Issue Encountered**: Railway account is on a limited plan and needs upgrading.

---

## Option 1: Upgrade Railway Account (Recommended for Production)

### Step 1: Upgrade Your Plan

Visit: https://railway.com/account/plans

**Plans Available:**
- **Developer Plan**: $5/month credit (pay as you go)
  - Best for testing and small projects
  - Only pay for what you use
  - Perfect for BitArena backend
  
- **Hobby Plan**: $5/month subscription
  - Includes $5 credit
  - Simple billing
  
**Cost Estimate for BitArena:**
- Backend service: ~$3/month
- PostgreSQL: ~$1/month
- Redis: ~$1/month
- **Total**: ~$5/month

### Step 2: Add Databases to Your Project

After upgrading, add services to your Railway project:

```powershell
# Open Railway dashboard
railway open

# OR visit directly:
# https://railway.com/project/de04bfcc-d54a-4d60-a2bb-b8c0c70b36a0
```

**In the Dashboard:**

1. Click **"+ New"** button
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Wait for provisioning (1-2 minutes)
5. Click **"+ New"** again
6. Select **"Database"**
7. Choose **"Add Redis"**
8. Wait for provisioning (1-2 minutes)

### Step 3: Configure Environment Variables

Railway will auto-generate `DATABASE_URL` and `REDIS_URL`.

**Set these additional variables in the dashboard:**

Go to your backend service → Variables tab:

```env
# Node Environment
NODE_ENV=production

# Frontend (update after Vercel deployment)
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# JWT Secret (generate new one)
JWT_SECRET=<generate-with-command-below>

# Mezo Passport
MEZO_CLIENT_ID=bitarena-testnet
MEZO_CLIENT_SECRET=<your-secret-from-mezo>
MEZO_REDIRECT_URI=http://localhost:3000/auth/callback

# Oracle
ORACLE_PRIVATE_KEY=0x<your-private-key>

# Smart Contracts (deploy first)
MATCH_ESCROW_ADDRESS=0x...
TOURNAMENT_POOL_ADDRESS=0x...
MUSD_TOKEN_ADDRESS=0x...
```

**Generate JWT Secret:**
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4: Deploy Backend

```powershell
cd d:\bitarena\packages\backend
railway up
```

### Step 5: Run Migrations

```powershell
railway run npm run migrate:prod
```

### Step 6: Verify Deployment

```powershell
# Get your backend URL
railway domain

# Test health endpoint (replace with your URL)
curl https://bitarena-production.up.railway.app/health

# Should return:
# {"status":"healthy","timestamp":"...","services":{"database":"connected","redis":"connected"}}
```

---

## Option 2: Use Alternative Platform (Free Tier)

If you prefer not to upgrade Railway right now, here are free alternatives:

### A. Render.com (Free Tier)

**Pros:**
- Free PostgreSQL (90 days, then expires)
- Free Redis (25MB)
- Free web service (512MB RAM)

**Cons:**
- Services sleep after 15 minutes of inactivity
- Cold starts take 30-60 seconds

**Deploy to Render:**

1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repo: `vivekjami/bitarena`
5. Configure:
   - **Name**: bitarena-backend
   - **Root Directory**: `packages/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Add PostgreSQL:
   - Dashboard → **"New +"** → **"PostgreSQL"**
   - Free tier (expires in 90 days)
7. Add Redis:
   - Dashboard → **"New +"** → **"Redis"**
   - Free tier (25MB)
8. Link databases to web service (Environment Variables tab)
9. Add all other environment variables
10. Deploy!

### B. Fly.io (Free Tier)

**Pros:**
- Free tier: 3 VMs, 3GB storage
- PostgreSQL included
- No sleep mode

**Cons:**
- More complex setup
- Requires Docker knowledge

**Deploy to Fly.io:**

1. Install Fly CLI:
   ```powershell
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. Login:
   ```powershell
   fly auth login
   ```

3. Create app:
   ```powershell
   cd d:\bitarena\packages\backend
   fly launch
   ```

4. Add PostgreSQL:
   ```powershell
   fly postgres create
   fly postgres attach <postgres-app-name>
   ```

5. Add Redis:
   ```powershell
   fly redis create
   ```

6. Deploy:
   ```powershell
   fly deploy
   ```

---

## Option 3: Local Development First (No Cloud Yet)

Set up PostgreSQL and Redis locally to test everything before deploying:

### Step 1: Install PostgreSQL

**Using Chocolatey (Recommended):**
```powershell
# Install Chocolatey if not installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install PostgreSQL
choco install postgresql

# Start PostgreSQL service
Start-Service postgresql-x64-17
```

**Manual Installation:**
1. Download: https://www.postgresql.org/download/windows/
2. Run installer (PostgreSQL 17)
3. Set password for `postgres` user
4. Start PostgreSQL service

### Step 2: Install Redis

**Using Chocolatey:**
```powershell
choco install redis-64
Start-Service redis
```

**Using Memurai (Redis alternative for Windows):**
1. Download: https://www.memurai.com/get-memurai
2. Install and start service

**Using Docker (Easiest):**
```powershell
docker run -d -p 6379:6379 redis:latest
```

### Step 3: Create Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bitarena;

# Create user (optional)
CREATE USER bitarena_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE bitarena TO bitarena_user;

# Exit
\q
```

### Step 4: Update .env.local

Create `packages/backend/.env.local`:

```env
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bitarena
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-here

# Frontend
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Mezo Passport
MEZO_CLIENT_ID=bitarena-testnet
MEZO_CLIENT_SECRET=your_secret
MEZO_REDIRECT_URI=http://localhost:3000/auth/callback

# Oracle
ORACLE_PRIVATE_KEY=0x...

# Contracts (will be set after deployment)
MATCH_ESCROW_ADDRESS=0x...
TOURNAMENT_POOL_ADDRESS=0x...
MUSD_TOKEN_ADDRESS=0x...
```

### Step 5: Run Migrations

```powershell
cd d:\bitarena\packages\backend
npm run migrate
```

### Step 6: Start Backend

```powershell
npm run dev
```

Backend will run at: http://localhost:3001

### Step 7: Test Locally

```powershell
# Test health endpoint
curl http://localhost:3001/health

# Should return:
# {"status":"healthy","timestamp":"...","services":{"database":"connected","redis":"connected"}}
```

---

## Recommended Path Forward

Based on your current situation, I recommend:

### Phase 1: Local Setup (Today)
1. ✅ Install PostgreSQL and Redis locally
2. ✅ Create `.env.local` with local configuration
3. ✅ Run migrations: `npm run migrate`
4. ✅ Start backend: `npm run dev`
5. ✅ Test with frontend (already running at localhost:3000)
6. ✅ Deploy contracts to testnet
7. ✅ Test full integration locally

**Time**: 30-45 minutes

### Phase 2: Railway Deployment (When Ready)
1. ✅ Upgrade Railway account ($5/month)
2. ✅ Add PostgreSQL and Redis on Railway
3. ✅ Set environment variables
4. ✅ Deploy: `railway up`
5. ✅ Run migrations: `railway run npm run migrate:prod`
6. ✅ Update frontend with Railway backend URL

**Time**: 15-20 minutes

---

## Quick Commands Reference

### Railway Commands
```powershell
# Deploy backend
railway up

# Run migrations
railway run npm run migrate:prod

# View logs
railway logs --follow

# Open dashboard
railway open

# Get backend URL
railway domain

# Set environment variable
railway variables set KEY=value

# Check service status
railway status
```

### Local Development
```powershell
# Build backend
npm run build

# Run migrations
npm run migrate

# Start dev server
npm run dev

# Run tests
npm test

# Check database
psql -U postgres -d bitarena -c "\dt"

# Check Redis
redis-cli ping
```

---

## Troubleshooting

### Railway "Limited Plan" Error

**Error**: `Your account is on a limited plan`

**Solution**: 
1. Visit https://railway.com/account/plans
2. Add payment method
3. Select Developer or Hobby plan
4. Retry deployment

### Migration Fails: "Cannot find module"

**Error**: `Cannot find module 'dist/scripts/migrate.js'`

**Solution**:
```powershell
# Build first
npm run build

# Then migrate
npm run migrate:prod
```

### ts-node Not Found

**Error**: `'ts-node' is not recognized`

**Solution**:
```powershell
# Install dependencies
npm install

# ts-node should now be available
```

### Local PostgreSQL Not Running

**Error**: Database connection refused

**Solution**:
```powershell
# Check if running
Get-Service postgresql*

# Start if stopped
Start-Service postgresql-x64-17

# Or restart
Restart-Service postgresql-x64-17
```

### Local Redis Not Running

**Error**: Redis connection refused

**Solution**:
```powershell
# If using Windows Redis
Start-Service redis

# Or use Docker
docker run -d -p 6379:6379 redis:latest

# Or use Memurai
Start-Service Memurai
```

---

## Cost Comparison

### Railway (Recommended)
- **Monthly**: $5
- **Pros**: Easy setup, auto-scaling, great DX
- **Cons**: Requires payment

### Render
- **Monthly**: $0 (free tier)
- **Pros**: Free PostgreSQL + Redis
- **Cons**: Services sleep, limited resources

### Fly.io
- **Monthly**: $0 (free tier)
- **Pros**: No sleep, good performance
- **Cons**: Complex setup

### Local Only
- **Monthly**: $0
- **Pros**: Full control, fast development
- **Cons**: Not accessible from internet

---

## Next Steps

**Choose your path:**

### Path A: Local Development First (Recommended)
```powershell
# 1. Install PostgreSQL & Redis (see Option 3 above)
# 2. Create .env.local
# 3. Run migrations
cd d:\bitarena\packages\backend
npm run migrate

# 4. Start backend
npm run dev

# 5. Test locally with frontend
```

### Path B: Deploy to Railway Now
```powershell
# 1. Upgrade account at https://railway.com/account/plans
# 2. Add databases via dashboard
# 3. Set environment variables
# 4. Deploy
railway up

# 5. Run migrations
railway run npm run migrate:prod
```

### Path C: Use Alternative Platform
- Follow Render.com or Fly.io instructions above

---

## Questions?

Refer to these documents:
- **DEPLOYMENT_STATUS.md** - Complete system overview
- **DEPLOYMENT.md** - Full Railway deployment guide
- **README.md** - Backend technical documentation
- **SETUP_GUIDE.md** - Local PostgreSQL/Redis setup

**Project URL**: https://railway.com/project/de04bfcc-d54a-4d60-a2bb-b8c0c70b36a0

---

**Ready to proceed!** Choose your path and let's get BitArena live! 🚀
