import { Request, Response } from 'express';
import { ask } from '../lib/gemini';
import { insertExecutionLog, supabase } from '../lib/supabase';

/**
 * BHUMI — Farming Agent Handler
 *
 * POST /api/agents/farming
 * Body: {
 *   agentId: string,
 *   userConfig: {
 *     walletAddress: string,
 *     poolAddress: string,         // the LP pool address/name to monitor
 *     compoundThreshold: number    // APY % above which to compound (e.g. 15.0)
 *   }
 * }
 *
 * Returns: { currentAPY, shouldCompound, recommendation, note }
 *
 * NOTE: Raydium/Orca have no real liquidity on Devnet.
 * APY values are seeded in Supabase farming_pools table.
 * All output is labeled "Simulated on Devnet".
 */

// Hardcoded pool seeds as fallback if Supabase farming_pools table isn't set up yet
const FALLBACK_POOLS: Record<string, { apy: number; pool_name: string }> = {
  default:             { apy: 14.2,  pool_name: 'SOL-USDC (Raydium Simulated)' },
  raydium_sol_usdc:    { apy: 14.2,  pool_name: 'SOL-USDC (Raydium Simulated)' },
  raydium_sol_usdt:    { apy: 11.8,  pool_name: 'SOL-USDT (Raydium Simulated)' },
  orca_sol_usdc:       { apy: 18.5,  pool_name: 'SOL-USDC (Orca Whirlpool Simulated)' },
  orca_bonk_sol:       { apy: 47.3,  pool_name: 'BONK-SOL (Orca Simulated)' },
  marinade_msol:       { apy: 7.1,   pool_name: 'mSOL Liquid Staking (Marinade Simulated)' },
};

export async function farming(req: Request, res: Response): Promise<void> {
  const { agentId, userConfig } = req.body as {
    agentId: string;
    userConfig: {
      walletAddress: string;
      poolAddress: string;
      compoundThreshold: number;
    };
  };

  if (!userConfig?.walletAddress) {
    res.status(400).json({ error: 'userConfig.walletAddress is required' });
    return;
  }

  const poolAddress = (userConfig.poolAddress || 'default').toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const compoundThreshold = userConfig.compoundThreshold ?? 12.0;

  // 1. Try to fetch APY from Supabase farming_pools table first
  let currentAPY: number;
  let poolName: string;

  try {
    const { data, error } = await supabase
      .from('farming_pools')
      .select('apy, pool_name')
      .eq('agent_id', poolAddress)
      .single();

    if (data && !error) {
      currentAPY = data.apy;
      poolName = data.pool_name;
    } else {
      // Fall back to hardcoded seed data
      const fallback = FALLBACK_POOLS[poolAddress] ?? FALLBACK_POOLS['default'];
      currentAPY = fallback.apy;
      poolName = fallback.pool_name;
    }
  } catch {
    const fallback = FALLBACK_POOLS[poolAddress] ?? FALLBACK_POOLS['default'];
    currentAPY = fallback.apy;
    poolName = fallback.pool_name;
  }

  const shouldCompound = currentAPY >= compoundThreshold;

  // 2. Ask Gemini for a recommendation
  const prompt = `You are a DeFi yield farming advisor. A user is monitoring a liquidity pool called "${poolName}" on Solana (simulated Devnet environment).

Current APY: ${currentAPY.toFixed(2)}%
Compound threshold: ${compoundThreshold}%
Should compound: ${shouldCompound ? 'Yes — APY is above threshold' : 'No — APY is below threshold'}

In 2-3 concise sentences:
1. Explain what this APY means for the user's yield
2. Give a clear recommendation on whether to compound or wait
3. Mention one risk to be aware of

Be specific and actionable. No disclaimers. No generic DeFi platitudes.`;

  let recommendation: string;

  try {
    recommendation = await ask(prompt);
    if (!recommendation || recommendation.trim().length === 0) {
      throw new Error('Empty recommendation from Gemini');
    }
  } catch (err) {
    console.error('[Farming Agent] Gemini failed, using fallback:', err instanceof Error ? err.message : err);
    recommendation = shouldCompound
      ? `At ${currentAPY.toFixed(2)}% APY (above your ${compoundThreshold}% threshold), compounding now will maximize your yield. Re-investing your rewards accelerates growth through compounding interest. Watch out for impermanent loss if the token price ratio in this pool shifts significantly.`
      : `At ${currentAPY.toFixed(2)}% APY (below your ${compoundThreshold}% threshold), compounding is not yet recommended — gas/transaction costs may outweigh gains. Wait until APY rises above ${compoundThreshold}% before compounding. Consider whether this pool's risk-adjusted return still meets your investment goals.`;
  }

  // 3. Log to Supabase
  await insertExecutionLog({
    agent_id: agentId,
    buyer_wallet: userConfig.walletAddress,
    action: 'farming_check',
    result: {
      poolName,
      poolAddress,
      currentAPY,
      compoundThreshold,
      shouldCompound,
    },
  });

  res.json({
    currentAPY,
    poolName,
    shouldCompound,
    recommendation,
    note: 'Simulated on Devnet — APY values are seeded for demo purposes',
  });
}
