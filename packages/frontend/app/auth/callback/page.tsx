'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';

/**
 * OAuth callback handler for Mezo Passport
 * Receives auth code, exchanges for token, and redirects to app
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAppStore((state) => state.setUser);
  const setAuthError = useAppStore((state) => state.setAuthError);
  const setAuthLoading = useAppStore((state) => state.setAuthLoading);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      // Handle OAuth error
      if (error) {
        console.error('OAuth error:', error);
        setAuthError(`Authentication failed: ${error}`);
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      // Missing code
      if (!code) {
        setAuthError('No authorization code received');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      try {
        setAuthLoading(true);
        setAuthError(null);

        // Exchange code for token with backend
        const response = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error('Failed to authenticate');
        }

        const data = await response.json();
        
        // Set user data from backend
        setUser(data.user);

        // Redirect to lobby
        router.push('/lobby');
      } catch (err) {
        console.error('Auth callback error:', err);
        setAuthError(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => router.push('/'), 3000);
      } finally {
        setAuthLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router, setUser, setAuthError, setAuthLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        {/* Loading spinner */}
        <div className="mb-6">
          <svg 
            className="animate-spin h-16 w-16 mx-auto text-purple-500" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="none" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          Authenticating...
        </h2>
        <p className="text-gray-400">
          Please wait while we verify your credentials
        </p>
      </div>
    </div>
  );
}

/**
 * Wrapper component with Suspense boundary
 */
export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mb-6">
            <svg 
              className="animate-spin h-16 w-16 mx-auto text-purple-500" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none" 
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Loading...
          </h2>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
