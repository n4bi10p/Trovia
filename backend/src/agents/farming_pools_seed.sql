-- BHUMI — Farming pools seed data for Supabase
-- Run this in the Supabase SQL Editor after Nabil creates the project
-- This seeds realistic APY data since Raydium/Orca have no real liquidity on Devnet

CREATE TABLE IF NOT EXISTS farming_pools (
  agent_id   TEXT PRIMARY KEY,   -- used as the pool lookup key
  pool_name  TEXT NOT NULL,
  apy        NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO farming_pools (agent_id, pool_name, apy) VALUES
  ('raydium_sol_usdc',  'SOL-USDC (Raydium Simulated)',         14.2),
  ('raydium_sol_usdt',  'SOL-USDT (Raydium Simulated)',         11.8),
  ('orca_sol_usdc',     'SOL-USDC (Orca Whirlpool Simulated)',  18.5),
  ('orca_bonk_sol',     'BONK-SOL (Orca Simulated)',            47.3),
  ('marinade_msol',     'mSOL Liquid Staking (Marinade Simulated)', 7.1),
  ('default',           'SOL-USDC (Raydium Simulated)',         14.2)
ON CONFLICT (agent_id) DO UPDATE SET apy = EXCLUDED.apy, updated_at = NOW();
