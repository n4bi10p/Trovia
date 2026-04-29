import { Request, Response } from 'express';
import { ask } from '../lib/gemini';
import { insertExecutionLog } from '../lib/supabase';

/**
 * BHUMI — Business Assistant Agent Handler
 *
 * POST /api/agents/business
 * Body: {
 *   agentId: string,
 *   userConfig: {
 *     walletAddress: string,
 *     businessContext: string,  // "I run a SaaS for small restaurants"
 *     query: string             // "How should I price my product?"
 *   }
 * }
 *
 * Returns: { response: string }
 * The response should have clear sections: Answer, Key Points, Next Step.
 */
export async function business(req: Request, res: Response): Promise<void> {
  const { agentId, userConfig } = req.body as {
    agentId: string;
    userConfig: { walletAddress: string; businessContext: string; query: string };
  };

  // TODO (BHUMI): Implement business assistant
  // Prompt structure:
  // "You are a business assistant for: {businessContext}
  //  User asks: {query}
  //  Respond with clearly labeled sections: Answer, Key Points (3 bullets), Recommended Next Step."

  res.json({ response: 'TODO: Implement business agent' });
}
