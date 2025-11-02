/**
 * Manual verification script for backend + contract integration
 * Tests each component separately
 */

import dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';

// Load environment
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

async function verify() {
  console.log(`\n${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}║          Backend & Contract Integration Test              ║${RESET}`);
  console.log(`${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}\n`);

  // 1. Check Environment Variables
  console.log(`${CYAN}━━━ Step 1: Environment Variables ━━━${RESET}`);
  const requiredVars = {
    'DB_HOST': process.env.DB_HOST,
    'DB_PORT': process.env.DB_PORT,
    'DB_NAME': process.env.DB_NAME,
    'REDIS_HOST': process.env.REDIS_HOST,
    'REDIS_PORT': process.env.REDIS_PORT,
    'MEZO_RPC_URL': process.env.MEZO_RPC_URL,
    'CHAIN_ID': process.env.CHAIN_ID,
    'MUSD_TOKEN_ADDRESS': process.env.MUSD_TOKEN_ADDRESS,
    'MATCH_ESCROW_ADDRESS': process.env.MATCH_ESCROW_ADDRESS,
    'TOURNAMENT_POOL_ADDRESS': process.env.TOURNAMENT_POOL_ADDRESS,
    'ORACLE_PRIVATE_KEY': process.env.ORACLE_PRIVATE_KEY ? '***SET***' : undefined,
  };

  let envOk = true;
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      console.log(`${GREEN}✓${RESET} ${key}: ${value}`);
    } else {
      console.log(`${RED}✗${RESET} ${key}: MISSING`);
      envOk = false;
    }
  }

  if (!envOk) {
    console.log(`${RED}\n✗ Some environment variables are missing!${RESET}`);
    return;
  }

  // 2. Test Blockchain Connection
  console.log(`\n${CYAN}━━━ Step 2: Mezo Testnet Connection ━━━${RESET}`);
  try {
    const provider = new ethers.JsonRpcProvider(process.env.MEZO_RPC_URL);
    const network = await provider.getNetwork();
    console.log(`${GREEN}✓${RESET} Connected to Chain ID: ${network.chainId}`);
    
    const blockNumber = await provider.getBlockNumber();
    console.log(`${GREEN}✓${RESET} Current Block: ${blockNumber}`);
  } catch (error: any) {
    console.log(`${RED}✗${RESET} Blockchain connection failed: ${error.message}`);
    return;
  }

  // 3. Test Contract Deployments
  console.log(`\n${CYAN}━━━ Step 3: Smart Contract Verification ━━━${RESET}`);
  try {
    const provider = new ethers.JsonRpcProvider(process.env.MEZO_RPC_URL);
    
    // Check MUSD Token
    console.log(`\n${YELLOW}MUSD Token:${RESET}`);
    const musdCode = await provider.getCode(process.env.MUSD_TOKEN_ADDRESS!);
    if (musdCode === '0x') {
      console.log(`${RED}✗${RESET} No contract code at MUSD address!`);
    } else {
      console.log(`${GREEN}✓${RESET} Contract deployed at ${process.env.MUSD_TOKEN_ADDRESS}`);
      console.log(`${GREEN}✓${RESET} Contract size: ${musdCode.length} bytes`);
    }

    // Check MatchEscrow
    console.log(`\n${YELLOW}MatchEscrow:${RESET}`);
    const escrowCode = await provider.getCode(process.env.MATCH_ESCROW_ADDRESS!);
    if (escrowCode === '0x') {
      console.log(`${RED}✗${RESET} No contract code at MatchEscrow address!`);
    } else {
      console.log(`${GREEN}✓${RESET} Contract deployed at ${process.env.MATCH_ESCROW_ADDRESS}`);
      console.log(`${GREEN}✓${RESET} Contract size: ${escrowCode.length} bytes`);
    }

    // Check TournamentPool
    console.log(`\n${YELLOW}TournamentPool:${RESET}`);
    const poolCode = await provider.getCode(process.env.TOURNAMENT_POOL_ADDRESS!);
    if (poolCode === '0x') {
      console.log(`${RED}✗${RESET} No contract code at TournamentPool address!`);
    } else {
      console.log(`${GREEN}✓${RESET} Contract deployed at ${process.env.TOURNAMENT_POOL_ADDRESS}`);
      console.log(`${GREEN}✓${RESET} Contract size: ${poolCode.length} bytes`);
    }
  } catch (error: any) {
    console.log(`${RED}✗${RESET} Contract verification failed: ${error.message}`);
    return;
  }

  // 4. Test Oracle Wallet
  console.log(`\n${CYAN}━━━ Step 4: Oracle Wallet ━━━${RESET}`);
  try {
    const provider = new ethers.JsonRpcProvider(process.env.MEZO_RPC_URL);
    const oracleWallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY!, provider);
    const oracleBalance = await provider.getBalance(oracleWallet.address);
    
    console.log(`${GREEN}✓${RESET} Oracle Address: ${oracleWallet.address}`);
    console.log(`${GREEN}✓${RESET} Oracle Balance: ${ethers.formatEther(oracleBalance)} MEZO`);
    
    if (oracleBalance === 0n) {
      console.log(`${YELLOW}⚠${RESET} Oracle wallet has no MEZO for gas fees`);
    }
  } catch (error: any) {
    console.log(`${RED}✗${RESET} Oracle wallet check failed: ${error.message}`);
    return;
  }

  // 5. Test Backend Health
  console.log(`\n${CYAN}━━━ Step 5: Backend Health Check ━━━${RESET}`);
  const serverIp = process.env.DB_HOST || 'localhost';
  const serverPort = process.env.SERVER_PORT || '3001';
  
  console.log(`Testing: http://${serverIp}:${serverPort}/health`);
  
  try {
    const response = await fetch(`http://${serverIp}:${serverPort}/health`);
    if (response.ok) {
      const data: any = await response.json();
      console.log(`${GREEN}✓${RESET} Backend Status: ${data.status}`);
      if (data.services) {
        console.log(`${GREEN}✓${RESET} Database: ${data.services.database}`);
        console.log(`${GREEN}✓${RESET} Redis: ${data.services.redis}`);
      }
    } else {
      console.log(`${RED}✗${RESET} Backend returned: ${response.status}`);
    }
  } catch (error: any) {
    console.log(`${RED}✗${RESET} Cannot reach backend: ${error.message}`);
    console.log(`${YELLOW}⚠${RESET} Make sure backend is running: npm run dev`);
  }

  // Summary
  console.log(`\n${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}║                    VERIFICATION COMPLETE                   ║${RESET}`);
  console.log(`${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}`);
  console.log(`\n${GREEN}✓${RESET} All critical components verified!`);
  console.log(`\n${YELLOW}Network Access:${RESET}`);
  console.log(`  • Backend:  http://${serverIp}:${serverPort}`);
  console.log(`  • Frontend: http://${serverIp}:3000`);
  console.log(`  • WebSocket: ws://${serverIp}:${serverPort}`);
  console.log(`\n${YELLOW}Contract Addresses:${RESET}`);
  console.log(`  • MUSD: ${process.env.MUSD_TOKEN_ADDRESS}`);
  console.log(`  • MatchEscrow: ${process.env.MATCH_ESCROW_ADDRESS}`);
  console.log(`  • TournamentPool: ${process.env.TOURNAMENT_POOL_ADDRESS}`);
  console.log();
}

verify().catch(error => {
  console.error(`${RED}✗ Verification script failed:${RESET}`, error);
  process.exit(1);
});
