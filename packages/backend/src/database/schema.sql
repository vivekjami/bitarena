-- BitArena Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    address VARCHAR(42) PRIMARY KEY,
    passport_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50),
    elo_rating INTEGER DEFAULT 1200 NOT NULL,
    total_matches INTEGER DEFAULT 0 NOT NULL,
    wins INTEGER DEFAULT 0 NOT NULL,
    losses INTEGER DEFAULT 0 NOT NULL,
    total_wagered DECIMAL(18, 2) DEFAULT 0 NOT NULL,
    total_winnings DECIMAL(18, 2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for users
CREATE INDEX idx_users_elo ON users(elo_rating DESC);
CREATE INDEX idx_users_created ON users(created_at DESC);
CREATE INDEX idx_users_passport ON users(passport_id);

-- Matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_match_id INTEGER UNIQUE,
    game_type VARCHAR(20) NOT NULL CHECK (game_type IN ('ProjectileDuel', 'GravityPainters')),
    stake_amount DECIMAL(18, 2) NOT NULL,
    max_players INTEGER NOT NULL CHECK (max_players >= 2 AND max_players <= 10),
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'disputed', 'cancelled')),
    winner_address VARCHAR(42) REFERENCES users(address),
    total_pot DECIMAL(18, 2),
    game_data_hash VARCHAR(66),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for matches
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_created ON matches(created_at DESC);
CREATE INDEX idx_matches_game_type ON matches(game_type);
CREATE INDEX idx_matches_contract_id ON matches(contract_match_id);

-- Match players junction table
CREATE TABLE match_players (
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    player_address VARCHAR(42) REFERENCES users(address),
    join_order INTEGER NOT NULL,
    final_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (match_id, player_address)
);

-- Indexes for match_players
CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_match_players_player ON match_players(player_address);

-- Tournaments table
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_tournament_id INTEGER UNIQUE,
    name VARCHAR(100) NOT NULL,
    entry_fee DECIMAL(18, 2) NOT NULL,
    prize_pool DECIMAL(18, 2) DEFAULT 0 NOT NULL,
    max_players INTEGER NOT NULL CHECK (max_players IN (4, 8, 16, 32, 64)),
    current_round INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'registration' NOT NULL CHECK (status IN ('registration', 'active', 'completed', 'cancelled')),
    bracket_data JSONB,
    prize_distribution INTEGER[] NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for tournaments
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_created ON tournaments(created_at DESC);
CREATE INDEX idx_tournaments_start ON tournaments(start_time);

-- Tournament participants junction table
CREATE TABLE tournament_participants (
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player_address VARCHAR(42) REFERENCES users(address),
    registration_order INTEGER NOT NULL,
    current_round INTEGER DEFAULT 1,
    eliminated BOOLEAN DEFAULT FALSE,
    final_placement INTEGER,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (tournament_id, player_address)
);

-- Indexes for tournament_participants
CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_player ON tournament_participants(player_address);

-- Game logs table (partitioned by timestamp for performance)
CREATE TABLE game_logs (
    id BIGSERIAL,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    tick INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions for game_logs (example for current month)
CREATE TABLE game_logs_2025_10 PARTITION OF game_logs
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE game_logs_2025_11 PARTITION OF game_logs
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE game_logs_2025_12 PARTITION OF game_logs
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Indexes for game_logs
CREATE INDEX idx_game_logs_match_tick ON game_logs(match_id, tick);
CREATE INDEX idx_game_logs_timestamp ON game_logs(timestamp DESC);

-- Sessions table for JWT management
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42) REFERENCES users(address) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for sessions
CREATE INDEX idx_sessions_user ON sessions(user_address);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
    BEFORE UPDATE ON tournaments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- Leaderboard view
CREATE VIEW leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY elo_rating DESC) as rank,
    address,
    username,
    elo_rating,
    total_matches,
    wins,
    losses,
    CASE WHEN total_matches > 0 
        THEN ROUND((wins::DECIMAL / total_matches * 100), 2)
        ELSE 0 
    END as win_rate,
    total_wagered,
    total_winnings
FROM users
WHERE total_matches > 0
ORDER BY elo_rating DESC
LIMIT 100;

-- Active matches view
CREATE VIEW active_matches AS
SELECT 
    m.id,
    m.game_type,
    m.stake_amount,
    m.max_players,
    m.status,
    COUNT(mp.player_address) as current_players,
    m.created_at
FROM matches m
LEFT JOIN match_players mp ON m.id = mp.match_id
WHERE m.status IN ('pending', 'active')
GROUP BY m.id
ORDER BY m.created_at DESC;

-- User match history view
CREATE VIEW user_match_history AS
SELECT 
    mp.player_address,
    m.id as match_id,
    m.game_type,
    m.stake_amount,
    m.status,
    m.winner_address,
    mp.final_score,
    CASE WHEN m.winner_address = mp.player_address THEN TRUE ELSE FALSE END as is_winner,
    m.start_time,
    m.end_time,
    CASE WHEN m.end_time IS NOT NULL AND m.start_time IS NOT NULL
        THEN EXTRACT(EPOCH FROM (m.end_time - m.start_time))
        ELSE NULL
    END as duration_seconds
FROM match_players mp
JOIN matches m ON mp.match_id = m.id
WHERE m.status = 'completed'
ORDER BY m.end_time DESC;
