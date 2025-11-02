/**
 * Database Seeder Script
 * Populates database with test data for development
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = process.env.DATABASE_URL 
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'bitarena',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    });

const testUsers = [
  {
    address: '0x1234567890123456789012345678901234567890',
    username: 'PlayerOne',
    elo_rating: 1500,
    wins: 10,
    losses: 5,
  },
  {
    address: '0x2345678901234567890123456789012345678901',
    username: 'GameMaster',
    elo_rating: 1800,
    wins: 25,
    losses: 10,
  },
  {
    address: '0x3456789012345678901234567890123456789012',
    username: 'NoobSlayer',
    elo_rating: 1350,
    wins: 8,
    losses: 12,
  },
  {
    address: '0x4567890123456789012345678901234567890123',
    username: 'ProGamer',
    elo_rating: 2000,
    wins: 45,
    losses: 15,
  },
];

async function seed() {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await pool.query('TRUNCATE users, matches, match_players, tournaments, tournament_participants, game_logs CASCADE');
    console.log('✅ Data cleared\n');
    
    // Insert test users
    console.log('👥 Inserting test users...');
    for (const user of testUsers) {
      await pool.query(
        `INSERT INTO users (address, username, elo_rating, wins, losses, total_matches, total_earnings)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          user.address,
          user.username,
          user.elo_rating,
          user.wins,
          user.losses,
          user.wins + user.losses,
          (Math.random() * 1000).toFixed(6),
        ]
      );
      console.log(`   ✅ Created user: ${user.username}`);
    }
    
    // Create test matches
    console.log('\n🎮 Creating test matches...');
    
    // Pending match
    const pendingMatch = await pool.query(
      `INSERT INTO matches (game_type, stake_amount, max_players, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['projectile-duel', '10.0', 2, 'pending']
    );
    await pool.query(
      `INSERT INTO match_players (match_id, user_address, player_index, is_ready)
       VALUES ($1, $2, $3, $4)`,
      [pendingMatch.rows[0].id, testUsers[0].address, 0, true]
    );
    console.log('   ✅ Created pending match (waiting for player 2)');
    
    // Active match
    const activeMatch = await pool.query(
      `INSERT INTO matches (game_type, stake_amount, max_players, status, started_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      ['gravity-painters', '25.0', 2, 'active']
    );
    await pool.query(
      `INSERT INTO match_players (match_id, user_address, player_index, is_ready, score)
       VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10)`,
      [
        activeMatch.rows[0].id, testUsers[1].address, 0, true, 150,
        activeMatch.rows[0].id, testUsers[2].address, 1, true, 120,
      ]
    );
    console.log('   ✅ Created active match (in progress)');
    
    // Completed match
    const completedMatch = await pool.query(
      `INSERT INTO matches (game_type, stake_amount, max_players, status, winner_address, started_at, ended_at)
       VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '45 minutes')
       RETURNING id`,
      ['projectile-duel', '50.0', 2, 'completed', testUsers[3].address]
    );
    await pool.query(
      `INSERT INTO match_players (match_id, user_address, player_index, is_ready, score)
       VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10)`,
      [
        completedMatch.rows[0].id, testUsers[3].address, 0, true, 5,
        completedMatch.rows[0].id, testUsers[0].address, 1, true, 3,
      ]
    );
    console.log('   ✅ Created completed match (finished)');
    
    // Create test tournament
    console.log('\n🏆 Creating test tournament...');
    const tournament = await pool.query(
      `INSERT INTO tournaments (name, game_type, entry_fee, max_participants, current_participants, status, start_time)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '2 hours')
       RETURNING id`,
      ['Weekly Championship', 'projectile-duel', '100.0', 16, 4, 'registration']
    );
    
    // Add tournament participants
    for (let i = 0; i < 4; i++) {
      await pool.query(
        `INSERT INTO tournament_participants (tournament_id, user_address, seed_position)
         VALUES ($1, $2, $3)`,
        [tournament.rows[0].id, testUsers[i].address, i + 1]
      );
    }
    console.log('   ✅ Created tournament with 4 participants');
    
    // Verify seeded data
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const matchCount = await pool.query('SELECT COUNT(*) FROM matches');
    const tournamentCount = await pool.query('SELECT COUNT(*) FROM tournaments');
    
    console.log('\n📊 Seeding complete!');
    console.log(`   - Users: ${userCount.rows[0].count}`);
    console.log(`   - Matches: ${matchCount.rows[0].count}`);
    console.log(`   - Tournaments: ${tournamentCount.rows[0].count}`);
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Test accounts:');
    testUsers.forEach((user) => {
      console.log(`   - ${user.username}: ${user.address}`);
    });
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
