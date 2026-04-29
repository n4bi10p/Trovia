import { Request, Response } from 'express';
import { ask } from '../lib/gemini';
import { getSOLPrice } from '../lib/solana';
import { insertExecutionLog } from '../lib/supabase';

/**
 * BHUMI — Trading Agent Handler
 *
 * POST /api/agents/trading
 * Body: {
 *   agentId: string,
 *   userConfig: {
 *     walletAddress: string,
 *     tokenPair: string,       // e.g. "SOL/USDC"
 *     thresholdPrice: number,  // USD price to trigger alert
 *     action: "alert" | "simulate_swap"
 *   }
 * }
 *
 * Returns: {
 *   currentPrice: number,
 *   thresholdPrice: number,
 *   thresholdHit: boolean,
 *   analysis: string,         // Gemini market analysis (only if threshold hit)
 *   simulatedAction?: string  // What a swap would look like
 * }
 */
export async function trading(req: Request, res: Response): Promise<void> {
  const { agentId, userConfig } = req.body as {
    agentId: string;
    userConfig: {
      walletAddress: string;
      tokenPair: string;
      thresholdPrice: number;
      action: string;
    };
  };

  // TODO (BHUMI): Implement trading agent logic
  // 1. Fetch current SOL price using getSOLPrice() from lib/solana.ts
  // 2. Compare to userConfig.thresholdPrice
  // 3. If threshold hit, call ask() with a market analysis prompt
  // 4. Call insertExecutionLog() to log the execution to Supabase
  // 5. Return the result as JSON

  // EXAMPLE STRUCTURE (replace with real implementation):
  const currentPrice = await getSOLPrice();
  const thresholdHit = currentPrice <= userConfig.thresholdPrice;

  let analysis = '';
  if (thresholdHit) {
    analysis = await ask(
      `SOL is currently at $${currentPrice}. The user set a buy alert at $${userConfig.thresholdPrice} for ${userConfig.tokenPair}. ` +
      `Generate a concise 3-sentence market analysis and recommended action for a crypto trader.`
    );
  }

  await insertExecutionLog({
    agent_id: agentId,
    buyer_wallet: userConfig.walletAddress,
    action: 'price_check',
    result: { currentPrice, thresholdHit, tokenPair: userConfig.tokenPair },
  });

  res.json({ currentPrice, thresholdPrice: userConfig.thresholdPrice, thresholdHit, analysis });
}
