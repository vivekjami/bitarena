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

    // Start server on all interfaces (0.0.0.0) for remote access
    const host = process.env.SERVER_HOST || '0.0.0.0';
    const serverIp = process.env.DB_HOST || 'localhost'; // Use same IP as DB
    
    httpServer.listen(config.port, host, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          🎮 BitArena Backend Server 🎮                    ║
║                                                            ║
║  HTTP:  http://${serverIp}:${config.port}                     ${' '.repeat(Math.max(0, 28 - serverIp.length))}║
║  WS:    ws://${serverIp}:${config.port}                       ${' '.repeat(Math.max(0, 28 - serverIp.length))}║
║  Local: http://localhost:${config.port}                          ║
║                                                            ║
║  Environment: ${config.nodeEnv.padEnd(30)}            ║
║  Database: ${config.database.name.padEnd(33)}            ║
║  Listening on: ${host.padEnd(28)}            ║
║                                                            ║
║  Deployed Contracts (Mezo Testnet):                       ║
║  • MUSD Token: ${(process.env.MUSD_TOKEN_ADDRESS || 'Not configured').substring(0, 33)}      ║
║  • MatchEscrow: ${(process.env.MATCH_ESCROW_ADDRESS || 'Not configured').substring(0, 32)}      ║
║  • TournamentPool: ${(process.env.TOURNAMENT_POOL_ADDRESS || 'Not configured').substring(0, 29)}      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
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
