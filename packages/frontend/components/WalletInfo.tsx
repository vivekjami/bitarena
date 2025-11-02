'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

interface WalletBalance {
  musd: string;
  eth: string;
}

/**
 * Displays wallet balance (MUSD) and recent transactions
 */
export function WalletInfo() {
  const { user, isConnected } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !user) return;

      try {
        setIsLoading(true);
        
        // Fetch balance from API
        const response = await fetch('/api/wallet/balance');
        if (response.ok) {
          const data = await response.json();
          setBalance(data);
        }
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [isConnected, user]);

  if (!isConnected || !user) {
    return null;
  }

  if (isLoading && !balance) {
    return (
      <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#0A0A0F] to-cyan-400/5 p-6 backdrop-blur-xl animate-pulse">
        <div className="h-6 bg-cyan-400/10 rounded w-24 mb-2"></div>
        <div className="h-4 bg-cyan-400/10 rounded w-16"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#0A0A0F] to-cyan-400/5 p-6 backdrop-blur-xl">
      {/* MUSD Balance */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-1">MUSD Balance</p>
        <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
          {balance?.musd || '0.00'}
        </p>
        <p className="text-xs text-gray-500 mt-1">Available for wagering</p>
      </div>

      {/* ETH Balance */}
      {balance?.eth && (
        <div className="mb-4 pb-4 border-b border-cyan-400/10">
          <p className="text-sm text-gray-400 mb-1">ETH Balance</p>
          <p className="text-xl font-semibold text-white">
            {balance.eth} <span className="text-xs font-normal text-gray-400">ETH</span>
          </p>
        </div>
      )}

      {/* Wallet Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-cyan-400/10">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Matches</p>
          <p className="text-lg font-bold text-white">{user.totalMatches || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Wins</p>
          <p className="text-lg font-bold text-green-400">{user.wins || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Win Rate</p>
          <p className="text-lg font-bold text-cyan-400">
            {user.totalMatches ? ((user.wins / user.totalMatches) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
