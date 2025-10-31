'use client';

import { useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Wallet connection button with Mezo Passport integration
 * Shows "Connect Wallet" when disconnected or user address when connected
 */
export function WalletConnect() {
  const { user, isConnected, isLoading, error, connectWallet, disconnectWallet } = useAuth();
  
  // Check if we're on the client (hydrated)
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  // Show nothing during SSR
  if (!isMounted) {
    return (
      <button className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg cursor-wait">
        Loading...
      </button>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleConnect}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Retry Connection
        </button>
        <span className="text-sm text-red-400">{error}</span>
      </div>
    );
  }

  // Show connected state
  if (isConnected && user) {
    return (
      <div className="flex items-center gap-3">
        {/* User info */}
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-white">
            {user.username || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
          </span>
          <span className="text-xs text-gray-400">
            ELO: {user.eloRating}
          </span>
        </div>

        {/* Disconnect button */}
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Show connect button
  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className={`
        px-6 py-2 rounded-lg font-semibold transition-all
        ${isLoading 
          ? 'bg-gray-700 text-gray-300 cursor-wait' 
          : 'bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
        }
      `}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Connecting...
        </span>
      ) : (
        'Connect Wallet'
      )}
    </button>
  );
}
