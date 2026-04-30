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
 *   simulatedAction?: string  // What a swap would look like (if action === "simulate_swap")
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

  if (!userConfig?.walletAddress || userConfig?.thresholdPrice === undefined) {
    res.status(400).json({ error: 'userConfig.walletAddress and userConfig.thresholdPrice are required' });
    return;
  }

  const tokenPair = userConfig.tokenPair || 'SOL/USDC';
  const action = userConfig.action || 'alert';

  // 1. Fetch current SOL price (cached 60s)
  let currentPrice: number;
  try {
    currentPrice = await getSOLPrice();
  } catch {
    currentPrice = 150; // safe fallback for demo if CoinGecko is down
    console.warn('[Trading Agent] CoinGecko unavailable, using fallback price $150');
  }

  const thresholdHit = currentPrice <= userConfig.thresholdPrice;

  let analysis = '';
  let simulatedAction: string | undefined;

  if (thresholdHit) {
    // 2. Run Gemini analysis when threshold is breached
    const direction = currentPrice < userConfig.thresholdPrice ? 'below' : 'at';
    const prompt = `You are a concise crypto trading analyst. SOL/${tokenPair.split('/')[1] ?? 'USDC'} is currently trading at $${currentPrice.toFixed(2)} USD.

The user had set a price alert at $${userConfig.thresholdPrice} USD — the price is now ${direction} that threshold.

Write a 3-sentence market analysis covering:
1. What the current price level means technically
2. Potential short-term outlook
3. A recommended action for a trader at this price level

Be specific, data-driven, and concise. No disclaimers. No generic advice.`;

    try {
      analysis = await ask(prompt);
      if (!analysis || analysis.trim().length === 0) {
        throw new Error('Empty analysis from Gemini');
      }
    } catch (err) {
      console.error('[Trading Agent] Gemini analysis failed:', err instanceof Error ? err.message : err);
      analysis = `SOL is trading at $${currentPrice.toFixed(2)}, ${direction} your alert threshold of $${userConfig.thresholdPrice}. This price level may represent a key support/resistance zone worth watching. Consider reviewing your position sizing and risk parameters before acting.`;
    }

    // 3. Simulate swap if requested
    if (action === 'simulate_swap') {
      simulatedAction = `[SIMULATED — Devnet] Swap 1 SOL → ${(currentPrice * 0.997).toFixed(2)} USDC at market price $${currentPrice.toFixed(2)} (0.3% DEX fee estimated). No real funds moved.`;
    }
  }

  // 4. Log to Supabase
  await insertExecutionLog({
    agent_id: agentId,
    buyer_wallet: userConfig.walletAddress,
    action: 'price_check',
    result: {
      currentPrice,
      thresholdPrice: userConfig.thresholdPrice,
      thresholdHit,
      tokenPair,
      action,
    },
  });

  res.json({
    currentPrice,
    thresholdPrice: userConfig.thresholdPrice,
    thresholdHit,
    analysis,
    ...(simulatedAction ? { simulatedAction } : {}),
  });
}
