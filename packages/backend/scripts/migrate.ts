/**
 * Database Migration Script
 * Creates all necessary tables for BitArena
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
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

const migrations = [
  {
    name: 'Create users table',
    query: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        address VARCHAR(42) UNIQUE NOT NULL,
        username VARCHAR(50),
        email VARCHAR(255),
        avatar_url TEXT,
        elo_rating INTEGER DEFAULT 1200,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        total_matches INTEGER DEFAULT 0,
        total_earnings DECIMAL(18, 6) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);
      CREATE INDEX IF NOT EXISTS idx_users_elo ON users(elo_rating DESC);
    `,
  },
  {
    name: 'Create matches table',
    query: `
      CREATE TABLE IF NOT EXISTS matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_type VARCHAR(50) NOT NULL,
        stake_amount DECIMAL(18, 6) NOT NULL,
        max_players INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        winner_address VARCHAR(42),
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        contract_match_id INTEGER,
        dispute_status VARCHAR(20),
        metadata JSONB
      );
      
      CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
      CREATE INDEX IF NOT EXISTS idx_matches_game_type ON matches(game_type);
      CREATE INDEX IF NOT EXISTS idx_matches_created ON matches(created_at DESC);
    `,
  },
  {
    name: 'Create match_players table',
    query: `
      CREATE TABLE IF NOT EXISTS match_players (
        id SERIAL PRIMARY KEY,
        match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        user_address VARCHAR(42) NOT NULL,
        player_index INTEGER,
        score INTEGER DEFAULT 0,
        is_ready BOOLEAN DEFAULT false,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(match_id, user_address)
      );
      
      CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id);
      CREATE INDEX IF NOT EXISTS idx_match_players_user ON match_players(user_address);
    `,
  },
  {
    name: 'Create tournaments table',
    query: `
      CREATE TABLE IF NOT EXISTS tournaments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        game_type VARCHAR(50) NOT NULL,
        entry_fee DECIMAL(18, 6) NOT NULL,
        prize_pool DECIMAL(18, 6) DEFAULT 0,
        max_participants INTEGER NOT NULL,
        current_participants INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'registration',
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        contract_tournament_id INTEGER,
        bracket JSONB,
        rules JSONB
      );
      
      CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
      CREATE INDEX IF NOT EXISTS idx_tournaments_game ON tournaments(game_type);
      CREATE INDEX IF NOT EXISTS idx_tournaments_start ON tournaments(start_time);
    `,
  },
  {
    name: 'Create tournament_participants table',
    query: `
      CREATE TABLE IF NOT EXISTS tournament_participants (
        id SERIAL PRIMARY KEY,
        tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        user_address VARCHAR(42) NOT NULL,
        seed_position INTEGER,
        current_round INTEGER DEFAULT 0,
        is_eliminated BOOLEAN DEFAULT false,
        prize_won DECIMAL(18, 6) DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tournament_id, user_address)
      );
      
      CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
      CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_address);
    `,
  },
  {
    name: 'Create game_logs table',
    query: `
      CREATE TABLE IF NOT EXISTS game_logs (
        id SERIAL PRIMARY KEY,
        match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        event_data JSONB NOT NULL,
        tick_number INTEGER,
        player_address VARCHAR(42),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_game_logs_match ON game_logs(match_id);
      CREATE INDEX IF NOT EXISTS idx_game_logs_type ON game_logs(event_type);
      CREATE INDEX IF NOT EXISTS idx_game_logs_created ON game_logs(created_at DESC);
    `,
  },
  {
    name: 'Create leaderboard view',
    query: `
      CREATE OR REPLACE VIEW leaderboard AS
      SELECT 
        address,
        username,
        elo_rating,
        wins,
        losses,
        total_matches,
        total_earnings,
        CASE 
          WHEN total_matches > 0 THEN ROUND((wins::NUMERIC / total_matches::NUMERIC) * 100, 2)
          ELSE 0 
        END as win_rate,
        ROW_NUMBER() OVER (ORDER BY elo_rating DESC, total_earnings DESC) as rank
      FROM users
      WHERE total_matches > 0
      ORDER BY elo_rating DESC, total_earnings DESC;
    `,
  },
  {
    name: 'Create updated_at trigger function',
    query: `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `,
  },
  {
    name: 'Add updated_at triggers',
    query: `
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
      CREATE TRIGGER update_matches_updated_at 
        BEFORE UPDATE ON matches 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments;
      CREATE TRIGGER update_tournaments_updated_at 
        BEFORE UPDATE ON tournaments 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `,
  },
];

async function migrate() {
  console.log('🚀 Starting database migration...\n');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
    
    // Run migrations
    for (const migration of migrations) {
      try {
        console.log(`Running: ${migration.name}`);
        await pool.query(migration.query);
        console.log(`✅ ${migration.name} completed\n`);
      } catch (error: any) {
        console.error(`❌ ${migration.name} failed:`);
        console.error(error.message);
        throw error;
      }
    }
    
    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📊 Created tables:');
    tablesResult.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update .env with your database credentials');
    console.log('   2. Run: npm run seed (to add test data)');
    console.log('   3. Run: npm run dev (to start the backend)');
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
migrate();
