# BitArena - Smart Contract Deployment
# This script automates the Mezo testnet deployment process

Write-Host "`n╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                   ║" -ForegroundColor Cyan
Write-Host "║" -ForegroundColor Cyan -NoNewline
Write-Host "     🎮 BitArena Contract Deployment 🎮      " -ForegroundColor Yellow -NoNewline
Write-Host "║" -ForegroundColor Cyan
Write-Host "║                                                   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Load environment
$contractsPath = "d:\bitarena\packages\contracts"
cd $contractsPath

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "`n❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "   Creating .env file now..." -ForegroundColor Yellow
    exit 1
}

# Load .env
$envContent = Get-Content ".env" | Where-Object { $_ -notmatch '^#' -and $_ -match '=' }
foreach ($line in $envContent) {
    $parts = $line -split '=', 2
    if ($parts.Length -eq 2) {
        $name = $parts[0].Trim()
        $value = $parts[1].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$rpcUrl = $env:MEZO_RPC_URL
$privateKey = $env:PRIVATE_KEY

Write-Host "`n📋 DEPLOYMENT CONFIGURATION:" -ForegroundColor Cyan
Write-Host "   Network: " -ForegroundColor White -NoNewline
Write-Host "Mezo Testnet (Chain ID: 31611)" -ForegroundColor Yellow
Write-Host "   RPC: " -ForegroundColor White -NoNewline
Write-Host "$rpcUrl" -ForegroundColor Gray

# Get deployer address and balance
Write-Host "`n🔑 DEPLOYER WALLET:" -ForegroundColor Cyan
$deployerInfo = node -e @"
const ethers = require('ethers');
const provider = new ethers.JsonRpcProvider('$rpcUrl');
const wallet = new ethers.Wallet('$privateKey', provider);
(async () => {
    const balance = await provider.getBalance(wallet.address);
    console.log(JSON.stringify({
        address: wallet.address,
        balance: ethers.formatEther(balance)
    }));
})();
"@ 2>$null

$deployer = $deployerInfo | ConvertFrom-Json
Write-Host "   Address: " -ForegroundColor White -NoNewline
Write-Host "$($deployer.address)" -ForegroundColor Yellow
Write-Host "   Balance: " -ForegroundColor White -NoNewline

$balanceNum = [decimal]$deployer.balance
if ($balanceNum -eq 0) {
    Write-Host "$($deployer.balance) MEZO" -ForegroundColor Red -NoNewline
    Write-Host " ❌" -ForegroundColor Red
    
    Write-Host "`n⚠️  INSUFFICIENT FUNDS!" -ForegroundColor Yellow
    Write-Host "`n📝 TO GET TESTNET FUNDS:" -ForegroundColor Cyan
    Write-Host "   1. Visit Mezo Discord: https://discord.gg/mezo" -ForegroundColor White
    Write-Host "   2. Go to #faucet channel" -ForegroundColor White
    Write-Host "   3. Request funds for: " -ForegroundColor White -NoNewline
    Write-Host "$($deployer.address)" -ForegroundColor Yellow
    Write-Host "`n   OR" -ForegroundColor Gray
    Write-Host "`n   1. Try Mezo Faucet (if available): https://faucet.mezo.io" -ForegroundColor White
    Write-Host "   2. Enter address: " -ForegroundColor White -NoNewline
    Write-Host "$($deployer.address)" -ForegroundColor Yellow
    Write-Host "`n💡 You need at least 0.1 MEZO for deployment" -ForegroundColor Green
    Write-Host "`n📋 COPY ADDRESS:" -ForegroundColor Magenta
    Write-Host "   $($deployer.address)" -ForegroundColor Yellow
    
    # Copy to clipboard
    Set-Clipboard -Value $deployer.address
    Write-Host "`n✅ Address copied to clipboard!" -ForegroundColor Green
    
    Write-Host "`nRun this script again after receiving funds." -ForegroundColor White
    Write-Host "`n"
    exit 1
} elseif ($balanceNum -lt 0.05) {
    Write-Host "$($deployer.balance) MEZO" -ForegroundColor Yellow -NoNewline
    Write-Host " ⚠️  (LOW)" -ForegroundColor Yellow
    Write-Host "`n⚠️  Warning: Balance is low, deployment might fail" -ForegroundColor Yellow
    Write-Host "   Recommended: At least 0.1 MEZO" -ForegroundColor Gray
} else {
    Write-Host "$($deployer.balance) MEZO" -ForegroundColor Green -NoNewline
    Write-Host " ✅" -ForegroundColor Green
}

# Confirm deployment
Write-Host "`n🚀 READY TO DEPLOY!" -ForegroundColor Green
Write-Host "`nContracts to deploy:" -ForegroundColor Cyan
Write-Host "   1. MUSDToken (test token)" -ForegroundColor White
Write-Host "   2. MatchEscrow (match management)" -ForegroundColor White
Write-Host "   3. TournamentPool (tournament management)" -ForegroundColor White

Write-Host "`n"
$confirm = Read-Host "Continue with deployment? (Y/n)"
if ($confirm -eq 'n' -or $confirm -eq 'N') {
    Write-Host "`n❌ Deployment cancelled" -ForegroundColor Red
    exit 0
}

# Deploy contracts
Write-Host "`n╔═══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           DEPLOYING TO MEZO TESTNET               ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host "`n"

npm run deploy:testnet

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n╔═══════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║          ✅ DEPLOYMENT SUCCESSFUL! ✅              ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Green
    
    # Read deployment info
    $latestDeployment = "deployments\mezo_testnet-latest.json"
    if (Test-Path $latestDeployment) {
        $deployment = Get-Content $latestDeployment | ConvertFrom-Json
        
        Write-Host "`n📋 CONTRACT ADDRESSES:" -ForegroundColor Cyan
        Write-Host "   MUSD Token:       " -ForegroundColor White -NoNewline
        Write-Host "$($deployment.contracts.MUSDToken)" -ForegroundColor Yellow
        Write-Host "   MatchEscrow:      " -ForegroundColor White -NoNewline
        Write-Host "$($deployment.contracts.MatchEscrow)" -ForegroundColor Yellow
        Write-Host "   TournamentPool:   " -ForegroundColor White -NoNewline
        Write-Host "$($deployment.contracts.TournamentPool)" -ForegroundColor Yellow
        
        # Update backend .env.local
        Write-Host "`n🔄 UPDATING BACKEND CONFIGURATION..." -ForegroundColor Cyan
        $backendEnv = "..\..\packages\backend\.env.local"
        
        if (Test-Path $backendEnv) {
            $envContent = Get-Content $backendEnv
            $envContent = $envContent -replace 'MATCH_ESCROW_ADDRESS=.*', "MATCH_ESCROW_ADDRESS=$($deployment.contracts.MatchEscrow)"
            $envContent = $envContent -replace 'TOURNAMENT_POOL_ADDRESS=.*', "TOURNAMENT_POOL_ADDRESS=$($deployment.contracts.TournamentPool)"
            $envContent = $envContent -replace 'MUSD_TOKEN_ADDRESS=.*', "MUSD_TOKEN_ADDRESS=$($deployment.contracts.MUSDToken)"
            $envContent = $envContent -replace 'ORACLE_PRIVATE_KEY=0x0000.*', "ORACLE_PRIVATE_KEY=$env:ORACLE_PRIVATE_KEY"
            $envContent | Set-Content $backendEnv
            
            Write-Host "   ✅ Backend .env.local updated!" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Backend .env.local not found" -ForegroundColor Yellow
            Write-Host "   Please update manually:" -ForegroundColor White
            Write-Host "   MATCH_ESCROW_ADDRESS=$($deployment.contracts.MatchEscrow)" -ForegroundColor Gray
            Write-Host "   TOURNAMENT_POOL_ADDRESS=$($deployment.contracts.TournamentPool)" -ForegroundColor Gray
            Write-Host "   MUSD_TOKEN_ADDRESS=$($deployment.contracts.MUSDToken)" -ForegroundColor Gray
        }
        
        Write-Host "`n🎯 NEXT STEPS:" -ForegroundColor Magenta
        Write-Host "   1. Backend should auto-restart with new addresses" -ForegroundColor White
        Write-Host "   2. Open frontend: http://localhost:3000" -ForegroundColor White
        Write-Host "   3. Connect Mezo wallet" -ForegroundColor White
        Write-Host "   4. Test creating a match!" -ForegroundColor White
        
        Write-Host "`n💡 TIP:" -ForegroundColor Green
        Write-Host "   The deployer wallet has 1M MUSD tokens." -ForegroundColor White
        Write-Host "   Transfer some to test wallets to play games!" -ForegroundColor White
    }
    
    Write-Host "`n✨ BitArena is ready to play! ✨`n" -ForegroundColor Green
} else {
    Write-Host "`n╔═══════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║            ❌ DEPLOYMENT FAILED! ❌               ║" -ForegroundColor Red
    Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Red
    
    Write-Host "`n📝 TROUBLESHOOTING:" -ForegroundColor Yellow
    Write-Host "   1. Check if you have enough MEZO for gas" -ForegroundColor White
    Write-Host "   2. Verify RPC endpoint is responsive" -ForegroundColor White
    Write-Host "   3. Check error message above" -ForegroundColor White
    Write-Host "   4. Try again: .\deploy-contracts.ps1`n" -ForegroundColor White
    
    exit 1
}
