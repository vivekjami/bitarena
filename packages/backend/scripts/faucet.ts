/**
 * MUSD Faucet Script
 * Sends MUSD tokens to specified address
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MUSD_TOKEN_ABI = [
  'function mint(address to, uint256 amount) external',
  'function faucet(address to) external',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

async function sendFaucet(recipientAddress: string, amount: string) {
  try {
    console.log('\n🚰 MUSD Faucet\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Setup provider and wallet
    const rpcUrl = process.env.MEZO_RPC_URL || 'https://spectrum-01.simplystaking.xyz/dHRqZWVlZ3ktMDEtYjdhZWU5NjI/jDSW6NtCUlHIqQ/mezo/testnet/';
    const privateKey = process.env.ORACLE_PRIVATE_KEY;
    const musdAddress = process.env.MUSD_TOKEN_ADDRESS || '0x32b500742Cd70eed8f4a59F86124711407aF889b';

    if (!privateKey) {
      throw new Error('ORACLE_PRIVATE_KEY not found in environment variables');
    }

    console.log('🔗 Connecting to Mezo Testnet...');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const musdToken = new ethers.Contract(musdAddress, MUSD_TOKEN_ABI, wallet);

    console.log(`✅ Connected with wallet: ${wallet.address}\n`);

    // Get token info
    const symbol = await musdToken.symbol();
    const decimals = await musdToken.decimals();
    
    console.log(`📝 Token: ${symbol}`);
    console.log(`📍 Contract: ${musdAddress}`);
    console.log(`🎯 Recipient: ${recipientAddress}`);
    console.log(`💰 Amount: ${amount} ${symbol}\n`);

    // Use the public faucet function - gives exactly 1000 MUSD
    console.log(`\n� Calling public faucet function for ${recipientAddress}...`);
    console.log(`💧 This will mint 1000 ${symbol} directly to the recipient\n`);
    
    const tx = await musdToken.faucet(recipientAddress);
    console.log(`⏳ Transaction hash: ${tx.hash}`);
    console.log(`⏳ Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt?.blockNumber}\n`);

    // Check recipient balance
    const recipientBalance = await musdToken.balanceOf(recipientAddress);
    const recipientBalanceFormatted = ethers.formatUnits(recipientBalance, decimals);
    console.log(`💼 Recipient new balance: ${recipientBalanceFormatted} ${symbol}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Faucet successful!\n');

    return {
      success: true,
      txHash: tx.hash,
      amount: amount,
      recipient: recipientAddress,
    };

  } catch (error) {
    console.error('\n❌ Faucet failed:', error);
    throw error;
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('\n📖 Usage: npm run faucet <recipient_address> <amount>\n');
  console.log('Example: npm run faucet 0x4ccde438a6274d03da5f0e793e483d750cd37a12 100\n');
  process.exit(1);
}

const [recipient, amount] = args;

sendFaucet(recipient, amount)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
