/**
 * Complete End-to-End Integration Test
 * Tests: Database → Redis → Backend → Smart Contracts
 */

import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { ethers } from 'ethers';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function log(msg: string, color = RESET) {
  console.log(`${color}${msg}${RESET}`);
}

async function testDatabase(): Promise<boolean> {
  log(`\n${CYAN}━━━ 1. PostgreSQL Database Test ━━━${RESET}`);
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  
  try {
    // Test connection
    const result = await pool.query('SELECT NOW() as time, version() as version');
    log(`${GREEN}✓${RESET} Connected to PostgreSQL`);
    log(`  Time: ${result.rows[0].time}`);
    
    // Check tables
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    log(`${GREEN}✓${RESET} Tables found: ${tables.rows.length}`);
    tables.rows.forEach(row => log(`  - ${row.table_name}`, YELLOW));
    
    // Check test data
    const users = await pool.query('SELECT COUNT(*) as count FROM users');
    const matches = await pool.query('SELECT COUNT(*) as count FROM matches');
    log(`${GREEN}✓${RESET} Test data: ${users.rows[0].count} users, ${matches.rows[0].count} matches`);
    
    await pool.end();
    return true;
  } catch (error) {
    log(`${RED}✗${RESET} Database test failed: ${error}`, RED);
    return false;
  }
}

async function testRedis(): Promise<boolean> {
  log(`\n${CYAN}━━━ 2. Redis Cache Test ━━━${RESET}`);
  
  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  });
  
  try {
    // Test ping
    const pong = await redis.ping();
    log(`${GREEN}✓${RESET} Redis PING: ${pong}`);
    
    // Test set/get
    const testKey = 'test:integration:' + Date.now();
    await redis.set(testKey, 'test-value', 'EX', 60);
    const value = await redis.get(testKey);
    log(`${GREEN}✓${RESET} Set/Get test: ${value}`);
    
    await redis.del(testKey);
    await redis.quit();
    return true;
  } catch (error) {
    log(`${RED}✗${RESET} Redis test failed: ${error}`, RED);
    return false;
  }
}

async function testBackend(): Promise<boolean> {
  log(`\n${CYAN}━━━ 3. Backend API Test ━━━${RESET}`);
  
  const serverIp = process.env.DB_HOST || 'localhost';
  const serverPort = process.env.SERVER_PORT || '3001';
  const baseUrl = `http://${serverIp}:${serverPort}`;
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${baseUrl}/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    
    const healthData: any = await healthResponse.json();
    log(`${GREEN}✓${RESET} Backend health: ${healthData.status}`);
    log(`  Database: ${healthData.services?.database}`, YELLOW);
    log(`  Redis: ${healthData.services?.redis}`, YELLOW);
    
    log(`${GREEN}✓${RESET} Backend accessible at: ${baseUrl}`);
    log(`${GREEN}✓${RESET} WebSocket at: ws://${serverIp}:${serverPort}`);
    
    return true;
  } catch (error) {
    log(`${RED}✗${RESET} Backend test failed: ${error}`, RED);
    log(`  Make sure backend is running: npm run dev`, YELLOW);
    return false;
  }
}

async function testContracts(): Promise<boolean> {
  log(`\n${CYAN}━━━ 4. Smart Contracts Test ━━━${RESET}`);
  
  try {
    const provider = new ethers.JsonRpcProvider(process.env.MEZO_RPC_URL);
    
    // Load ABIs
    const MUSDToken = require('../../contracts/artifacts/contracts/MUSDToken.sol/MUSDToken.json');
    const MatchEscrow = require('../../contracts/artifacts/contracts/MatchEscrow.sol/MatchEscrow.json');
    const TournamentPool = require('../../contracts/artifacts/contracts/TournamentPool.sol/TournamentPool.json');
    
    // Create contract instances
    const musd = new ethers.Contract(process.env.MUSD_TOKEN_ADDRESS!, MUSDToken.abi, provider);
    const matchEscrow = new ethers.Contract(process.env.MATCH_ESCROW_ADDRESS!, MatchEscrow.abi, provider);
    const tournamentPool = new ethers.Contract(process.env.TOURNAMENT_POOL_ADDRESS!, TournamentPool.abi, provider);
    
    // Test MUSD
    const [name, symbol, totalSupply, decimals] = await Promise.all([
      musd.name(),
      musd.symbol(),
      musd.totalSupply(),
      musd.decimals()
    ]);
    
    log(`${GREEN}✓${RESET} MUSD Token: ${name} (${symbol})`);
    log(`  Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`, YELLOW);
    
    // Test MatchEscrow
    const matchCounter = await matchEscrow.matchCounter();
    log(`${GREEN}✓${RESET} MatchEscrow: ${matchCounter} matches created`);
    
    // Test TournamentPool
    const tournamentCounter = await tournamentPool.tournamentCounter();
    log(`${GREEN}✓${RESET} TournamentPool: ${tournamentCounter} tournaments created`);
    
    // Test Oracle wallet
    const oracleWallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY!, provider);
    const oracleBalance = await provider.getBalance(oracleWallet.address);
    log(`${GREEN}✓${RESET} Oracle wallet: ${oracleWallet.address}`);
    log(`  Balance: ${ethers.formatEther(oracleBalance)} MEZO`, YELLOW);
    
    return true;
  } catch (error) {
    log(`${RED}✗${RESET} Smart contracts test failed: ${error}`, RED);
    return false;
  }
}

async function runFullTest() {
  log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}`);
  log(`${BOLD}${CYAN}║                                                              ║${RESET}`);
  log(`${BOLD}${CYAN}║        BitArena - Complete Integration Test Suite            ║${RESET}`);
  log(`${BOLD}${CYAN}║                                                              ║${RESET}`);
  log(`${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}`);
  
  const results = {
    database: await testDatabase(),
    redis: await testRedis(),
    backend: await testBackend(),
    contracts: await testContracts(),
  };
  
  // Summary
  log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}`);
  log(`${BOLD}${CYAN}║                      TEST RESULTS                            ║${RESET}`);
  log(`${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}\n`);
  
  const tests = [
    { name: 'PostgreSQL Database', result: results.database },
    { name: 'Redis Cache', result: results.redis },
    { name: 'Backend API', result: results.backend },
    { name: 'Smart Contracts', result: results.contracts },
  ];
  
  tests.forEach(test => {
    const status = test.result ? `${GREEN}PASS ✓${RESET}` : `${RED}FAIL ✗${RESET}`;
    log(`  ${test.name.padEnd(30)} ${status}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    log(`\n${BOLD}${GREEN}╔══════════════════════════════════════════════════════════════╗${RESET}`);
    log(`${BOLD}${GREEN}║                                                              ║${RESET}`);
    log(`${BOLD}${GREEN}║     🎉 ALL TESTS PASSED - SYSTEM FULLY OPERATIONAL! 🎉      ║${RESET}`);
    log(`${BOLD}${GREEN}║                                                              ║${RESET}`);
    log(`${BOLD}${GREEN}╚══════════════════════════════════════════════════════════════╝${RESET}\n`);
    
    log(`${BOLD}${YELLOW}📡 Network Access (Remote Desktop Compatible):${RESET}`);
    log(`   Backend API:  http://172.16.1.235:3001`);
    log(`   Frontend:     http://172.16.1.235:3000`);
    log(`   WebSocket:    ws://172.16.1.235:3001`);
    log(`   PostgreSQL:   172.16.1.235:5432`);
    log(`   Redis:        172.16.1.235:6379\n`);
    
    log(`${BOLD}${YELLOW}🔗 Deployed Contracts (Mezo Testnet):${RESET}`);
    log(`   MUSD:           ${process.env.MUSD_TOKEN_ADDRESS}`);
    log(`   MatchEscrow:    ${process.env.MATCH_ESCROW_ADDRESS}`);
    log(`   TournamentPool: ${process.env.TOURNAMENT_POOL_ADDRESS}\n`);
    
    log(`${GREEN}✅ System ready for remote access and gameplay!${RESET}\n`);
  } else {
    log(`\n${BOLD}${RED}⚠️  SOME TESTS FAILED${RESET}\n`);
    log(`${YELLOW}Check the logs above for details.${RESET}\n`);
  }
  
  process.exit(allPassed ? 0 : 1);
}

runFullTest().catch(error => {
  log(`\n${RED}✗ Test suite crashed: ${error}${RESET}`, RED);
  console.error(error);
  process.exit(1);
});
