import { Request, Response } from 'express';
import { insertExecutionLog } from '../lib/supabase';
import { ask } from '../lib/gemini';

/**
 * BHUMI — Farming Agent Handler
 * TODO: Implement farming agent logic
 *
 * POST /api/agents/farming
 * Body: { agentId, userConfig: { walletAddress, poolAddress, compoundThreshold } }
 * Returns: { currentAPY, shouldCompound, recommendation }
 *
 * Note: Raydium/Orca have no real liquidity on Devnet.
 * Use Supabase-seeded APY values. Label output as "Simulated on Devnet".
 */
export async function farming(req: Request, res: Response): Promise<void> {
  // TODO (BHUMI): Implement
  res.json({ currentAPY: 12.4, shouldCompound: true, recommendation: 'TODO: Implement farming agent', note: 'Simulated on Devnet' });
}
