import { Request, Response } from 'express';
import { ask } from '../lib/gemini';
import { supabase, insertExecutionLog } from '../lib/supabase';

/**
 * BHUMI — Content Reply Agent Handler
 *
 * POST /api/agents/content
 * Body: {
 *   agentId: string,
 *   userConfig: {
 *     walletAddress: string,
 *     message: string,   // the tweet/email/DM to reply to
 *     tone: "Professional" | "Casual" | "Witty"
 *   }
 * }
 *
 * Returns: {
 *   replies: Array<{ reply: string }>   // exactly 3 replies
 * }
 *
 * IMPORTANT: Must return exactly 3 reply options, always. Never return 2 or 4.
 */
export async function content(req: Request, res: Response): Promise<void> {
  const { agentId, userConfig } = req.body as {
    agentId: string;
    userConfig: { walletAddress: string; message: string; tone: string };
  };

  // TODO (BHUMI): Implement the content reply agent
  // 1. Build a prompt asking Gemini for 3 reply options
  // 2. Parse the JSON response — handle malformed JSON gracefully
  // 3. Log to Supabase
  // 4. Return { replies: [...] }

  const prompt = `Generate exactly 3 reply options for the following message.
Message: "${userConfig.message}"
Tone: ${userConfig.tone}
Return ONLY a valid JSON array with no extra text, in this exact format:
[{"reply": "..."}, {"reply": "..."}, {"reply": "..."}]`;

  // TODO (BHUMI): call ask() or askJSON() and parse result
  // Placeholder response:
  res.json({ replies: [{ reply: 'TODO: Implement content agent' }] });
}
