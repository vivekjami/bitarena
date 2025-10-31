'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProjectileDuelCanvas } from '@/components/ProjectileDuelCanvas';
import { GravityPaintersCanvas } from '@/components/GravityPaintersCanvas';
import { GameType } from '@/lib/types';

/**
 * Game page - displays the active game canvas based on match type
 */
export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isConnected } = useAuth();
  const matchId = params.matchId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentMatch = useAppStore((state) => state.matches.currentMatch);
  const fetchMatchById = useAppStore((state) => state.fetchMatchById);
  const startGame = useAppStore((state) => state.startGame);
  const endGame = useAppStore((state) => state.endGame);

  // Load match data
  useEffect(() => {
    let isMounted = true;

    const loadMatch = async () => {
      if (!matchId) {
        if (isMounted) {
          setError('Invalid match ID');
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) setIsLoading(true);
        await fetchMatchById(matchId);
        if (isMounted) setIsLoading(false);
      } catch (err) {
        console.error('Failed to load match:', err);
        if (isMounted) {
          setError('Failed to load match');
          setIsLoading(false);
        }
      }
    };

    loadMatch();

    return () => {
      isMounted = false;
    };
  }, [matchId, fetchMatchById]);

  // Start game when match is loaded
  useEffect(() => {
    if (currentMatch && user?.address) {
      startGame(matchId, user.address);
    }

    // Cleanup on unmount
    return () => {
      endGame();
    };
  }, [currentMatch, matchId, user?.address, startGame, endGame]);

  // Handle forfeit
  const handleForfeit = () => {
    if (window.confirm('Are you sure you want to forfeit this match?')) {
      endGame();
      router.push('/lobby');
    }
  };

  // Redirect if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-400 mb-6">
            Please connect your wallet to play
          </p>
          <button
            onClick={() => router.push('/lobby')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
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
            Loading Match...
          </h2>
          <p className="text-gray-400">
            Please wait while we prepare the game
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !currentMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">
            {error || 'Match not found'}
          </h2>
          <p className="text-gray-400 mb-6">
            Unable to load match data
          </p>
          <button
            onClick={() => router.push('/lobby')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate game canvas
  return (
    <div className="min-h-screen bg-black">
      {/* Game Canvas */}
      <div className="relative">
        {currentMatch.gameType === GameType.PROJECTILE_DUEL && user?.address ? (
          <ProjectileDuelCanvas 
            matchId={matchId}
            playerAddress={user.address}
          />
        ) : currentMatch.gameType === GameType.GRAVITY_PAINTERS && user?.address ? (
          <GravityPaintersCanvas 
            matchId={matchId}
            playerAddress={user.address}
          />
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-white text-xl">Unknown game type</p>
          </div>
        )}

        {/* Forfeit Button (Top Right) */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={handleForfeit}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition-all"
          >
            Forfeit Match
          </button>
        </div>
      </div>
    </div>
  );
}
