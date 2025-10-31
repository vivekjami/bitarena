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
      <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-24 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-16"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      {/* MUSD Balance */}
      <div className="mb-3">
        <p className="text-sm text-gray-400 mb-1">MUSD Balance</p>
        <p className="text-2xl font-bold text-white">
          {balance?.musd || '0.00'} <span className="text-sm font-normal text-gray-400">MUSD</span>
        </p>
      </div>

      {/* ETH Balance */}
      {balance?.eth && (
        <div className="mb-3">
          <p className="text-sm text-gray-400 mb-1">ETH Balance</p>
          <p className="text-lg font-semibold text-white">
            {balance.eth} <span className="text-xs font-normal text-gray-400">ETH</span>
          </p>
        </div>
      )}

      {/* Wallet Stats */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-700">
        <div className="text-center">
          <p className="text-xs text-gray-400">Matches</p>
          <p className="text-sm font-semibold text-white">{user.totalMatches || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Wins</p>
          <p className="text-sm font-semibold text-green-400">{user.wins || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Win Rate</p>
          <p className="text-sm font-semibold text-purple-400">
            {user.totalMatches ? ((user.wins / user.totalMatches) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
