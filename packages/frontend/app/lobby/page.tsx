'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { WalletInfo } from '@/components/WalletInfo';
import { CreateMatchForm } from '@/components/CreateMatchForm';
import { MatchList } from '@/components/MatchList';
import { useState } from 'react';
import Link from 'next/link';

/**
 * Main lobby page
 * Shows match list, allows creating new matches, displays wallet info
 */
export default function LobbyPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">⚔️</span>
              <span className="text-xl font-bold text-white">BitArena</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/lobby" className="text-purple-400 font-semibold">
                Lobby
              </Link>
              <Link href="/tournaments" className="text-gray-400 hover:text-white transition-colors">
                Tournaments
              </Link>
              <Link href="/leaderboard" className="text-gray-400 hover:text-white transition-colors">
                Leaderboard
              </Link>
            </nav>

            {/* Wallet Connect */}
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Wallet Info */}
            <WalletInfo />

            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <h3 className="text-lg font-bold text-white mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Active Matches</span>
                  <span className="font-semibold text-white">24</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Players Online</span>
                  <span className="font-semibold text-green-400">156</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total Prize Pool</span>
                  <span className="font-semibold text-purple-400">12,450 MUSD</span>
                </div>
              </div>
            </div>

            {/* Create Match Button (Mobile) */}
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="lg:hidden w-full py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all shadow-lg"
            >
              {showCreateForm ? 'Hide Form' : 'Create Match'}
            </button>
          </aside>

          {/* Main Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Title */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Game Lobby</h1>
                <p className="text-gray-400">Join an existing match or create your own</p>
              </div>
              
              {/* Create Match Button (Desktop) */}
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="hidden lg:block px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                {showCreateForm ? 'Hide Form' : 'Create Match'}
              </button>
            </div>

            {/* Create Match Form */}
            {showCreateForm && (
              <div className="animate-fade-in">
                <CreateMatchForm />
              </div>
            )}

            {/* Match List */}
            <MatchList />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <p>© 2025 BitArena. Built on Mezo Network.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition-colors">Docs</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
