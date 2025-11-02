/**
 * Frontend configuration
 * Centralized config for all environment variables
 */

export const config = {
  // API endpoints
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  
  // Blockchain
  mezoRpcUrl: process.env.NEXT_PUBLIC_MEZO_RPC_URL || '',
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31611'),
  
  // Smart contracts
  contracts: {
    musdToken: process.env.NEXT_PUBLIC_MUSD_TOKEN_ADDRESS as `0x${string}`,
    matchEscrow: process.env.NEXT_PUBLIC_MATCH_ESCROW_ADDRESS as `0x${string}`,
    tournamentPool: process.env.NEXT_PUBLIC_TOURNAMENT_POOL_ADDRESS as `0x${string}`,
  },
  
  // Mezo Passport
  mezoPassport: {
    clientId: process.env.NEXT_PUBLIC_MEZO_CLIENT_ID || '',
    redirectUri: process.env.NEXT_PUBLIC_MEZO_REDIRECT_URI || '',
  },
} as const;

// Validation
if (typeof window !== 'undefined') {
  // Only validate in browser
  const required = [
    'contracts.musdToken',
    'contracts.matchEscrow',
    'contracts.tournamentPool',
  ];
  
  for (const key of required) {
    const value = key.split('.').reduce((obj, k) => (obj as any)?.[k], config);
    if (!value) {
      console.warn(`Missing required config: ${key}`);
    }
  }
}

export default config;
