import { Request, Response } from 'express';
import { ask } from '../lib/gemini';
import { insertExecutionLog } from '../lib/supabase';
import { connection, getSOLBalance } from '../lib/solana';
import { PublicKey } from '@solana/web3.js';

/**
 * BHUMI — Rebalancing Agent Handler
 *
 * POST /api/agents/rebalancing
 * Body: {
 *   agentId: string,
 *   userConfig: {
 *     walletAddress: string,
 *     targetAllocation: { SOL: 60, USDC: 40 },   // percentages, must sum to 100
 *     driftTolerance: number                       // e.g. 5 = ±5% before triggering
 *   }
 * }
 *
 * Returns: { currentAllocation, targetAllocation, driftDetected, recommendation }
 *
 * Uses @solana/web3.js to fetch token accounts for the wallet.
 * Computes drift vs targetAllocation.
 * Uses ask() to generate a plain-English rebalance recommendation.
 */

// SPL token mint addresses on Devnet (standard test tokens)
const DEVNET_USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // mainnet USDC (devnet uses wrapped)
const DEVNET_USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'; // mainnet USDT

interface TokenBalance {
  symbol: string;
  mint: string;
  uiAmount: number;
  usdValue: number;
}

/**
 * Fetch SPL token balances for a wallet on Devnet.
 * Falls back gracefully — devnet wallets often have no real token accounts.
 */
async function getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
  const pubkey = new PublicKey(walletAddress);

  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });

    const balances: TokenBalance[] = [];

    for (const account of tokenAccounts.value) {
      const parsed = account.account.data.parsed?.info;
      if (!parsed) continue;

      const mint: string = parsed.mint;
      const uiAmount: number = parsed.tokenAmount?.uiAmount ?? 0;
      if (uiAmount <= 0) continue;

      // Map known mints to symbols (extendable)
      let symbol = 'UNKNOWN';
      if (mint === DEVNET_USDC_MINT) symbol = 'USDC';
      else if (mint === DEVNET_USDT_MINT) symbol = 'USDT';
      else symbol = `TOKEN_${mint.slice(0, 4)}`;

      // USD value: stablecoins 1:1, others approximated
      const usdValue = symbol === 'USDC' || symbol === 'USDT' ? uiAmount : uiAmount;

      balances.push({ symbol, mint, uiAmount, usdValue });
    }

    return balances;
  } catch (err) {
    console.warn('[Rebalancing Agent] Failed to fetch token accounts:', err instanceof Error ? err.message : err);
    return [];
  }
}

export async function rebalancing(req: Request, res: Response): Promise<void> {
  const { agentId, userConfig } = req.body as {
    agentId: string;
    userConfig: {
      walletAddress: string;
      targetAllocation: Record<string, number>;
      driftTolerance: number;
    };
  };

  if (!userConfig?.walletAddress) {
    res.status(400).json({ error: 'userConfig.walletAddress is required' });
    return;
  }

  const targetAllocation: Record<string, number> = userConfig.targetAllocation ?? { SOL: 60, USDC: 40 };
  const driftTolerance = userConfig.driftTolerance ?? 5;

  // 1. Fetch SOL balance
  let solBalance = 0;
  try {
    solBalance = await getSOLBalance(userConfig.walletAddress);
  } catch (err) {
    console.warn('[Rebalancing Agent] Failed to fetch SOL balance:', err instanceof Error ? err.message : err);
  }

  // 2. Fetch SPL token balances
  const tokenBalances = await getTokenBalances(userConfig.walletAddress);

  // 3. Get SOL price for USD calculations
  let solPriceUSD = 150;
  try {
    const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const priceData = await priceRes.json() as { solana: { usd: number } };
    solPriceUSD = priceData.solana.usd;
  } catch {
    console.warn('[Rebalancing Agent] CoinGecko unavailable, using fallback SOL price $150');
  }

  // 4. Build current allocation in USD terms
  const portfolioUSD: Record<string, number> = {
    SOL: solBalance * solPriceUSD,
  };

  for (const token of tokenBalances) {
    if (portfolioUSD[token.symbol]) {
      portfolioUSD[token.symbol] += token.usdValue;
    } else {
      portfolioUSD[token.symbol] = token.usdValue;
    }
  }

  // If devnet wallet has nothing useful, seed realistic demo values
  const totalUSD = Object.values(portfolioUSD).reduce((a, b) => a + b, 0);
  let currentAllocation: Record<string, number>;
  let isDemoData = false;

  if (totalUSD < 0.001) {
    // Demo/devnet fallback: synthesize a realistic allocation to demonstrate the feature
    isDemoData = true;
    const demoSOLBalance = 2.5;
    const demoSOLUSD = demoSOLBalance * solPriceUSD;
    const demoUSDCBalance = 80;
    const demoTotal = demoSOLUSD + demoUSDCBalance;

    currentAllocation = {
      SOL: Math.round((demoSOLUSD / demoTotal) * 100),
      USDC: Math.round((demoUSDCBalance / demoTotal) * 100),
    };
  } else {
    currentAllocation = {};
    for (const [symbol, usd] of Object.entries(portfolioUSD)) {
      currentAllocation[symbol] = Math.round((usd / totalUSD) * 100);
    }
  }

  // 5. Detect drift for each target asset
  let driftDetected = false;
  const driftDetails: Array<{ asset: string; current: number; target: number; drift: number }> = [];

  for (const [asset, targetPct] of Object.entries(targetAllocation)) {
    const currentPct = currentAllocation[asset] ?? 0;
    const drift = Math.abs(currentPct - targetPct);
    driftDetails.push({ asset, current: currentPct, target: targetPct, drift });
    if (drift > driftTolerance) driftDetected = true;
  }

  // 6. Ask Gemini for rebalance recommendation
  const driftSummary = driftDetails
    .map((d) => `${d.asset}: current ${d.current}% vs target ${d.target}% (drift ${d.drift.toFixed(1)}%)`)
    .join(', ');

  const prompt = `You are a Solana DeFi portfolio advisor. A user's portfolio has drifted from their target allocation.
${isDemoData ? 'NOTE: This is a SIMULATION using demo data because the user wallet is currently empty.' : ''}

Target allocation: ${JSON.stringify(targetAllocation)}
Current allocation: ${JSON.stringify(currentAllocation)}
Drift tolerance: ±${driftTolerance}%
Drift details: ${driftSummary}
Drift detected: ${driftDetected ? 'Yes' : 'No — within tolerance'}

${driftDetected
      ? 'Write a 3-sentence rebalancing recommendation: what to sell, what to buy, and why this matters for portfolio health.'
      : 'Write 2 sentences confirming the portfolio is balanced and what the user should monitor next.'
    }

Be specific with token names and percentages. No generic advice. No disclaimers.`;

  let recommendation: string;

  try {
    recommendation = await ask(prompt);
    if (!recommendation || recommendation.trim().length === 0) {
      throw new Error('Empty recommendation from Gemini');
    }
  } catch (err) {
    console.error('[Rebalancing Agent] Gemini failed, using fallback:', err instanceof Error ? err.message : err);
    if (driftDetected) {
      const overweightAssets = driftDetails.filter((d) => (currentAllocation[d.asset] ?? 0) > d.target);
      const underweightAssets = driftDetails.filter((d) => (currentAllocation[d.asset] ?? 0) < d.target);
      recommendation = `Your portfolio has drifted beyond the ±${driftTolerance}% tolerance. Consider selling some ${overweightAssets.map((d) => d.asset).join(', ')} and buying more ${underweightAssets.map((d) => d.asset).join(', ')} to restore your target allocation. Rebalancing now will reduce concentration risk and keep your strategy intact.`;
    } else {
      recommendation = `Your portfolio is within the ±${driftTolerance}% drift tolerance — no rebalancing needed at this time. Continue monitoring and re-run this agent periodically to catch future drift early.`;
    }
  }

  // Add demo prefix to recommendation if needed
  if (isDemoData) {
    recommendation = `[DEMO MODE] ${recommendation}`;
  }

  // 7. Log to Supabase
  await insertExecutionLog({
    agent_id: agentId,
    buyer_wallet: userConfig.walletAddress,
    action: 'rebalance_check',
    result: {
      currentAllocation,
      targetAllocation,
      driftDetected,
      driftTolerance,
      driftDetails,
      isDemoData,
    },
  });

  res.json({
    currentAllocation,
    targetAllocation,
    driftDetected,
    driftTolerance,
    driftDetails,
    recommendation,
    isDemoData,
  });
}
