'use client';

import { useState } from 'react';
import { GameType } from '@/lib/types';
import { useAppStore } from '@/lib/store';

/**
 * Form for creating a new match
 * Allows selection of game type and stake amount
 */
export function CreateMatchForm() {
  const [gameType, setGameType] = useState<GameType>(GameType.PROJECTILE_DUEL);
  const [stakeAmount, setStakeAmount] = useState('10');
  const [isCreating, setIsCreating] = useState(false);

  const user = useAppStore((state) => state.auth.user);
  const createMatch = useAppStore((state) => state.createMatch);

  const gameTypes = [
    {
      value: GameType.PROJECTILE_DUEL,
      label: '🎯 Projectile Duel',
      description: 'Fast-paced shooter with projectiles and obstacles',
    },
    {
      value: GameType.GRAVITY_PAINTERS,
      label: '🌌 Gravity Painters',
      description: 'Control gravity wells and paint the canvas with particles',
    },
  ];

  const stakePresets = ['5', '10', '25', '50', '100'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || isCreating) return;

    const stake = parseFloat(stakeAmount);
    if (isNaN(stake) || stake <= 0) {
      return;
    }

    setIsCreating(true);
    try {
      await createMatch(gameType, stakeAmount);
    } catch (err) {
      console.error('Failed to create match:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Create New Match</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Game Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Select Game Type
          </label>
          <div className="space-y-3">
            {gameTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setGameType(type.value)}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  ${gameType === type.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-bold text-white">{type.label}</span>
                  {gameType === type.value && (
                    <span className="text-purple-400">✓</span>
                  )}
                </div>
                <p className="text-sm text-gray-400">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Stake Amount */}
        <div>
          <label htmlFor="stakeAmount" className="block text-sm font-semibold text-gray-300 mb-3">
            Stake Amount (MUSD)
          </label>
          
          {/* Preset Buttons */}
          <div className="flex gap-2 mb-3">
            {stakePresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setStakeAmount(preset)}
                className={`
                  px-4 py-2 rounded-lg border text-sm font-semibold transition-all
                  ${stakeAmount === preset
                    ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                    : 'border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-600'
                  }
                `}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <input
            id="stakeAmount"
            type="number"
            min="0"
            step="0.01"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            placeholder="Enter custom amount"
          />
          
          <p className="mt-2 text-xs text-gray-400">
            Minimum stake: 1 MUSD
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!user || isCreating || parseFloat(stakeAmount) <= 0}
          className={`
            w-full py-3 rounded-lg font-bold transition-all
            ${!user || isCreating || parseFloat(stakeAmount) <= 0
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
            }
          `}
        >
          {!user ? (
            'Connect Wallet to Create'
          ) : isCreating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating Match...
            </span>
          ) : (
            `Create Match - ${stakeAmount} MUSD`
          )}
        </button>
      </form>
    </div>
  );
}
