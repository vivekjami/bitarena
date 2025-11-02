'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProjectileDuelCanvas } from '@/components/ProjectileDuelCanvas';
import { GravityPaintersCanvas } from '@/components/GravityPaintersCanvas';
import { GameType } from '@/lib/types';
import { Loader2, AlertCircle, Flag } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#0A0A0F] to-cyan-400/5 p-12 backdrop-blur-xl">
            <AlertCircle className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-400 mb-8">
              Please connect your wallet to enter the arena
            </p>
            <button
              onClick={() => router.push('/lobby')}
              className="w-full px-6 py-4 bg-gradient-to-r from-cyan-400 to-violet-400 hover:from-cyan-300 hover:to-violet-300 text-[#0A0A0F] font-bold rounded-xl transition-all shadow-lg shadow-cyan-400/20"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <div className="text-center">
          <div className="mb-6">
            <Loader2 className="h-16 w-16 mx-auto text-cyan-400 animate-spin" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
            Loading Match...
          </h2>
          <p className="text-gray-400">
            Preparing the arena for battle
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !currentMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="rounded-2xl border border-red-400/20 bg-gradient-to-br from-[#0A0A0F] to-red-400/5 p-12 backdrop-blur-xl">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-red-400 mb-4">
              {error || 'Match not found'}
            </h2>
            <p className="text-gray-400 mb-8">
              Unable to load match data. The match may have ended or been cancelled.
            </p>
            <button
              onClick={() => router.push('/lobby')}
              className="w-full px-6 py-4 bg-gradient-to-r from-cyan-400 to-violet-400 hover:from-cyan-300 hover:to-violet-300 text-[#0A0A0F] font-bold rounded-xl transition-all shadow-lg shadow-cyan-400/20"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate game canvas
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
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
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <p className="text-white text-xl">Unknown game type</p>
            </div>
          </div>
        )}

        {/* Forfeit Button (Top Right) */}
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={handleForfeit}
            className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 hover:border-red-400 text-red-400 font-bold rounded-xl shadow-lg shadow-red-400/10 transition-all backdrop-blur-xl"
          >
            <Flag className="h-4 w-4" />
            Forfeit Match
          </button>
        </div>
      </div>
    </div>
  );
}
