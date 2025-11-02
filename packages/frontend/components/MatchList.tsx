'use client';

import { useEffect, useState } from 'react';
import { GameType, MatchStatus } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { MatchCard } from './MatchCard';

/**
 * Displays list of available matches with filtering and real-time updates
 */
export function MatchList() {
  const matches = useAppStore((state) => state.matches.matches);
  const isLoading = useAppStore((state) => state.matches.isLoading);
  const error = useAppStore((state) => state.matches.error);
  const fetchMatches = useAppStore((state) => state.fetchMatches);

  const [filterGameType, setFilterGameType] = useState<GameType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<MatchStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'stake'>('recent');

  useEffect(() => {
    // Initial fetch
    fetchMatches();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchMatches();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchMatches]);

  // Filter matches
  const filteredMatches = matches.filter((match) => {
    if (filterGameType !== 'all' && match.gameType !== filterGameType) {
      return false;
    }
    if (filterStatus !== 'all' && match.status !== filterStatus) {
      return false;
    }
    return true;
  });

  // Sort matches
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (sortBy === 'stake') {
      return parseFloat(b.stakeAmount) - parseFloat(a.stakeAmount);
    }
    // Sort by recent (createdAt)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-gradient-to-br from-[#0A0A0F] to-red-400/5 p-8 text-center backdrop-blur-xl">
        <p className="text-red-400 text-lg mb-4">Failed to load matches</p>
        <button
          onClick={() => fetchMatches()}
          className="px-6 py-3 bg-gradient-to-r from-red-400 to-red-600 hover:from-red-300 hover:to-red-500 text-white rounded-xl transition-all shadow-lg shadow-red-400/20"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 p-6 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#0A0A0F] to-cyan-400/5 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Game Type Filter */}
          <div>
            <label htmlFor="gameTypeFilter" className="block text-sm font-semibold text-cyan-400 mb-2">
              Game Type
            </label>
            <select
              id="gameTypeFilter"
              value={filterGameType}
              onChange={(e) => setFilterGameType(e.target.value as GameType | 'all')}
              className="w-full px-4 py-3 bg-[#0A0A0F] border border-cyan-400/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
            >
              <option value="all">All Games</option>
              <option value={GameType.PROJECTILE_DUEL}>🎯 Projectile Duel</option>
              <option value={GameType.GRAVITY_PAINTERS}>🌌 Gravity Painters</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-semibold text-cyan-400 mb-2">
              Status
            </label>
            <select
              id="statusFilter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as MatchStatus | 'all')}
              className="w-full px-4 py-3 bg-[#0A0A0F] border border-cyan-400/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="sortBy" className="block text-sm font-semibold text-cyan-400 mb-2">
              Sort By
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'stake')}
              className="w-full px-4 py-3 bg-[#0A0A0F] border border-cyan-400/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
            >
              <option value="recent">Most Recent</option>
              <option value="stake">Highest Stake</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Showing <span className="font-bold text-cyan-400">{sortedMatches.length}</span> of <span className="font-bold">{matches.length}</span> matches
          </span>
          {isLoading && (
            <span className="text-cyan-400 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Updating...
            </span>
          )}
        </div>
      </div>

      {/* Matches Grid */}
      {isLoading && matches.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#0A0A0F] to-cyan-400/5 p-6 animate-pulse backdrop-blur-xl">
              <div className="h-6 bg-cyan-400/10 rounded w-32 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-cyan-400/10 rounded"></div>
                <div className="h-4 bg-cyan-400/10 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedMatches.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="inline-block p-4 rounded-full bg-cyan-400/10 mb-4">
            <svg className="h-12 w-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-xl text-white font-bold mb-2">No matches found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters or create a new match</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {sortedMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
