/**
 * Wagmi configuration for Mezo Network with RainbowKit
 */

import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import config from './config';

// Define Mezo Testnet
export const mezoTestnet = defineChain({
  id: config.chainId,
  name: 'Mezo Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MEZO',
    symbol: 'MEZO',
  },
  rpcUrls: {
    default: {
      http: [config.mezoRpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mezo Explorer',
      url: 'https://explorer.mezo.io',
    },
  },
  testnet: true,
});

// Configure wallet connectors
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: 'BitArena',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '0000000000000000000000000000000000000000',
  }
);

// Create wagmi config with connectors
export const wagmiConfig = createConfig({
  connectors,
  chains: [mezoTestnet],
  transports: {
    [mezoTestnet.id]: http(),
  },
});

export default wagmiConfig;
