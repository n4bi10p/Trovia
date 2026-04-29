import { Request, Response } from 'express';
import { createScheduledJob, insertExecutionLog } from '../lib/supabase';
import { PublicKey } from '@solana/web3.js';

/**
 * BHUMI — Scheduling Agent Handler
 *
 * POST /api/agents/scheduling
 * Body: {
 *   agentId: string,
 *   userConfig: {
 *     walletAddress: string,
 *     recipientAddress: string,
 *     amountSOL: number,
 *     frequency: "daily" | "weekly" | "monthly",
 *     startDate: string  // ISO date string
 *   }
 * }
 *
 * Returns: { jobId, recipientAddress, amountSOL, frequency, nextRunAt }
 */
export async function scheduling(req: Request, res: Response): Promise<void> {
  const { agentId, userConfig } = req.body as {
    agentId: string;
    userConfig: {
      walletAddress: string;
      recipientAddress: string;
      amountSOL: number;
      frequency: 'daily' | 'weekly' | 'monthly';
      startDate: string;
    };
  };

  // Validate recipient address
  try {
    new PublicKey(userConfig.recipientAddress);
  } catch {
    res.status(400).json({ error: 'Invalid recipient Solana address' });
    return;
  }

  const amountLamports = Math.floor(userConfig.amountSOL * 1_000_000_000);
  const nextRunAt = new Date(userConfig.startDate);

  const job = await createScheduledJob({
    agent_id: agentId,
    buyer_wallet: userConfig.walletAddress,
    recipient_address: userConfig.recipientAddress,
    amount_lamports: amountLamports,
    frequency: userConfig.frequency,
    next_run_at: nextRunAt.toISOString(),
  });

  await insertExecutionLog({
    agent_id: agentId,
    buyer_wallet: userConfig.walletAddress,
    action: 'job_created',
    result: { jobId: job.id, frequency: userConfig.frequency, nextRunAt: nextRunAt.toISOString() },
  });

  res.json({
    jobId: job.id,
    recipientAddress: userConfig.recipientAddress,
    amountSOL: userConfig.amountSOL,
    frequency: userConfig.frequency,
    nextRunAt: nextRunAt.toISOString(),
  });
}
