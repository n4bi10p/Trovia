import { Router, Request, Response } from 'express';
import { trading } from '../agents/trading';
import { farming } from '../agents/farming';
import { scheduling } from '../agents/scheduling';
import { rebalancing } from '../agents/rebalancing';
import { content } from '../agents/content';
import { business } from '../agents/business';

export const agentRoutes = Router();

// ── Helper: wrap every agent handler in try/catch ─────────────────────────────
function handle(fn: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Agent Error]', message);
      res.status(500).json({ error: message });
    }
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────
// POST /api/agents/trading
// Body: { agentId: string, userConfig: { tokenPair, thresholdPrice, action, walletAddress } }
agentRoutes.post('/trading', handle(trading));

// POST /api/agents/farming
// Body: { agentId: string, userConfig: { poolAddress, compoundThreshold, walletAddress } }
agentRoutes.post('/farming', handle(farming));

// POST /api/agents/scheduling
// Body: { agentId: string, userConfig: { recipientAddress, amountSOL, frequency, startDate, walletAddress } }
agentRoutes.post('/scheduling', handle(scheduling));

// POST /api/agents/rebalancing
// Body: { agentId: string, userConfig: { targetAllocation, driftTolerance, walletAddress } }
agentRoutes.post('/rebalancing', handle(rebalancing));

// POST /api/agents/content
// Body: { agentId: string, userConfig: { message, tone, walletAddress } }
agentRoutes.post('/content', handle(content));

// POST /api/agents/business
// Body: { agentId: string, userConfig: { businessContext, query, walletAddress } }
agentRoutes.post('/business', handle(business));

// GET /api/agents/logs?wallet=...
agentRoutes.get('/logs', handle(async (req, res) => {
  const { getExecutionLogs } = await import('../lib/supabase');
  const wallet = req.query.wallet as string;
  if (!wallet) { res.status(400).json({ error: 'wallet query param required' }); return; }
  const logs = await getExecutionLogs(wallet);
  res.json({ logs });
}));
