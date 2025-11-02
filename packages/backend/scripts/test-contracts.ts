/**
 * Test script to verify backend integration with deployed smart contracts
 */

import dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import { db, redis } from '../src/config/database';

// Load environment
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config();

// Import ABIs
const MUSDTokenABI = require('../../contracts/artifacts/contracts/MUSDToken.sol/MUSDToken.json').abi;
const MatchEscrowABI = require('../../contracts/artifacts/contracts/MatchEscrow.sol/MatchEscrow.json').abi;
const TournamentPoolABI = require('../../contracts/artifacts/contracts/TournamentPool.sol/TournamentPool.json').abi;

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function testDatabaseConnection() {
  try {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('  Testing Database Connection', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    
    const result = await db.query('SELECT NOW() as time, current_database() as database');
    log(`✓ Database: ${result.rows[0].database}`, 'green');
    log(`✓ Connected at: ${result.rows[0].time}`, 'green');
    
    // Check tables
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    log(`✓ Tables found: ${tables.rows.length}`, 'green');
    tables.rows.forEach(row => {
      log(`  - ${row.table_name}`, 'blue');
    });
    
    return true;
  } catch (error) {
    log(`✗ Database connection failed: ${error}`, 'red');
    return false;
  }
}

async function testRedisConnection() {
  try {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('  Testing Redis Connection', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    
    const pong = await redis.ping();
    log(`✓ Redis: ${pong}`, 'green');
    
    // Test set/get
    await redis.set('test:key', 'test-value', 'EX', 10);
    const value = await redis.get('test:key');
    log(`✓ Set/Get test: ${value}`, 'green');
    
    return true;
  } catch (error) {
    log(`✗ Redis connection failed: ${error}`, 'red');
    return false;
  }
}

async function testContractConnections() {
  try {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('  Testing Smart Contract Connections', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    
    const rpcUrl = process.env.MEZO_RPC_URL;
    const chainId = process.env.CHAIN_ID;
    const musdAddress = process.env.MUSD_TOKEN_ADDRESS;
    const matchEscrowAddress = process.env.MATCH_ESCROW_ADDRESS;
    const tournamentPoolAddress = process.env.TOURNAMENT_POOL_ADDRESS;
    const oracleKey = process.env.ORACLE_PRIVATE_KEY;
    
    log(`\nNetwork Configuration:`, 'yellow');
    log(`  RPC URL: ${rpcUrl}`, 'blue');
    log(`  Chain ID: ${chainId}`, 'blue');
    
    if (!rpcUrl || !musdAddress || !matchEscrowAddress || !tournamentPoolAddress) {
      log('✗ Missing contract addresses or RPC URL', 'red');
      return false;
    }
    
    // Connect to provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Test connection
    const network = await provider.getNetwork();
    log(`\n✓ Connected to network: ${network.name} (Chain ID: ${network.chainId})`, 'green');
    
    // Initialize contracts
    const musdToken = new ethers.Contract(musdAddress, MUSDTokenABI, provider);
    const matchEscrow = new ethers.Contract(matchEscrowAddress, MatchEscrowABI, provider);
    const tournamentPool = new ethers.Contract(tournamentPoolAddress, TournamentPoolABI, provider);
    
    // Test MUSD Token
    log(`\n━━━ MUSD Token ━━━`, 'cyan');
    const name = await musdToken.name();
    const symbol = await musdToken.symbol();
    const totalSupply = await musdToken.totalSupply();
    const decimals = await musdToken.decimals();
    
    log(`  Address: ${musdAddress}`, 'blue');
    log(`  Name: ${name}`, 'green');
    log(`  Symbol: ${symbol}`, 'green');
    log(`  Decimals: ${decimals}`, 'green');
    log(`  Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`, 'green');
    
    // Test MatchEscrow
    log(`\n━━━ MatchEscrow ━━━`, 'cyan');
    const escrowToken = await matchEscrow.token();
    const treasury = await matchEscrow.treasury();
    const matchCounter = await matchEscrow.matchCounter();
    
    log(`  Address: ${matchEscrowAddress}`, 'blue');
    log(`  Token: ${escrowToken}`, 'green');
    log(`  Treasury: ${treasury}`, 'green');
    log(`  Matches Created: ${matchCounter}`, 'green');
    
    // Test TournamentPool
    log(`\n━━━ TournamentPool ━━━`, 'cyan');
    const poolToken = await tournamentPool.token();
    const poolTreasury = await tournamentPool.treasury();
    const poolMatchEscrow = await tournamentPool.matchEscrow();
    const tournamentCounter = await tournamentPool.tournamentCounter();
    
    log(`  Address: ${tournamentPoolAddress}`, 'blue');
    log(`  Token: ${poolToken}`, 'green');
    log(`  Treasury: ${poolTreasury}`, 'green');
    log(`  MatchEscrow: ${poolMatchEscrow}`, 'green');
    log(`  Tournaments Created: ${tournamentCounter}`, 'green');
    
    // Test Oracle Wallet
    if (oracleKey) {
      log(`\n━━━ Oracle Wallet ━━━`, 'cyan');
      const oracleWallet = new ethers.Wallet(oracleKey, provider);
      const oracleAddress = oracleWallet.address;
      const oracleBalance = await provider.getBalance(oracleAddress);
      
      log(`  Address: ${oracleAddress}`, 'green');
      log(`  Balance: ${ethers.formatEther(oracleBalance)} MEZO`, 'green');
      
      // Check if oracle has MUSD
      const oracleMUSD = await musdToken.balanceOf(oracleAddress);
      log(`  MUSD Balance: ${ethers.formatUnits(oracleMUSD, decimals)} MUSD`, 'green');
      
      // Check oracle role
      try {
        const hasOracleRole = await matchEscrow.hasRole(
          await matchEscrow.ORACLE_ROLE(),
          oracleAddress
        );
        log(`  Has Oracle Role: ${hasOracleRole ? '✓ Yes' : '✗ No'}`, hasOracleRole ? 'green' : 'yellow');
      } catch (e) {
        log(`  Oracle Role Check: Skipped (role might not be set)`, 'yellow');
      }
    }
    
    return true;
  } catch (error) {
    log(`\n✗ Contract connection failed:`, 'red');
    console.error(error);
    return false;
  }
}

async function testBackendEndpoints() {
  try {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('  Testing Backend Endpoints', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    
    const serverHost = process.env.DB_HOST || 'localhost';
    const serverPort = process.env.SERVER_PORT || '3001';
    const baseUrl = `http://${serverHost}:${serverPort}`;
    
    log(`\nBase URL: ${baseUrl}`, 'yellow');
    
    // Test health endpoint
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        log(`\n✓ Health endpoint: ${data.status}`, 'green');
        if (data.services) {
          log(`  - Database: ${data.services.database}`, 'blue');
          log(`  - Redis: ${data.services.redis}`, 'blue');
        }
      } else {
        log(`✗ Health endpoint returned: ${response.status}`, 'red');
      }
    } catch (e) {
      log(`✗ Could not reach backend at ${baseUrl}`, 'red');
      log(`  Make sure backend is running: npm run dev`, 'yellow');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`✗ Backend endpoint test failed: ${error}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║                                                            ║', 'bright');
  log('║        BitArena - Backend & Contract Integration Test     ║', 'bright');
  log('║                                                            ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝', 'bright');
  
  const results = {
    database: false,
    redis: false,
    contracts: false,
    backend: false,
  };
  
  results.database = await testDatabaseConnection();
  results.redis = await testRedisConnection();
  results.contracts = await testContractConnections();
  results.backend = await testBackendEndpoints();
  
  // Summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                      TEST SUMMARY                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const tests = [
    { name: 'Database Connection', status: results.database },
    { name: 'Redis Connection', status: results.redis },
    { name: 'Smart Contracts', status: results.contracts },
    { name: 'Backend Endpoints', status: results.backend },
  ];
  
  tests.forEach(test => {
    const icon = test.status ? '✓' : '✗';
    const color = test.status ? 'green' : 'red';
    log(`  ${icon} ${test.name.padEnd(30)}${test.status ? 'PASS' : 'FAIL'}`, color);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    log('\n🎉 All tests passed! System is fully operational.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the logs above.', 'yellow');
  }
  
  // Cleanup
  await db.end();
  await redis.quit();
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log(`\n✗ Test suite crashed: ${error}`, 'red');
  console.error(error);
  process.exit(1);
});
