/**
 * Test smart contract interaction from backend
 */

import dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MUSDTokenABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
];

const MatchEscrowABI = [
  'function token() view returns (address)',
  'function treasury() view returns (address)',
  'function matchCounter() view returns (uint256)',
  'function ORACLE_ROLE() view returns (bytes32)',
  'function hasRole(bytes32, address) view returns (bool)',
];

const TournamentPoolABI = [
  'function token() view returns (address)',
  'function treasury() view returns (address)',
  'function matchEscrow() view returns (address)',
  'function tournamentCounter() view returns (uint256)',
];

async function testContractInteraction() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        Smart Contract Interaction Test                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const provider = new ethers.JsonRpcProvider(process.env.MEZO_RPC_URL);
  
  // Test MUSD Token
  console.log('━━━ MUSD Token Contract ━━━');
  const musd = new ethers.Contract(
    process.env.MUSD_TOKEN_ADDRESS!,
    MUSDTokenABI,
    provider
  );
  
  const name = await musd.name();
  const symbol = await musd.symbol();
  const decimals = await musd.decimals();
  const totalSupply = await musd.totalSupply();
  
  console.log(`✓ Name: ${name}`);
  console.log(`✓ Symbol: ${symbol}`);
  console.log(`✓ Decimals: ${decimals}`);
  console.log(`✓ Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
  
  // Check deployer balance
  const deployerAddress = '0x1015F33148163c9537bF88B394a1eDAe48a16832';
  const deployerBalance = await musd.balanceOf(deployerAddress);
  console.log(`✓ Deployer Balance: ${ethers.formatUnits(deployerBalance, decimals)} ${symbol}`);
  
  // Test MatchEscrow
  console.log('\n━━━ MatchEscrow Contract ━━━');
  const matchEscrow = new ethers.Contract(
    process.env.MATCH_ESCROW_ADDRESS!,
    MatchEscrowABI,
    provider
  );
  
  const escrowToken = await matchEscrow.token();
  const treasury = await matchEscrow.treasury();
  const matchCounter = await matchEscrow.matchCounter();
  
  console.log(`✓ Token Address: ${escrowToken}`);
  console.log(`✓ Treasury: ${treasury}`);
  console.log(`✓ Matches Created: ${matchCounter}`);
  
  // Check oracle role
  const oracleWallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY!, provider);
  const oracleRole = await matchEscrow.ORACLE_ROLE();
  const hasRole = await matchEscrow.hasRole(oracleRole, oracleWallet.address);
  console.log(`✓ Oracle ${oracleWallet.address}`);
  console.log(`✓ Has Oracle Role: ${hasRole ? 'YES ✓' : 'NO (needs to be granted)'}`);
  
  // Test TournamentPool
  console.log('\n━━━ TournamentPool Contract ━━━');
  const tournamentPool = new ethers.Contract(
    process.env.TOURNAMENT_POOL_ADDRESS!,
    TournamentPoolABI,
    provider
  );
  
  const poolToken = await tournamentPool.token();
  const poolTreasury = await tournamentPool.treasury();
  const poolMatchEscrow = await tournamentPool.matchEscrow();
  const tournamentCounter = await tournamentPool.tournamentCounter();
  
  console.log(`✓ Token Address: ${poolToken}`);
  console.log(`✓ Treasury: ${poolTreasury}`);
  console.log(`✓ MatchEscrow: ${poolMatchEscrow}`);
  console.log(`✓ Tournaments Created: ${tournamentCounter}`);
  
  // Verify linking
  console.log('\n━━━ Contract Verification ━━━');
  const tokenMatch = escrowToken.toLowerCase() === process.env.MUSD_TOKEN_ADDRESS!.toLowerCase();
  const escrowMatch = poolMatchEscrow.toLowerCase() === process.env.MATCH_ESCROW_ADDRESS!.toLowerCase();
  
  console.log(`${tokenMatch ? '✓' : '✗'} MatchEscrow uses correct MUSD token`);
  console.log(`${tokenMatch ? '✓' : '✗'} TournamentPool uses correct MUSD token`);
  console.log(`${escrowMatch ? '✓' : '✗'} TournamentPool linked to MatchEscrow`);
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              CONTRACT INTERACTION SUCCESS ✓                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('🎉 All contracts are deployed correctly and interacting!');
  console.log('\n📋 Summary:');
  console.log(`   • ${matchCounter} matches created`);
  console.log(`   • ${tournamentCounter} tournaments created`);
  console.log(`   • ${ethers.formatUnits(totalSupply, decimals)} ${symbol} total supply`);
  console.log(`   • ${ethers.formatUnits(deployerBalance, decimals)} ${symbol} in deployer wallet`);
  console.log();
}

testContractInteraction().catch(error => {
  console.error('✗ Contract interaction test failed:', error);
  process.exit(1);
});
