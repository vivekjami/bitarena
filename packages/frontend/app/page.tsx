import Link from 'next/link';

/**
 * Landing page
 * Redirects to lobby or shows welcome screen
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <main className="container mx-auto px-4 py-16 text-center">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <span className="text-8xl">⚔️</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-400">
            BitArena
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-300 mb-4">
            Compete. Wager. Win.
          </p>
          
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Skill-based multiplayer games with real MUSD stakes on Mezo Network. 
            Connect your wallet, choose your game, and prove your skills.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link 
              href="/lobby"
              className="px-8 py-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-bold rounded-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Enter Lobby
            </Link>
            <Link 
              href="/leaderboard"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white text-lg font-bold rounded-lg transition-all border border-gray-600"
            >
              View Leaderboard
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-2">Projectile Duel</h3>
              <p className="text-gray-400">
                Fast-paced top-down shooter. Aim, shoot, and eliminate opponents with physics-based projectiles.
              </p>
            </div>

            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="text-4xl mb-4">🌌</div>
              <h3 className="text-xl font-bold text-white mb-2">Gravity Painters</h3>
              <p className="text-gray-400">
                Control gravity wells to paint the canvas. Dominate the most territory with strategic particle physics.
              </p>
            </div>

            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-white mb-2">Real Stakes</h3>
              <p className="text-gray-400">
                Wager MUSD on your skills. Winners claim the prize pool secured by smart contracts.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 text-gray-500 text-sm">
            <p>Built on Mezo Network with Mezo Passport authentication</p>
            <p className="mt-2">© 2025 BitArena. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
