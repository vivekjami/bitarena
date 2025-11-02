'use client';

import { Match, GameType } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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
    pending: 'bg-cyan-400/20 text-cyan-400 border-cyan-400/40',
    active: 'bg-green-400/20 text-green-400 border-green-400/40',
    completed: 'bg-violet-400/20 text-violet-400 border-violet-400/40',
    disputed: 'bg-red-400/20 text-red-400 border-red-400/40',
    cancelled: 'bg-gray-400/20 text-gray-400 border-gray-400/40',
  };

  const handleJoin = async () => {
    if (!canJoin || isJoining) return;

    setIsJoining(true);
    try {
      await joinMatch(match.id);
      onJoin?.(match.id);
      
      // Navigate to game page
      router.push(`/game/${match.id}`);
    } catch (err) {
      console.error('Failed to join match:', err);
    } finally {
      setIsJoining(false);
    }
  };

  const handleView = () => {
    if (isActive && (isCreator || isFull)) {
      router.push(`/game/${match.id}`);
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#0A0A0F] to-cyan-400/5 hover:border-cyan-400/50 transition-all p-6 backdrop-blur-xl shadow-lg hover:shadow-cyan-400/10">
      {/* Header: Game Type + Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(0,217,255,0.5)]">
            {gameTypeLabels[match.gameType] === 'Projectile Duel' ? '🎯' : '🎨'}
          </span>
          <div>
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-violet-400">
              {gameTypeLabels[match.gameType]}
            </h3>
            <p className="text-xs text-cyan-400/60">Match #{match.id.slice(0, 8)}</p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border ${statusColors[match.status]}`}>
          {match.status.toUpperCase()}
        </span>
      </div>

      {/* Match Details */}
      <div className="space-y-3 mb-5">
        {/* Stake Amount */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-cyan-400/70">💰 Stake:</span>
          <span className="text-sm font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-violet-400">
            {match.stakeAmount} MUSD
          </span>
        </div>

        {/* Players */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-cyan-400/70">👥 Players:</span>
          <span className="text-sm font-bold text-white">
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
        <div className="mb-4 p-4 bg-cyan-400/5 rounded-xl border border-cyan-400/10">
          <p className="text-xs text-cyan-400/70 mb-3 font-semibold">🎮 Players:</p>
          <div className="space-y-2">
            {players.map((player, index) => (
              <div key={player.address} className="flex items-center justify-between text-xs">
                <span className="text-white font-mono">
                  {index + 1}. {`${player.address.slice(0, 6)}...${player.address.slice(-4)}`}
                </span>
                <span className="text-cyan-400/60">#{player.joinOrder}</span>
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
            className="w-full py-3 bg-cyan-400/10 text-cyan-400/40 rounded-xl cursor-not-allowed text-sm font-bold border border-cyan-400/20"
          >
            🔒 Connect Wallet to Join
          </button>
        ) : isCreator ? (
          <button
            onClick={handleView}
            className="w-full py-3 bg-linear-to-r from-green-400 to-cyan-400 hover:from-green-300 hover:to-cyan-300 text-[#0A0A0F] font-bold rounded-xl transition-all shadow-lg shadow-cyan-400/30 hover:shadow-cyan-400/50 text-sm"
          >
            {isActive ? '👁️ View Match' : '⏳ Waiting for Players...'}
          </button>
        ) : isFull ? (
          <button
            disabled
            className="w-full py-3 bg-cyan-400/10 text-cyan-400/40 rounded-xl cursor-not-allowed text-sm font-bold border border-cyan-400/20"
          >
            🚫 Match Full
          </button>
        ) : isActive ? (
          <button
            disabled
            className="w-full py-3 bg-cyan-400/10 text-cyan-400/40 rounded-xl cursor-not-allowed text-sm font-bold border border-cyan-400/20"
          >
            ⚡ Match In Progress
          </button>
        ) : canJoin ? (
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className={`
              w-full py-3 rounded-xl font-bold transition-all text-sm shadow-lg
              ${isJoining
                ? 'bg-cyan-400/10 text-cyan-400/40 cursor-wait border border-cyan-400/20'
                : 'bg-linear-to-r from-cyan-400 to-violet-400 hover:from-cyan-300 hover:to-violet-300 text-[#0A0A0F] shadow-cyan-400/30 hover:shadow-cyan-400/50'
              }
            `}
          >
            {isJoining ? '⏳ Joining...' : '🎮 Join Match'}
          </button>
        ) : (
          <button
            disabled
            className="w-full py-3 bg-cyan-400/10 text-cyan-400/40 rounded-xl cursor-not-allowed text-sm font-bold border border-cyan-400/20"
          >
            ❌ Cannot Join
          </button>
        )}
      </div>
    </div>
  );
}
