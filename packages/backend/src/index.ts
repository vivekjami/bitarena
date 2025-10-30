import { createServer } from 'http';
import { config } from './config';
import { db, redis } from './config/database';
import { createApp } from './app';
import { initializeWebSocket } from './websocket';
import { gameServer } from './game/GameServer';
import { oracleService } from './game/OracleService';

/**
 * Start server
 */
async function start() {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connected');

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket server
    const io = initializeWebSocket(httpServer);
    console.log('✅ WebSocket server initialized');

    // Store io instance globally for game server access
    (global as { io?: typeof io }).io = io;

    // Start game server (60Hz tick loop)
    gameServer.start();
    console.log('✅ Game server started (60Hz)');

    // Start oracle dispute monitoring
    oracleService.monitorDisputes();
    console.log('✅ Oracle service monitoring disputes');

    // Start server
    httpServer.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════╗
║                                        ║
║     🎮 BitArena Backend Server 🎮     ║
║                                        ║
║  HTTP: http://localhost:${config.port}      ║
║  WS:   ws://localhost:${config.port}        ║
║                                        ║
║  Environment: ${config.nodeEnv.padEnd(18)}  ║
║  Database: ${config.database.name.padEnd(21)}  ║
║                                        ║
╚════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
      
      gameServer.stop();
      console.log('✅ Game server stopped');

      httpServer.close(() => {
        console.log('✅ HTTP server closed');
      });

      await db.end();
      console.log('✅ Database connections closed');

      await redis.quit();
      console.log('✅ Redis connection closed');

      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('\n⚠️  SIGINT received, shutting down gracefully...');
      
      gameServer.stop();
      console.log('✅ Game server stopped');

      httpServer.close(() => {
        console.log('✅ HTTP server closed');
      });

      await db.end();
      console.log('✅ Database connections closed');

      await redis.quit();
      console.log('✅ Redis connection closed');

      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Start server
start();
