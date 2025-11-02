'use client';

import { WalletInfo } from '@/components/WalletInfo';
import { CreateMatchForm } from '@/components/CreateMatchForm';
import { MatchList } from '@/components/MatchList';
import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Swords, Users, Trophy, TrendingUp } from 'lucide-react';

/**
 * Main lobby page - matches the landing page style
 * Shows match list, allows creating new matches, displays wallet info
 */
export default function LobbyPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="relative">
        {/* Animated background grid */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 217, 255, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 217, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative container mx-auto px-4 py-12">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 mb-6">
              <Swords className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">Game Lobby</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Join the Battle
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Choose your game, stake your MUSD, and prove your skills against worthy opponents
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
              {/* Wallet Info */}
              <WalletInfo />

              {/* Quick Stats */}
              <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#0A0A0F] to-cyan-400/5 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-lg font-bold text-white">Live Stats</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Swords className="h-4 w-4" />
                      Active Matches
                    </span>
                    <span className="font-bold text-white text-lg">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Players Online
                    </span>
                    <span className="font-bold text-green-400 text-lg">156</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Prize Pool
                    </span>
                    <span className="font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent text-lg">
                      12,450 MUSD
                    </span>
                  </div>
                </div>
              </div>

              {/* Create Match Button (Mobile) */}
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="lg:hidden w-full py-4 bg-gradient-to-r from-cyan-400 to-violet-400 hover:from-cyan-300 hover:to-violet-300 text-[#0A0A0F] font-bold rounded-xl transition-all shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30"
              >
                {showCreateForm ? 'Hide Form' : '✨ Create Match'}
              </button>
            </aside>

            {/* Main Area */}
            <div className="lg:col-span-3 space-y-8">
              {/* Title & Create Button */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Available Matches</h2>
                  <p className="text-gray-400">Join an existing match or create your own arena</p>
                </div>
                
                {/* Create Match Button (Desktop) */}
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="hidden lg:block px-8 py-4 bg-gradient-to-r from-cyan-400 to-violet-400 hover:from-cyan-300 hover:to-violet-300 text-[#0A0A0F] font-bold rounded-xl transition-all shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:scale-105"
                >
                  {showCreateForm ? 'Hide Form' : '✨ Create Match'}
                </button>
              </div>

              {/* Create Match Form */}
              {showCreateForm && (
                <div className="animate-fade-in">
                  <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#0A0A0F] to-cyan-400/5 p-6 backdrop-blur-xl">
                    <CreateMatchForm />
                  </div>
                </div>
              )}

              {/* Match List */}
              <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#0A0A0F] to-cyan-400/5 backdrop-blur-xl overflow-hidden">
                <MatchList />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-cyan-400/10 bg-[#0A0A0F]/50 backdrop-blur-xl mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-gray-400">
            <p>© 2025 BitArena. Built on <span className="text-cyan-400">Mezo Network</span>.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-cyan-400 transition-colors">Docs</Link>
              <Link href="#" className="hover:text-cyan-400 transition-colors">Discord</Link>
              <Link href="#" className="hover:text-cyan-400 transition-colors">Twitter</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
