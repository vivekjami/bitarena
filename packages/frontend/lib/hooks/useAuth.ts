'use client';

import { useAppStore } from '../store';

/**
 * Hook for authentication actions
 * Provides convenient access to auth state and actions
 */
export function useAuth() {
  const user = useAppStore((state) => state.auth.user);
  const isConnected = useAppStore((state) => state.auth.isConnected);
  const isLoading = useAppStore((state) => state.auth.isLoading);
  const error = useAppStore((state) => state.auth.error);
  const connectWallet = useAppStore((state) => state.connectWallet);
  const disconnectWallet = useAppStore((state) => state.disconnectWallet);

  return {
    user,
    isConnected,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
  };
}
