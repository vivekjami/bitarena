'use client';

import { Match, GameType } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { useState } from 'react';

interface MatchCardProps {
  match: Match;
  onJoin?: (matchId: string) => void;
}

/**
 * Individual match card displaying match details and join button
 */
export function MatchCard({ match, onJoin }: MatchCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  const user = useAppStore((state) => state.auth.user);
  const joinMatch = useAppStore((state) => state.joinMatch);

  const players = match.players || [];
  const isCreator = user?.address === players[0]?.address;
  const isFull = players.length >= match.maxPlayers;
  const isActive = match.status === 'active';
  const canJoin = !isCreator && !isFull && match.status === 'pending' && user;

  const gameTypeLabels: Record<GameType, string> = {
    [GameType.PROJECTILE_DUEL]: '🎯 Projectile Duel',
    [GameType.GRAVITY_PAINTERS]: '🌌 Gravity Painters',
  };

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    disputed: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const handleJoin = async () => {
    if (!canJoin || isJoining) return;

    setIsJoining(true);
    try {
      await joinMatch(match.id);
      onJoin?.(match.id);
    } catch (err) {
      console.error('Failed to join match:', err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-all p-4">
      {/* Header: Game Type + Status */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">
          {gameTypeLabels[match.gameType]}
        </h3>
        <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusColors[match.status]}`}>
          {match.status.toUpperCase()}
        </span>
      </div>

      {/* Match Details */}
      <div className="space-y-2 mb-4">
        {/* Stake Amount */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Stake:</span>
          <span className="text-sm font-semibold text-purple-400">
            {match.stakeAmount} MUSD
          </span>
        </div>

        {/* Players */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Players:</span>
          <span className="text-sm font-semibold text-white">
            {players.length} / {match.maxPlayers}
          </span>
        </div>

        {/* Creator */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Created by:</span>
          <span className="text-sm font-mono text-gray-300">
            {players[0] ? `${players[0].address.slice(0, 6)}...${players[0].address.slice(-4)}` : 'Unknown'}
          </span>
        </div>
      </div>

      {/* Players List */}
      {players.length > 0 && (
        <div className="mb-4 p-3 bg-gray-900/50 rounded">
          <p className="text-xs text-gray-400 mb-2">Players:</p>
          <div className="space-y-1">
            {players.map((player, index) => (
              <div key={player.address} className="flex items-center justify-between text-xs">
                <span className="text-gray-300">
                  {index + 1}. {`${player.address.slice(0, 6)}...${player.address.slice(-4)}`}
                </span>
                <span className="text-gray-500">Order: {player.joinOrder}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div>
        {!user ? (
          <button
            disabled
            className="w-full py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed text-sm"
          >
            Connect Wallet to Join
          </button>
        ) : isCreator ? (
          <button
            disabled
            className="w-full py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed text-sm"
          >
            Your Match
          </button>
        ) : isFull ? (
          <button
            disabled
            className="w-full py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed text-sm"
          >
            Match Full
          </button>
        ) : isActive ? (
          <button
            disabled
            className="w-full py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed text-sm"
          >
            Match In Progress
          </button>
        ) : canJoin ? (
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className={`
              w-full py-2 rounded-lg font-semibold transition-all text-sm
              ${isJoining
                ? 'bg-gray-700 text-gray-400 cursor-wait'
                : 'bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
              }
            `}
          >
            {isJoining ? 'Joining...' : 'Join Match'}
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed text-sm"
          >
            Cannot Join
          </button>
        )}
      </div>
    </div>
  );
}
