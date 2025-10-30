-- Seed data for testing BitArena

-- Insert test users with varying ELO ratings
INSERT INTO users (address, passport_id, username, elo_rating, total_matches, wins, losses, total_wagered, total_winnings) VALUES
('0x1111111111111111111111111111111111111111', 'passport_alice_001', 'AliceGamer', 1850, 150, 95, 55, 750.00, 892.50),
('0x2222222222222222222222222222222222222222', 'passport_bob_002', 'BobTheBuilder', 1620, 85, 45, 40, 425.00, 487.25),
('0x3333333333333333333333333333333333333333', 'passport_carol_003', 'CarolSniper', 1750, 120, 75, 45, 600.00, 712.50),
('0x4444444444444444444444444444444444444444', 'passport_dave_004', 'DaveDestroyer', 1520, 60, 28, 32, 300.00, 312.00),
('0x5555555555555555555555555555555555555555', 'passport_eve_005', 'EveElite', 1900, 200, 135, 65, 1000.00, 1275.00),
('0x6666666666666666666666666666666666666666', 'passport_frank_006', 'FrankFast', 1450, 45, 20, 25, 225.00, 218.75),
('0x7777777777777777777777777777777777777777', 'passport_grace_007', 'GraceGravity', 1680, 95, 55, 40, 475.00, 556.25),
('0x8888888888888888888888888888888888888888', 'passport_hank_008', 'HankHero', 1580, 75, 38, 37, 375.00, 398.75),
('0x9999999999999999999999999999999999999999', 'passport_iris_009', 'IrisInfinity', 1720, 105, 62, 43, 525.00, 618.75),
('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'passport_jack_010', 'JackJoker', 1490, 55, 24, 31, 275.00, 268.75),
('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'passport_kate_011', 'KateKiller', 1650, 90, 50, 40, 450.00, 518.75),
('0xcccccccccccccccccccccccccccccccccccccccc', 'passport_leo_012', 'LeoLegend', 1780, 130, 80, 50, 650.00, 781.25),
('0xdddddddddddddddddddddddddddddddddddddddd', 'passport_mia_013', 'MiaMaster', 1420, 40, 16, 24, 200.00, 187.50),
('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 'passport_noah_014', 'NoahNinja', 1550, 70, 35, 35, 350.00, 368.75),
('0xffffffffffffffffffffffffffffffffffffffff', 'passport_olivia_015', 'OliviaOracle', 1820, 140, 88, 52, 700.00, 856.25);

-- Insert demo matches in various states

-- Pending matches (waiting for players)
INSERT INTO matches (id, contract_match_id, game_type, stake_amount, max_players, status, total_pot, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 1001, 'ProjectileDuel', 5.00, 2, 'pending', 5.00, NOW() - INTERVAL '5 minutes'),
('550e8400-e29b-41d4-a716-446655440002', 1002, 'GravityPainters', 10.00, 6, 'pending', 30.00, NOW() - INTERVAL '3 minutes'),
('550e8400-e29b-41d4-a716-446655440003', 1003, 'ProjectileDuel', 2.50, 2, 'pending', 2.50, NOW() - INTERVAL '1 minute');

-- Match players for pending matches
INSERT INTO match_players (match_id, player_address, join_order, final_score) VALUES
('550e8400-e29b-41d4-a716-446655440001', '0x1111111111111111111111111111111111111111', 1, 0),
('550e8400-e29b-41d4-a716-446655440002', '0x2222222222222222222222222222222222222222', 1, 0),
('550e8400-e29b-41d4-a716-446655440002', '0x3333333333333333333333333333333333333333', 2, 0),
('550e8400-e29b-41d4-a716-446655440002', '0x4444444444444444444444444444444444444444', 3, 0),
('550e8400-e29b-41d4-a716-446655440003', '0x5555555555555555555555555555555555555555', 1, 0);

-- Active matches (currently being played)
INSERT INTO matches (id, contract_match_id, game_type, stake_amount, max_players, status, total_pot, start_time, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440010', 1010, 'ProjectileDuel', 5.00, 2, 'active', 10.00, NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '10 minutes'),
('550e8400-e29b-41d4-a716-446655440011', 1011, 'GravityPainters', 7.50, 4, 'active', 30.00, NOW() - INTERVAL '1 minute', NOW() - INTERVAL '8 minutes');

INSERT INTO match_players (match_id, player_address, join_order, final_score) VALUES
('550e8400-e29b-41d4-a716-446655440010', '0x6666666666666666666666666666666666666666', 1, 3),
('550e8400-e29b-41d4-a716-446655440010', '0x7777777777777777777777777777777777777777', 2, 2),
('550e8400-e29b-41d4-a716-446655440011', '0x8888888888888888888888888888888888888888', 1, 45),
('550e8400-e29b-41d4-a716-446655440011', '0x9999999999999999999999999999999999999999', 2, 52),
('550e8400-e29b-41d4-a716-446655440011', '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 3, 38),
('550e8400-e29b-41d4-a716-446655440011', '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 4, 41);

-- Completed matches
INSERT INTO matches (id, contract_match_id, game_type, stake_amount, max_players, status, winner_address, total_pot, game_data_hash, start_time, end_time, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440020', 1020, 'ProjectileDuel', 5.00, 2, 'completed', '0x1111111111111111111111111111111111111111', 10.00, '0xabcd1234', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '57 minutes', NOW() - INTERVAL '1 hour 5 minutes'),
('550e8400-e29b-41d4-a716-446655440021', 1021, 'GravityPainters', 10.00, 6, 'completed', '0x5555555555555555555555555555555555555555', 60.00, '0xef567890', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '117 minutes', NOW() - INTERVAL '2 hours 10 minutes'),
('550e8400-e29b-41d4-a716-446655440022', 1022, 'ProjectileDuel', 2.50, 2, 'completed', '0x3333333333333333333333333333333333333333', 5.00, '0x12345678', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '27 minutes', NOW() - INTERVAL '35 minutes');

INSERT INTO match_players (match_id, player_address, join_order, final_score) VALUES
('550e8400-e29b-41d4-a716-446655440020', '0x1111111111111111111111111111111111111111', 1, 5),
('550e8400-e29b-41d4-a716-446655440020', '0x2222222222222222222222222222222222222222', 2, 3),
('550e8400-e29b-41d4-a716-446655440021', '0x5555555555555555555555555555555555555555', 1, 68),
('550e8400-e29b-41d4-a716-446655440021', '0x6666666666666666666666666666666666666666', 2, 45),
('550e8400-e29b-41d4-a716-446655440021', '0x7777777777777777777777777777777777777777', 3, 52),
('550e8400-e29b-41d4-a716-446655440021', '0x8888888888888888888888888888888888888888', 4, 38),
('550e8400-e29b-41d4-a716-446655440021', '0x9999999999999999999999999999999999999999', 5, 41),
('550e8400-e29b-41d4-a716-446655440021', '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 6, 33),
('550e8400-e29b-41d4-a716-446655440022', '0x3333333333333333333333333333333333333333', 1, 5),
('550e8400-e29b-41d4-a716-446655440022', '0x4444444444444444444444444444444444444444', 2, 4);

-- Insert demo tournaments

-- Active tournament
INSERT INTO tournaments (id, contract_tournament_id, name, entry_fee, prize_pool, max_players, current_round, status, prize_distribution, start_time, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 2001, 'Weekend Warriors Championship', 10.00, 80.00, 8, 1, 'active', ARRAY[60, 30, 10], NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '2 hours');

INSERT INTO tournament_participants (tournament_id, player_address, registration_order, current_round, eliminated) VALUES
('660e8400-e29b-41d4-a716-446655440001', '0x1111111111111111111111111111111111111111', 1, 2, FALSE),
('660e8400-e29b-41d4-a716-446655440001', '0x2222222222222222222222222222222222222222', 2, 1, TRUE),
('660e8400-e29b-41d4-a716-446655440001', '0x3333333333333333333333333333333333333333', 3, 2, FALSE),
('660e8400-e29b-41d4-a716-446655440001', '0x4444444444444444444444444444444444444444', 4, 1, TRUE),
('660e8400-e29b-41d4-a716-446655440001', '0x5555555555555555555555555555555555555555', 5, 2, FALSE),
('660e8400-e29b-41d4-a716-446655440001', '0x6666666666666666666666666666666666666666', 6, 1, TRUE),
('660e8400-e29b-41d4-a716-446655440001', '0x7777777777777777777777777777777777777777', 7, 2, FALSE),
('660e8400-e29b-41d4-a716-446655440001', '0x8888888888888888888888888888888888888888', 8, 1, TRUE);

-- Registration tournament
INSERT INTO tournaments (id, contract_tournament_id, name, entry_fee, prize_pool, max_players, current_round, status, prize_distribution, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440002', 2002, 'Friday Night Showdown', 5.00, 15.00, 16, 0, 'registration', ARRAY[50, 25, 15, 10], NOW() - INTERVAL '15 minutes');

INSERT INTO tournament_participants (tournament_id, player_address, registration_order, current_round, eliminated) VALUES
('660e8400-e29b-41d4-a716-446655440002', '0x9999999999999999999999999999999999999999', 1, 1, FALSE),
('660e8400-e29b-41d4-a716-446655440002', '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 2, 1, FALSE),
('660e8400-e29b-41d4-a716-446655440002', '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 3, 1, FALSE);

-- Completed tournament
INSERT INTO tournaments (id, contract_tournament_id, name, entry_fee, prize_pool, max_players, current_round, status, prize_distribution, start_time, end_time, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440003', 2003, 'Monday Madness Cup', 7.50, 60.00, 8, 3, 'completed', ARRAY[60, 30, 10], NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '6 hours');

INSERT INTO tournament_participants (tournament_id, player_address, registration_order, current_round, eliminated, final_placement) VALUES
('660e8400-e29b-41d4-a716-446655440003', '0xcccccccccccccccccccccccccccccccccccccccc', 1, 3, FALSE, 1),
('660e8400-e29b-41d4-a716-446655440003', '0xdddddddddddddddddddddddddddddddddddddddd', 2, 3, TRUE, 2),
('660e8400-e29b-41d4-a716-446655440003', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 3, 2, TRUE, 3),
('660e8400-e29b-41d4-a716-446655440003', '0xffffffffffffffffffffffffffffffffffffffff', 4, 2, TRUE, 4),
('660e8400-e29b-41d4-a716-446655440003', '0x1111111111111111111111111111111111111111', 5, 1, TRUE, 5),
('660e8400-e29b-41d4-a716-446655440003', '0x2222222222222222222222222222222222222222', 6, 1, TRUE, 6),
('660e8400-e29b-41d4-a716-446655440003', '0x3333333333333333333333333333333333333333', 7, 1, TRUE, 7),
('660e8400-e29b-41d4-a716-446655440003', '0x4444444444444444444444444444444444444444', 8, 1, TRUE, 8);

-- Insert some sample game logs
INSERT INTO game_logs (match_id, tick, event_type, event_data, timestamp) VALUES
('550e8400-e29b-41d4-a716-446655440020', 0, 'match_start', '{"players": ["0x1111111111111111111111111111111111111111", "0x2222222222222222222222222222222222222222"]}', NOW() - INTERVAL '1 hour'),
('550e8400-e29b-41d4-a716-446655440020', 120, 'player_kill', '{"killer": "0x1111111111111111111111111111111111111111", "victim": "0x2222222222222222222222222222222222222222", "weapon": "projectile"}', NOW() - INTERVAL '59 minutes'),
('550e8400-e29b-41d4-a716-446655440020', 300, 'player_kill', '{"killer": "0x2222222222222222222222222222222222222222", "victim": "0x1111111111111111111111111111111111111111", "weapon": "projectile"}', NOW() - INTERVAL '58 minutes 30 seconds'),
('550e8400-e29b-41d4-a716-446655440020', 480, 'player_kill', '{"killer": "0x1111111111111111111111111111111111111111", "victim": "0x2222222222222222222222222222222222222222", "weapon": "projectile"}', NOW() - INTERVAL '58 minutes'),
('550e8400-e29b-41d4-a716-446655440020', 1080, 'match_end', '{"winner": "0x1111111111111111111111111111111111111111", "final_scores": {"0x1111111111111111111111111111111111111111": 5, "0x2222222222222222222222222222222222222222": 3}}', NOW() - INTERVAL '57 minutes');

COMMIT;
