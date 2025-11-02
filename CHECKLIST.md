# BitArena Setup Checklist

Use this checklist to track your progress setting up the complete BitArena platform.

## ☐ Prerequisites Installation

### PostgreSQL
- [ ] Downloaded PostgreSQL 16 installer
- [ ] Ran installer with default port (5432)
- [ ] Set and noted down password
- [ ] Verified installation: `psql --version`
- [ ] Service is running

### Redis
Choose ONE method:

**Option A - WSL (Recommended)**
- [ ] Installed WSL: `wsl --install`
- [ ] Installed Redis in WSL: `sudo apt install redis-server`
- [ ] Started Redis: `sudo service redis-server start`
- [ ] Verified: `redis-cli ping` returns PONG

**Option B - Docker**
- [ ] Installed Docker Desktop
- [ ] Pulled Redis: `docker pull redis:latest`
- [ ] Started container: `docker run -d -p 6379:6379 --name bitarena-redis redis`
- [ ] Verified: `docker ps` shows bitarena-redis

**Option C - Memurai**
- [ ] Downloaded Memurai from website
- [ ] Installed and started service
- [ ] Verified port 6379 is listening

---

## ☐ Database Setup

- [ ] Connected to PostgreSQL: `psql -U postgres`
- [ ] Created database: `CREATE DATABASE bitarena;`
- [ ] Exited psql: `\q`
- [ ] Database creation confirmed

---

## ☐ Environment Configuration

### Backend Configuration
- [ ] Navigated to: `d:\bitarena\packages\backend`
- [ ] Copied .env file: `Copy-Item .env.example .env`
- [ ] Opened .env in editor
- [ ] Updated `DATABASE_URL` with PostgreSQL password
- [ ] Verified `REDIS_URL=redis://localhost:6379`
- [ ] Verified `PORT=3001`
- [ ] Set `JWT_SECRET` to a random string
- [ ] Saved .env file

### Frontend Configuration
- [ ] Navigated to: `d:\bitarena\packages\frontend`
- [ ] Copied .env.local: `Copy-Item .env.local.example .env.local`
- [ ] Verified `NEXT_PUBLIC_API_URL=http://localhost:3001`
- [ ] Verified `NEXT_PUBLIC_WS_URL=ws://localhost:3001`
- [ ] Saved .env.local file

---

## ☐ Database Migration

- [ ] Navigated to backend: `cd d:\bitarena\packages\backend`
- [ ] Ran migration: `npm run migrate`
- [ ] Saw "Migration completed successfully" message
- [ ] Verified tables created: `psql -U postgres -d bitarena -c "\dt"`
- [ ] Saw 6 tables listed (users, matches, tournaments, etc.)

---

## ☐ Database Seeding

- [ ] Ran seed script: `npm run seed`
- [ ] Saw "Database seeded successfully" message
- [ ] 4 test users created
- [ ] 3 test matches created
- [ ] 1 test tournament created

---

## ☐ Service Verification

### PostgreSQL Check
- [ ] Ran: `psql -U postgres -d bitarena -c "SELECT version();"`
- [ ] Got PostgreSQL version output
- [ ] No connection errors

### Redis Check
- [ ] Ran: `redis-cli ping` (or `wsl redis-cli ping`)
- [ ] Got "PONG" response
- [ ] No connection errors

---

## ☐ Start Backend Server

- [ ] Opened new PowerShell terminal
- [ ] Navigated to: `cd d:\bitarena\packages\backend`
- [ ] Ran: `npm run dev`
- [ ] Saw "✅ Redis connected successfully"
- [ ] Saw "✅ Database connected successfully"
- [ ] Saw "✅ WebSocket server started on port 3001"
- [ ] Saw "🎮 Game server initialized"
- [ ] No error messages
- [ ] Terminal is running (don't close!)

---

## ☐ Start Frontend Server

- [ ] Opened ANOTHER new PowerShell terminal
- [ ] Navigated to: `cd d:\bitarena\packages\frontend`
- [ ] Ran: `npm run dev`
- [ ] Saw "Next.js 16.0.0 (Turbopack)"
- [ ] Saw "Local: http://localhost:3000"
- [ ] Saw "Ready in xxxx ms"
- [ ] No error messages
- [ ] Terminal is running (don't close!)

---

## ☐ Test Frontend

- [ ] Opened browser: http://localhost:3000
- [ ] Saw landing page with hero section
- [ ] Saw "⚔️ BitArena" title
- [ ] Saw "Enter Lobby" and "View Leaderboard" buttons
- [ ] Saw 3 game feature cards
- [ ] Clicked "Enter Lobby"
- [ ] Lobby page loaded successfully
- [ ] No console errors (press F12 to check)

---

## ☐ Test Backend API

- [ ] Opened: http://localhost:3001/health
- [ ] Saw: `{"status":"ok"}` response
- [ ] Opened: http://localhost:3001/api/matches (might be empty array)
- [ ] No 404 or 500 errors

---

## ☐ Test Database Data

- [ ] Ran: `psql -U postgres -d bitarena`
- [ ] Ran: `SELECT * FROM users;`
- [ ] Saw 4 test users (PlayerOne, GameMaster, NoobSlayer, ProGamer)
- [ ] Ran: `SELECT * FROM matches;`
- [ ] Saw 3 test matches
- [ ] Ran: `\q` to exit

---

## ☐ Smart Contract Deployment (Optional - if you have testnet ETH)

- [ ] Navigated to: `cd d:\bitarena\packages\contracts`
- [ ] Ran: `npm run deploy:testnet`
- [ ] Deployment successful
- [ ] Noted contract addresses:
  - MatchEscrow: ___________________
  - TournamentPool: ___________________
  - MUSDToken: ___________________
- [ ] Updated `packages/backend/.env` with contract addresses
- [ ] Updated `packages/frontend/.env.local` with contract addresses
- [ ] Restarted backend server
- [ ] Restarted frontend server

---

## ☐ Full System Test

- [ ] Both backend and frontend servers running
- [ ] Opened http://localhost:3000
- [ ] Clicked "Enter Lobby"
- [ ] Can see match list (might be empty if no backend)
- [ ] Clicked "Create Match" button
- [ ] Form appears
- [ ] No JavaScript errors in console
- [ ] WebSocket connected (check browser console for ws:// connection)

---

## ☐ Running Services Summary

At this point, you should have:

- [x] PostgreSQL service running (port 5432)
- [x] Redis service running (port 6379)
- [x] Backend server running (port 3001) - Terminal 1
- [x] Frontend server running (port 3000) - Terminal 2
- [x] Browser open at localhost:3000
- [x] All systems operational! 🎉

---

## 🎯 Success Criteria

You've successfully completed setup when:

✅ All 4 services are running without errors
✅ Frontend loads at localhost:3000
✅ Backend responds at localhost:3001/health
✅ Database has test data
✅ No connection errors in any terminal
✅ Browser shows BitArena landing page

---

## 📝 Notes & Issues

Use this space to track any problems or configuration changes:

```
Problem:
________________________________________

Solution:
________________________________________

---

Problem:
________________________________________

Solution:
________________________________________
```

---

## 🚀 Next Steps After Setup

Once everything is working:

1. **Read the documentation:**
   - [ ] Read `SETUP_GUIDE.md` for detailed info
   - [ ] Review `QUICKSTART.md` for common tasks
   - [ ] Check `README.md` for project overview

2. **Explore the code:**
   - [ ] Review `packages/frontend/app` for pages
   - [ ] Check `packages/backend/src` for API routes
   - [ ] Look at `packages/contracts/contracts` for smart contracts

3. **Test the features:**
   - [ ] Try creating a match
   - [ ] View tournaments
   - [ ] Check leaderboard (when implemented)
   - [ ] Test WebSocket connection

4. **Development workflow:**
   - [ ] Make a code change in frontend (auto-reloads)
   - [ ] Make a code change in backend (auto-reloads)
   - [ ] Run contract tests: `npm test`
   - [ ] Commit your changes with git

5. **Deploy to production:**
   - [ ] Deploy frontend to Vercel
   - [ ] Deploy backend to Railway
   - [ ] Set up production database
   - [ ] Deploy contracts to mainnet

---

**Congratulations! You're ready to build on BitArena! 🎮⚔️**
