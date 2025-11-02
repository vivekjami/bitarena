import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  User, 
  Match, 
  Tournament,
  ProjectileDuelState,
  GravityPaintersState,
  GameType
} from './types';

/**
 * Authentication state
 */
interface AuthState {
  user: User | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Match state
 */
interface MatchState {
  matches: Match[];
  currentMatch: Match | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Tournament state
 */
interface TournamentState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Game state
 */
interface GameState {
  gameType: GameType | null;
  projectileDuelState: ProjectileDuelState | null;
  gravityPaintersState: GravityPaintersState | null;
  isPlaying: boolean;
  localPlayerAddress: string | null;
}

/**
 * Notification state
 */
interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
}

/**
 * Combined app store
 */
interface AppStore {
  // Auth
  auth: AuthState;
  setUser: (user: User | null) => void;
  setAuthLoading: (isLoading: boolean) => void;
  setAuthError: (error: string | null) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;

  // Matches
  matches: MatchState;
  setMatches: (matches: Match[]) => void;
  setCurrentMatch: (match: Match | null) => void;
  setMatchLoading: (isLoading: boolean) => void;
  setMatchError: (error: string | null) => void;
  fetchMatches: () => Promise<void>;
  fetchMatchById: (matchId: string) => Promise<void>;
  createMatch: (gameType: GameType, stakeAmount: string) => Promise<void>;
  joinMatch: (matchId: string) => Promise<void>;

  // Tournaments
  tournaments: TournamentState;
  setTournaments: (tournaments: Tournament[]) => void;
  setCurrentTournament: (tournament: Tournament | null) => void;
  fetchTournaments: () => Promise<void>;

  // Game
  game: GameState;
  setGameType: (gameType: GameType | null) => void;
  updateProjectileDuelState: (state: ProjectileDuelState) => void;
  updateGravityPaintersState: (state: GravityPaintersState) => void;
  startGame: (matchId: string, playerAddress: string) => void;
  endGame: () => void;

  // Notifications
  notifications: NotificationState;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

/**
 * Create the app store with persistence for auth
 */
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Auth state
      auth: {
        user: null,
        isConnected: false,
        isLoading: false,
        error: null,
      },

      setUser: (user) => set((state) => ({
        auth: { ...state.auth, user, isConnected: !!user }
      })),

      setAuthLoading: (isLoading) => set((state) => ({
        auth: { ...state.auth, isLoading }
      })),

      setAuthError: (error) => set((state) => ({
        auth: { ...state.auth, error }
      })),

      connectWallet: async () => {
        set((state) => ({ auth: { ...state.auth, isLoading: true, error: null } }));
        try {
          // This will be implemented with actual wallet connection logic
          // For now, just a placeholder
          const response = await fetch('/api/auth/connect', {
            method: 'POST',
            credentials: 'include',
          });
          
          if (!response.ok) throw new Error('Failed to connect wallet');
          
          const data = await response.json();
          set((state) => ({
            auth: {
              ...state.auth,
              user: data.user,
              isConnected: true,
              isLoading: false,
            }
          }));
        } catch (error) {
          set((state) => ({
            auth: {
              ...state.auth,
              error: error instanceof Error ? error.message : 'Failed to connect',
              isLoading: false,
            }
          }));
        }
      },

      disconnectWallet: () => {
        set(() => ({
          auth: {
            user: null,
            isConnected: false,
            isLoading: false,
            error: null,
          }
        }));
      },

      // Match state
      matches: {
        matches: [],
        currentMatch: null,
        isLoading: false,
        error: null,
      },

      setMatches: (matches) => set((state) => ({
        matches: { ...state.matches, matches }
      })),

      setCurrentMatch: (match) => set((state) => ({
        matches: { ...state.matches, currentMatch: match }
      })),

      setMatchLoading: (isLoading) => set((state) => ({
        matches: { ...state.matches, isLoading }
      })),

      setMatchError: (error) => set((state) => ({
        matches: { ...state.matches, error }
      })),

      fetchMatches: async () => {
        set((state) => ({ matches: { ...state.matches, isLoading: true, error: null } }));
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://172.16.1.235:3001';
          const response = await fetch(`${apiUrl}/api/matches`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch matches: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          set((state) => ({
            matches: {
              ...state.matches,
              matches: data.matches || [],
              isLoading: false,
              error: null,
            }
          }));
        } catch (error) {
          console.error('Error fetching matches:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to connect to server. Please make sure the backend is running.';
          set((state) => ({
            matches: {
              ...state.matches,
              error: errorMessage,
              isLoading: false,
            }
          }));
        }
      },

      fetchMatchById: async (matchId: string) => {
        set((state) => ({ matches: { ...state.matches, isLoading: true, error: null } }));
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://172.16.1.235:3001';
          const response = await fetch(`${apiUrl}/api/matches/${matchId}`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Match not found: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          set((state) => ({
            matches: {
              ...state.matches,
              currentMatch: data || null,
              isLoading: false,
              error: null,
            }
          }));
        } catch (error) {
          console.error('Error fetching match:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to connect to server';
          set((state) => ({
            matches: {
              ...state.matches,
              error: errorMessage,
              isLoading: false,
              currentMatch: null,
            }
          }));
        }
      },

      createMatch: async (gameType, stakeAmount) => {
        set((state) => ({ matches: { ...state.matches, isLoading: true } }));
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://172.16.1.235:3001';
          const user = get().auth.user;
          
          console.log('Creating match...', { user, gameType, stakeAmount });
          
          if (!user) {
            throw new Error('Please connect your wallet first');
          }

          const token = localStorage.getItem('auth_token');
          console.log('Auth token:', token ? 'Found' : 'Not found');
          
          const requestBody = { 
            creatorAddress: user.address, 
            gameType, 
            stakeAmount 
          };
          
          console.log('Request:', { url: `${apiUrl}/api/matches`, body: requestBody });
          
          const response = await fetch(`${apiUrl}/api/matches`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            credentials: 'include', // Include cookies
            body: JSON.stringify(requestBody),
          });
          
          console.log('Response status:', response.status);
          
          if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Failed to create match' }));
            console.error('API Error:', error);
            throw new Error(error.message || 'Failed to create match');
          }
          
          const data = await response.json();
          console.log('Match created:', data);
          
          get().addNotification({
            type: 'success',
            message: 'Match created successfully!',
          });
          
          // Refresh match list
          await get().fetchMatches();
        } catch (error) {
          console.error('Error creating match:', error);
          get().addNotification({
            type: 'error',
            message: error instanceof Error ? error.message : 'Failed to create match',
          });
        } finally {
          set((state) => ({ matches: { ...state.matches, isLoading: false } }));
        }
      },

      joinMatch: async (matchId) => {
        set((state) => ({ matches: { ...state.matches, isLoading: true } }));
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://172.16.1.235:3001';
          const user = get().auth.user;
          if (!user) throw new Error('User not connected');

          const token = localStorage.getItem('auth_token');
          const response = await fetch(`${apiUrl}/api/matches/${matchId}/join`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            credentials: 'include', // Include cookies
            body: JSON.stringify({ playerAddress: user.address }),
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to join match');
          }
          
          get().addNotification({
            type: 'success',
            message: 'Joined match successfully!',
          });
          
          // Refresh match list
          await get().fetchMatches();
        } catch (error) {
          console.error('Error joining match:', error);
          get().addNotification({
            type: 'error',
            message: error instanceof Error ? error.message : 'Failed to join match',
          });
        } finally {
          set((state) => ({ matches: { ...state.matches, isLoading: false } }));
        }
      },

      // Tournament state
      tournaments: {
        tournaments: [],
        currentTournament: null,
        isLoading: false,
        error: null,
      },

      setTournaments: (tournaments) => set((state) => ({
        tournaments: { ...state.tournaments, tournaments }
      })),

      setCurrentTournament: (tournament) => set((state) => ({
        tournaments: { ...state.tournaments, currentTournament: tournament }
      })),

      fetchTournaments: async () => {
        set((state) => ({ tournaments: { ...state.tournaments, isLoading: true } }));
        try {
          const response = await fetch('/api/tournaments');
          const data = await response.json();
          set((state) => ({
            tournaments: {
              ...state.tournaments,
              tournaments: data.tournaments || [],
              isLoading: false,
            }
          }));
        } catch (error) {
          set((state) => ({
            tournaments: {
              ...state.tournaments,
              error: error instanceof Error ? error.message : 'Failed to fetch tournaments',
              isLoading: false,
            }
          }));
        }
      },

      // Game state
      game: {
        gameType: null,
        projectileDuelState: null,
        gravityPaintersState: null,
        isPlaying: false,
        localPlayerAddress: null,
      },

      setGameType: (gameType) => set((state) => ({
        game: { ...state.game, gameType }
      })),

      updateProjectileDuelState: (state) => set((prev) => ({
        game: { ...prev.game, projectileDuelState: state }
      })),

      updateGravityPaintersState: (state) => set((prev) => ({
        game: { ...prev.game, gravityPaintersState: state }
      })),

      startGame: (matchId, playerAddress) => set((state) => ({
        game: {
          ...state.game,
          isPlaying: true,
          localPlayerAddress: playerAddress,
        }
      })),

      endGame: () => set(() => ({
        game: {
          gameType: null,
          projectileDuelState: null,
          gravityPaintersState: null,
          isPlaying: false,
          localPlayerAddress: null,
        }
      })),

      // Notifications
      notifications: {
        notifications: [],
      },

      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification: Notification = { ...notification, id };
        
        set((state) => ({
          notifications: {
            notifications: [...state.notifications.notifications, newNotification],
          }
        }));

        // Auto-remove after duration (default 5 seconds)
        setTimeout(() => {
          get().removeNotification(id);
        }, notification.duration || 5000);
      },

      removeNotification: (id) => set((state) => ({
        notifications: {
          notifications: state.notifications.notifications.filter((n) => n.id !== id),
        }
      })),
    }),
    {
      name: 'bitarena-auth-storage',
      partialize: (state) => ({ auth: state.auth }), // Only persist auth
    }
  )
);
