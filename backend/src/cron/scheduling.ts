import { Router, Request, Response } from 'express';
import { getDueJobs, updateJobAfterRun, insertExecutionLog } from '../lib/supabase';
import { getSchedulerKeypair, transferSOL, explorerUrl, solToLamports } from '../lib/solana';

export const cronRoutes = Router();

/**
 * POST /api/cron/scheduling
 *
 * Called by Google Cloud Scheduler every hour.
 * Header: x-cron-secret must match CRON_SECRET env var.
 *
 * Process:
 * 1. Verify cron secret header
 * 2. Fetch due scheduled jobs from Supabase
 * 3. For each job: transfer SOL, update job, log execution
 * 4. Return summary
 *
 * BHUMI: Fill in the logic below. Nabil has provided all helpers.
 */
cronRoutes.post('/scheduling', async (req: Request, res: Response) => {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret = req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const results: Array<{ jobId: string; status: string; txHash?: string; error?: string }> = [];

  try {
    // ── Fetch due jobs ────────────────────────────────────────────────────
    const dueJobs = await getDueJobs();
    console.log(`[Cron] Processing ${dueJobs.length} due jobs`);

    const schedulerKeypair = getSchedulerKeypair();

    for (const job of dueJobs) {
      try {
        // ── Transfer SOL ────────────────────────────────────────────────
        const txHash = await transferSOL(
          schedulerKeypair,
          job.recipient_address,
          job.amount_lamports
        );

        // ── Calculate next run ──────────────────────────────────────────
        const nextRunAt = getNextRunDate(job.frequency);
        await updateJobAfterRun(job.id, txHash, nextRunAt);

        // ── Log execution ───────────────────────────────────────────────
        await insertExecutionLog({
          agent_id: job.agent_id,
          buyer_wallet: job.buyer_wallet,
          action: 'scheduled_payment',
          result: {
            recipient: job.recipient_address,
            amountLamports: job.amount_lamports,
            txHash,
            explorerUrl: explorerUrl(txHash),
          },
          tx_hash: txHash,
        });

        results.push({ jobId: job.id, status: 'success', txHash });
        console.log(`[Cron] Job ${job.id} done → tx: ${txHash}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ jobId: job.id, status: 'error', error: message });
        console.error(`[Cron] Job ${job.id} failed:`, message);
      }
    }

    res.json({ processed: dueJobs.length, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Cron] Fatal error:', message);
    res.status(500).json({ error: message });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNextRunDate(frequency: string): Date {
  const now = new Date();
  switch (frequency) {
    case 'daily':   now.setDate(now.getDate() + 1); break;
    case 'weekly':  now.setDate(now.getDate() + 7); break;
    case 'monthly': now.setMonth(now.getMonth() + 1); break;
    default:        now.setDate(now.getDate() + 1); // default daily
  }
  return now;
}
