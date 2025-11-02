# BitArena Backend - Quick Deploy to Railway
# Run this script to deploy your backend

Write-Host "`n🚀 BitArena Backend Deployment" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if Railway CLI is installed
$railwayCli = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayCli) {
    Write-Host "❌ Railway CLI not found!" -ForegroundColor Red
    Write-Host "`nInstalling Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Railway CLI" -ForegroundColor Red
        Write-Host "Please install manually: npm install -g @railway/cli" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Railway CLI installed`n" -ForegroundColor Green
}

# Navigate to backend directory
Set-Location "d:\bitarena\packages\backend"

Write-Host "📂 Current directory: $(Get-Location)`n" -ForegroundColor Gray

# Step 1: Login to Railway
Write-Host "Step 1: Login to Railway" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Gray
Write-Host "Opening browser for authentication...`n" -ForegroundColor Gray

railway login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Login failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Logged in successfully`n" -ForegroundColor Green

# Step 2: Initialize project
Write-Host "Step 2: Initialize Railway Project" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Gray

$initChoice = Read-Host "Do you want to create a new project? (y/n)"

if ($initChoice -eq "y") {
    Write-Host "`nCreating new Railway project..." -ForegroundColor Gray
    railway init
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Project initialization failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Project created`n" -ForegroundColor Green
} else {
    Write-Host "`nLinking to existing project..." -ForegroundColor Gray
    railway link
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Project linking failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Project linked`n" -ForegroundColor Green
}

# Step 3: Add PostgreSQL
Write-Host "Step 3: Add PostgreSQL Database" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Gray
Write-Host "Please add PostgreSQL in Railway dashboard:" -ForegroundColor White
Write-Host "1. Go to https://railway.app/dashboard" -ForegroundColor Gray
Write-Host "2. Click your project" -ForegroundColor Gray
Write-Host "3. Click '+ New' → 'Database' → 'PostgreSQL'" -ForegroundColor Gray
Write-Host "4. Wait for it to provision`n" -ForegroundColor Gray

Read-Host "Press Enter when PostgreSQL is added"

# Step 4: Add Redis
Write-Host "`nStep 4: Add Redis Database" -ForegroundColor Yellow
Write-Host "===========================" -ForegroundColor Gray
Write-Host "Please add Redis in Railway dashboard:" -ForegroundColor White
Write-Host "1. Click '+ New' → 'Database' → 'Redis'" -ForegroundColor Gray
Write-Host "2. Wait for it to provision`n" -ForegroundColor Gray

Read-Host "Press Enter when Redis is added"

# Step 5: Set environment variables
Write-Host "`nStep 5: Configure Environment Variables" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray
Write-Host "Setting environment variables...`n" -ForegroundColor Gray

# Set NODE_ENV
railway variables set NODE_ENV=production

# Set JWT_SECRET
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
railway variables set JWT_SECRET=$jwtSecret
Write-Host "✅ Generated JWT_SECRET" -ForegroundColor Green

# Prompt for other variables
Write-Host "`nPlease provide the following information:`n" -ForegroundColor White

$frontendUrl = Read-Host "Frontend URL (e.g., https://bitarena.vercel.app)"
railway variables set FRONTEND_URL=$frontendUrl

$mezoClientId = Read-Host "Mezo Client ID (default: bitarena-testnet)"
if ([string]::IsNullOrWhiteSpace($mezoClientId)) { $mezoClientId = "bitarena-testnet" }
railway variables set MEZO_CLIENT_ID=$mezoClientId

$mezoSecret = Read-Host "Mezo Client Secret"
railway variables set MEZO_CLIENT_SECRET=$mezoSecret

$mezoRedirect = "$frontendUrl/auth/callback"
railway variables set MEZO_REDIRECT_URI=$mezoRedirect

$oracleKey = Read-Host "Oracle Private Key (with 0x prefix)"
railway variables set ORACLE_PRIVATE_KEY=$oracleKey

$matchEscrow = Read-Host "MatchEscrow Contract Address"
railway variables set MATCH_ESCROW_ADDRESS=$matchEscrow

$tournamentPool = Read-Host "TournamentPool Contract Address"
railway variables set TOURNAMENT_POOL_ADDRESS=$tournamentPool

$musdToken = Read-Host "MUSD Token Address"
railway variables set MUSD_TOKEN_ADDRESS=$musdToken

Write-Host "`n✅ Environment variables configured`n" -ForegroundColor Green

# Step 6: Deploy
Write-Host "Step 6: Deploy Backend" -ForegroundColor Yellow
Write-Host "=======================" -ForegroundColor Gray
Write-Host "Deploying to Railway...`n" -ForegroundColor Gray

railway up

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Deployment initiated`n" -ForegroundColor Green

# Step 7: Run migrations
Write-Host "Step 7: Run Database Migrations" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Gray
Write-Host "Waiting for deployment to complete...`n" -ForegroundColor Gray

Start-Sleep -Seconds 30

Write-Host "Running migrations..." -ForegroundColor Gray
railway run npm run migrate:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Migration failed - you may need to run it manually" -ForegroundColor Yellow
} else {
    Write-Host "✅ Migrations completed`n" -ForegroundColor Green
}

# Step 8: Get deployment URL
Write-Host "Step 8: Get Backend URL" -ForegroundColor Yellow
Write-Host "=======================" -ForegroundColor Gray

Write-Host "`nFetching your backend URL..." -ForegroundColor Gray
railway status

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Get your backend URL: railway domain" -ForegroundColor Gray
Write-Host "2. Test health endpoint: https://your-app.up.railway.app/health" -ForegroundColor Gray
Write-Host "3. Update frontend .env.local with your backend URL" -ForegroundColor Gray
Write-Host "4. (Optional) Seed test data: railway run npm run seed:prod`n" -ForegroundColor Gray

Write-Host "Useful commands:" -ForegroundColor White
Write-Host "  railway logs           - View logs" -ForegroundColor Gray
Write-Host "  railway open           - Open dashboard" -ForegroundColor Gray
Write-Host "  railway domain         - Get your URL" -ForegroundColor Gray
Write-Host "  railway status         - Check status`n" -ForegroundColor Gray

Write-Host "📚 For detailed docs, see DEPLOYMENT.md`n" -ForegroundColor Cyan

# Open Railway dashboard
$openDashboard = Read-Host "Open Railway dashboard? (y/n)"
if ($openDashboard -eq "y") {
    railway open
}

Write-Host "`n🎉 Happy deploying!" -ForegroundColor Green
