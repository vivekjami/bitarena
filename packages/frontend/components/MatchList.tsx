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
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
        <p className="text-red-400 mb-4">Failed to load matches</p>
        <button
          onClick={() => fetchMatches()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Game Type Filter */}
          <div>
            <label htmlFor="gameTypeFilter" className="block text-sm font-semibold text-gray-300 mb-2">
              Game Type
            </label>
            <select
              id="gameTypeFilter"
              value={filterGameType}
              onChange={(e) => setFilterGameType(e.target.value as GameType | 'all')}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Games</option>
              <option value={GameType.PROJECTILE_DUEL}>🎯 Projectile Duel</option>
              <option value={GameType.GRAVITY_PAINTERS}>🌌 Gravity Painters</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-semibold text-gray-300 mb-2">
              Status
            </label>
            <select
              id="statusFilter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as MatchStatus | 'all')}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="sortBy" className="block text-sm font-semibold text-gray-300 mb-2">
              Sort By
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'stake')}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="recent">Most Recent</option>
              <option value="stake">Highest Stake</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Showing {sortedMatches.length} of {matches.length} matches
          </span>
          {isLoading && (
            <span className="text-purple-400 flex items-center gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 p-4 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-32 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedMatches.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-xl text-gray-400 mb-2">No matches found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters or create a new match</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
