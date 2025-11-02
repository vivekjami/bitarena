'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { config } from '@/lib/config';
import { Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store';

/**
 * Header component with wallet connection
 * Shows navigation and wallet status
 */
export function Header() {
  const { address, isConnected } = useAccount();
  const [musdBalance, setMusdBalance] = useState<string>('0');
  const setUser = useAppStore((state) => state.setUser);

  // Authenticate and sync wallet connection
  useEffect(() => {
    if (isConnected && address) {
      // Authenticate with backend
      const authenticate = async () => {
        try {
          console.log('Authenticating wallet:', address);
          
          const response = await fetch(`${config.apiUrl}/api/auth/wallet`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies
            body: JSON.stringify({ address: address.toLowerCase() }),
          });

          console.log('Auth response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('Authentication successful:', data);
            
            // Store auth token
            if (data.token) {
              localStorage.setItem('auth_token', data.token);
              console.log('Token stored in localStorage');
            }
            
            // Update store with user data
            setUser({
              address: data.user.address,
              username: data.user.username,
              eloRating: data.user.eloRating,
              totalMatches: data.user.totalMatches,
              wins: data.user.wins,
              totalWagered: data.user.totalWagered,
              totalWinnings: data.user.totalWinnings,
            });
            console.log('User data updated in store');
          } else {
            console.error('Auth failed with status:', response.status);
          }
        } catch (error) {
          console.error('Failed to authenticate:', error);
          // Still set basic user data
          setUser({
            address: address.toLowerCase(),
            eloRating: 1000,
            totalMatches: 0,
            wins: 0,
            totalWagered: '0',
            totalWinnings: '0',
          });
        }
      };

      authenticate();
    } else {
      setUser(null);
      localStorage.removeItem('auth_token');
    }
  }, [isConnected, address, setUser]);

  // Fetch MUSD balance periodically
  useEffect(() => {
    if (!isConnected || !address) return;

    const fetchBalance = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/users/${address}`);
        if (response.ok) {
          const data = await response.json();
          setMusdBalance(data.musdBalance || '0');
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, [isConnected, address]);

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-cyan-500/20">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-cyan-400 bg-cyan-400/10">
            <Zap className="h-6 w-6 text-cyan-400" fill="currentColor" />
          </div>
          <span className="font-mono text-xl font-bold tracking-tight">
            BIT<span className="text-cyan-400">ARENA</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            href="/lobby" 
            className="text-sm text-zinc-400 transition-colors hover:text-cyan-400"
          >
            Lobby
          </Link>
          <Link 
            href="/leaderboard" 
            className="text-sm text-zinc-400 transition-colors hover:text-cyan-400"
          >
            Leaderboard
          </Link>
          {isConnected && address && (
            <Link 
              href={`/profile/${address}`} 
              className="text-sm text-zinc-400 transition-colors hover:text-cyan-400"
            >
              Profile
            </Link>
          )}

          {/* MUSD Balance (Desktop) */}
          {isConnected && musdBalance && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-400/10 border border-cyan-400/30 rounded-lg">
              <span className="text-cyan-400 font-bold text-xs">💰</span>
              <span className="text-white font-mono text-sm font-semibold">{formatBalance(musdBalance)}</span>
              <span className="text-zinc-400 text-xs">MUSD</span>
            </div>
          )}
        </div>

        {/* Wallet Connection - RainbowKit Button */}
        <div className="flex items-center gap-4">
          <ConnectButton 
            label="Connect Wallet"
            accountStatus="address"
            showBalance={false}
            chainStatus="icon"
          />
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-zinc-400 hover:text-white"
          aria-label="Open menu"
          title="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>
    </header>
  );
}
