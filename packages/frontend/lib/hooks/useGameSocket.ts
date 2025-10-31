'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store';
import type { 
  ProjectileDuelState, 
  GravityPaintersState, 
  PlayerInput,
  GameType 
} from '../types';

/**
 * WebSocket configuration
 */
const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

/**
 * Hook for managing WebSocket connection to game server
 */
export const useGameSocket = (matchId: string, gameType: GameType) => {
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const updateProjectileDuelState = useAppStore((state) => state.updateProjectileDuelState);
  const updateGravityPaintersState = useAppStore((state) => state.updateGravityPaintersState);
  const addNotification = useAppStore((state) => state.addNotification);
  const user = useAppStore((state) => state.auth.user);

  /**
   * Send player input to server
   */
  const sendInput = useCallback((input: Omit<PlayerInput, 'timestamp'>) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket not connected, input not sent');
      return;
    }

    const fullInput: PlayerInput = {
      ...input,
      timestamp: Date.now(),
    };

    socketRef.current.emit('player:input', {
      matchId,
      input: fullInput,
    });
  }, [matchId]);

  /**
   * Initialize socket connection
   */
  useEffect(() => {
    if (!matchId || !user) return;

    console.log(`🔌 Connecting to WebSocket for match ${matchId}`);

    // Create socket connection with auth
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setSocket(socket);
      setIsConnected(true);
      
      // Join match room
      socket.emit('match:join', { matchId });
      
      addNotification({
        type: 'success',
        message: 'Connected to game server',
        duration: 3000,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
      
      addNotification({
        type: 'warning',
        message: 'Disconnected from game server',
        duration: 3000,
      });
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
      
      addNotification({
        type: 'error',
        message: 'Failed to connect to game server',
        duration: 5000,
      });
    });

    // Match events
    socket.on('match:joined', (data) => {
      console.log('Joined match room:', data);
    });

    socket.on('match:state', (state: ProjectileDuelState | GravityPaintersState) => {
      // Update appropriate state based on game type
      if (gameType === 'ProjectileDuel') {
        updateProjectileDuelState(state as ProjectileDuelState);
      } else if (gameType === 'GravityPainters') {
        updateGravityPaintersState(state as GravityPaintersState);
      }
    });

    socket.on('match:ended', (data: { winner: string; reason: string }) => {
      console.log('Match ended:', data);
      
      const isWinner = data.winner.toLowerCase() === user.address.toLowerCase();
      
      addNotification({
        type: isWinner ? 'success' : 'info',
        message: isWinner 
          ? `🎉 You won! Reason: ${data.reason}` 
          : `Match ended. Winner: ${data.winner}`,
        duration: 10000,
      });
    });

    socket.on('player:joined', (data) => {
      console.log('Player joined:', data);
      
      addNotification({
        type: 'info',
        message: `Player ${data.address} joined the match`,
        duration: 3000,
      });
    });

    socket.on('player:left', (data) => {
      console.log('Player left:', data);
      
      addNotification({
        type: 'warning',
        message: `Player ${data.address} left the match`,
        duration: 3000,
      });
    });

    // Cleanup
    return () => {
      console.log('🔌 Cleaning up WebSocket connection');
      
      const currentSocket = socketRef.current;
      const currentTimeout = reconnectTimeoutRef.current;
      
      if (currentSocket) {
        currentSocket.emit('match:leave', { matchId });
        currentSocket.disconnect();
        socketRef.current = null;
      }
      
      if (currentTimeout) {
        clearTimeout(currentTimeout);
        reconnectTimeoutRef.current = null;
      }
      
      setSocket(null);
      setIsConnected(false);
    };
  }, [matchId, user, gameType, updateProjectileDuelState, updateGravityPaintersState, addNotification]);

  return {
    socket,
    isConnected,
    sendInput,
  };
}

/**
 * Hook for sending game inputs
 * Note: Pass empty strings if matchId/gameType are not yet available
 */
export function useGameInput(matchId: string, gameType: GameType) {
  const { sendInput } = useGameSocket(matchId, gameType);

  /**
   * Send movement input (WASD)
   */
  const sendMovement = useCallback((direction: { x: number; y: number }) => {
    sendInput({
      action: 'move',
      data: { direction },
    });
  }, [sendInput]);

  /**
   * Send rotation input (mouse aim)
   */
  const sendRotation = useCallback((angle: number) => {
    sendInput({
      action: 'rotate',
      data: { angle },
    });
  }, [sendInput]);

  /**
   * Send shoot input (click)
   */
  const sendShoot = useCallback(() => {
    sendInput({
      action: 'shoot',
      data: {},
    });
  }, [sendInput]);

  /**
   * Send particle emission toggle
   */
  const sendEmit = useCallback((emitting: boolean) => {
    sendInput({
      action: 'emit',
      data: { emitting },
    });
  }, [sendInput]);

  /**
   * Send gravity adjustment
   */
  const sendGravityAdjust = useCallback((strength: number) => {
    sendInput({
      action: 'adjust-gravity',
      data: { strength },
    });
  }, [sendInput]);

  return {
    sendMovement,
    sendRotation,
    sendShoot,
    sendEmit,
    sendGravityAdjust,
  };
}
