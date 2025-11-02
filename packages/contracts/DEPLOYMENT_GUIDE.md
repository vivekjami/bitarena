# 🚀 Smart Contract Deployment Guide - Mezo Testnet

## Current Status

✅ **Configuration Complete**
- Network: Mezo Testnet (Chain ID: 31611)
- RPC URL: Configured
- Wallets: Generated
- Deployment script: Ready

## 📋 Deployment Information

### Generated Wallets

**Deployer Wallet:**
- Address: `0x1015F33148163c9537bF88B394a1eDAe48a16832`
- Private Key: Already saved in `.env`
- Use: Deploy contracts, pay gas fees

**Oracle Wallet:**
- Address: `0x372cA9E0c6c649188001f79D2609f03F504383Eb`
- Private Key: Already saved in `.env`
- Use: Submit match results on-chain

---

## 🎯 Option 1: Use Generated Wallets (Recommended for Testing)

### Step 1: Get Testnet Funds

**Mezo Testnet Faucet Options:**

1. **Official Mezo Faucet** (if available)
   - Visit: https://faucet.mezo.io
   - Enter: `0x1015F33148163c9537bF88B394a1eDAe48a16832`
   - Request testnet MEZO tokens

2. **Mezo Discord Faucet**
   - Join Mezo Discord: https://discord.gg/mezo
   - Find #faucet channel
   - Post: `!faucet 0x1015F33148163c9537bF88B394a1eDAe48a16832`

3. **Ask in Community**
   - Mezo Telegram/Discord
   - Request testnet tokens for deployment

### Step 2: Verify Balance

After receiving testnet funds, check balance:

```powershell
cd d:\bitarena\packages\contracts

node -e "const ethers = require('ethers'); const provider = new ethers.JsonRpcProvider('https://spectrum-01.simplystaking.xyz/dHRqZWVlZ3ktMDEtYjdhZWU5NjI/jDSW6NtCUlHIqQ/mezo/testnet/'); provider.getBalance('0x1015F33148163c9537bF88B394a1eDAe48a16832').then(b => console.log('Balance:', ethers.formatEther(b), 'MEZO'));"
```

You need at least **0.1 MEZO** for deployment (gas fees).

### Step 3: Deploy Contracts

Once you have testnet funds:

```powershell
cd d:\bitarena\packages\contracts
npm run deploy:testnet
```

This will deploy:
1. ✅ MUSDToken (test token)
2. ✅ MatchEscrow (match management)
3. ✅ TournamentPool (tournament management)

---

## 🔑 Option 2: Use Your Own Funded Wallet

If you already have a Mezo testnet wallet with funds:

### Step 1: Update .env

Edit `packages/contracts/.env`:

```env
# Replace with your private key
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Keep oracle key or use your own
ORACLE_PRIVATE_KEY=0x1fb780dc8ff481921a769e641a238ae9bf8fde95e69d13e7328f323cb91e8804
```

### Step 2: Deploy

```powershell
cd d:\bitarena\packages\contracts
npm run deploy:testnet
```

---

## 📊 After Deployment

### Automatic Updates

The deployment script will automatically:
1. ✅ Deploy all 3 contracts
2. ✅ Save addresses to `deployments/mezo_testnet-latest.json`
3. ✅ Print contract addresses

### Manual Backend Configuration

After deployment completes, copy the contract addresses and update backend `.env.local`:

**File**: `packages/backend/.env.local`

```env
# Update these with deployed addresses
MATCH_ESCROW_ADDRESS=0x... (from deployment output)
TOURNAMENT_POOL_ADDRESS=0x... (from deployment output)
MUSD_TOKEN_ADDRESS=0x... (from deployment output)

# Update oracle key
ORACLE_PRIVATE_KEY=0x1fb780dc8ff481921a769e641a238ae9bf8fde95e69d13e7328f323cb91e8804
```

### Restart Backend

```powershell
# Backend should auto-restart if running
# Or manually restart if needed
cd d:\bitarena\packages\backend
npm run dev
```

---

## 🔍 Verify Deployment

### Check Contract Addresses

```powershell
# View deployment info
cat d:\bitarena\packages\contracts\deployments\mezo_testnet-latest.json
```

### Test Contract Interaction

```powershell
cd d:\bitarena\packages\contracts

# Check MUSD token supply
node -e "const ethers = require('ethers'); const provider = new ethers.JsonRpcProvider(process.env.MEZO_RPC_URL); const abi = ['function totalSupply() view returns (uint256)']; const token = new ethers.Contract('MUSD_ADDRESS_HERE', abi, provider); token.totalSupply().then(s => console.log('Total Supply:', ethers.formatEther(s)));"
```

---

## 🛠️ Troubleshooting

### "Insufficient Funds" Error

**Problem**: Not enough testnet MEZO for gas

**Solution**:
1. Request more from faucet
2. Check balance with verification command above
3. Wait for transaction confirmation

### "Nonce Too High" Error

**Problem**: Transaction ordering issue

**Solution**:
```powershell
# Clear Hardhat cache
cd d:\bitarena\packages\contracts
npm run clean
npx hardhat clean
```

### "Network Error" or Timeout

**Problem**: RPC endpoint not responding

**Solution**:
Try alternative RPC endpoints in `.env`:
```env
# Try North America endpoint
MEZO_RPC_URL=https://spectrum-03.simplystaking.xyz/dHRqZWVlZ3ktMDMtYjdhZWU5NjI/xiqlKfi-mhGweg/mezo/testnet/

# Or Central Europe
MEZO_RPC_URL=https://spectrum-02.simplystaking.xyz/dHRqZWVlZ3ktMDItYjdhZWU5NjI/Z3ITZSBUdeUXbg/mezo/testnet/
```

### Deployment Partially Fails

**Problem**: One contract deployed, others failed

**Solution**:
1. Check which contracts deployed in `deployments/` folder
2. Edit `scripts/deploy.js` to skip deployed contracts
3. Redeploy only failed contracts

---

## 📝 Deployment Checklist

Before deploying:
- [ ] Testnet funds received (min 0.1 MEZO)
- [ ] Balance verified
- [ ] `.env` file configured
- [ ] RPC endpoint tested

After deploying:
- [ ] All 3 contracts deployed
- [ ] Addresses saved to `deployments/`
- [ ] Backend `.env.local` updated
- [ ] Backend restarted
- [ ] Frontend tested with contracts

---

## 🎮 Integration Testing

After deployment and backend restart:

1. **Open Frontend**: http://localhost:3000
2. **Connect Wallet**: Use Mezo Passport
3. **Get Test MUSD**: 
   ```solidity
   // The deployer has 1M MUSD tokens
   // Transfer some to test wallets
   ```
4. **Create Match**: Try creating a match
5. **Verify On-Chain**: Check match creation on Mezo explorer

---

## 🌐 Mezo Testnet Resources

- **Chain ID**: 31611
- **RPC**: https://spectrum-01.simplystaking.xyz/.../mezo/testnet/
- **Faucet**: https://faucet.mezo.io (if available)
- **Discord**: https://discord.gg/mezo
- **Docs**: https://docs.mezo.io

---

## 🚀 Quick Deploy Commands

```powershell
# 1. Get testnet funds (manual step - use faucet)

# 2. Check balance
cd d:\bitarena\packages\contracts
node -e "const ethers = require('ethers'); require('dotenv').config(); const provider = new ethers.JsonRpcProvider(process.env.MEZO_RPC_URL); const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider); wallet.provider.getBalance(wallet.address).then(b => console.log('Balance:', ethers.formatEther(b), 'MEZO'));"

# 3. Deploy contracts
npm run deploy:testnet

# 4. View deployment info
cat deployments\mezo_testnet-latest.json

# 5. Update backend (copy addresses from deployment)
code ..\backend\.env.local

# 6. Backend auto-restarts or manually:
cd ..\backend
npm run dev
```

---

**Ready to deploy once you have testnet funds!** 🎉

Get testnet MEZO from the faucet, then run `npm run deploy:testnet`.
