import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verify } from 'jsonwebtoken';
import { config } from './config';
import { redis, REDIS_KEYS } from './config/database';

interface AuthSocket extends Socket {
  userId?: string;
  address?: string;
}

interface PlayerInput {
  matchId: string;
  timestamp: number;
  inputType: string;
  data: unknown;
}

/**
 * Initialize Socket.io server
 */
export const initializeWebSocket = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('auth_token=')[1]?.split(';')[0];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify JWT
      const decoded = verify(token, config.jwt.secret) as { address: string; passportId: string };

      // Check session in Redis
      const sessionKey = REDIS_KEYS.SESSION(token);
      const sessionExists = await redis.exists(sessionKey);

      if (!sessionExists) {
        return next(new Error('Session expired'));
      }

      // Attach user info to socket
      socket.address = decoded.address;
      socket.userId = decoded.address;

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthSocket) => {
    console.log(`✅ Client connected: ${socket.address}`);

    // Handle join-match event
    socket.on('join-match', async (matchId: string) => {
      try {
        // Validate match ID
        if (!matchId) {
          socket.emit('error', { message: 'Match ID required' });
          return;
        }

        // Join match room
        socket.join(`match:${matchId}`);
        
        // Notify others in room
        socket.to(`match:${matchId}`).emit('player-joined', {
          address: socket.address,
          timestamp: Date.now(),
        });

        // Send current game state to joining player
        const gameState = await redis.get(`match:${matchId}:state`);
        if (gameState) {
          socket.emit('game-state', JSON.parse(gameState));
        }

        console.log(`Player ${socket.address} joined match ${matchId}`);
      } catch (error) {
        console.error('Join match error:', error);
        socket.emit('error', { message: 'Failed to join match' });
      }
    });

    // Handle player input
    socket.on('player-input', async (input: PlayerInput) => {
      try {
        const { matchId, timestamp, inputType, data } = input;

        // Validate input
        if (!matchId || !inputType) {
          return;
        }

        // Add to input queue in Redis
        const queueKey = `match:${matchId}:inputs`;
        await redis.rpush(
          queueKey,
          JSON.stringify({
            address: socket.address,
            timestamp,
            inputType,
            data,
          })
        );

        // Set expiry on queue (5 minutes)
        await redis.expire(queueKey, 300);

        // Echo input back to sender for client prediction
        socket.emit('input-ack', { timestamp, inputType });

        // Broadcast to other players (optional, for spectators)
        socket.to(`match:${matchId}`).emit('player-input-broadcast', {
          address: socket.address,
          inputType,
          timestamp,
        });
      } catch (error) {
        console.error('Player input error:', error);
      }
    });

    // Handle leave-match event
    socket.on('leave-match', (matchId: string) => {
      if (!matchId) return;

      socket.leave(`match:${matchId}`);
      
      socket.to(`match:${matchId}`).emit('player-left', {
        address: socket.address,
        timestamp: Date.now(),
      });

      console.log(`Player ${socket.address} left match ${matchId}`);
    });

    // Handle spectator join
    socket.on('spectate-match', (matchId: string) => {
      if (!matchId) return;

      socket.join(`match:${matchId}:spectators`);
      
      console.log(`Spectator ${socket.address} watching match ${matchId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.address}`);
      
      // Notify all rooms this player was in
      const rooms = Array.from(socket.rooms).filter(room => room.startsWith('match:'));
      rooms.forEach(room => {
        socket.to(room).emit('player-disconnected', {
          address: socket.address,
          timestamp: Date.now(),
        });
      });
    });
  });

  return io;
};

/**
 * Broadcast game state to all players in a match
 */
export const broadcastGameState = (io: SocketServer, matchId: string, gameState: unknown): void => {
  io.to(`match:${matchId}`).emit('game-state', gameState);
  io.to(`match:${matchId}:spectators`).emit('game-state', gameState);
};

/**
 * Send match completion event
 */
export const broadcastMatchComplete = (
  io: SocketServer,
  matchId: string,
  winner: string,
  finalState: unknown
): void => {
  io.to(`match:${matchId}`).emit('match-complete', {
    winner,
    finalState,
    timestamp: Date.now(),
  });
  
  io.to(`match:${matchId}:spectators`).emit('match-complete', {
    winner,
    finalState,
    timestamp: Date.now(),
  });
};
