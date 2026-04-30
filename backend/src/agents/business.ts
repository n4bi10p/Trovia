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
 * The response has clearly labeled sections: Answer, Key Points, Recommended Next Step.
 */
export async function business(req: Request, res: Response): Promise<void> {
  const { agentId, userConfig } = req.body as {
    agentId: string;
    userConfig: { walletAddress: string; businessContext: string; query: string };
  };

  if (!userConfig?.query || !userConfig?.walletAddress) {
    res.status(400).json({ error: 'userConfig.query and userConfig.walletAddress are required' });
    return;
  }

  const businessContext = userConfig.businessContext || 'a general business';

  const prompt = `You are an expert business consultant and assistant for the following business: ${businessContext}

The user has asked: "${userConfig.query}"

Respond with a clear, concise, and actionable answer formatted in exactly these labeled sections:

**Answer:**
[Direct 2-3 sentence answer to the question]

**Key Points:**
• [First key insight or recommendation]
• [Second key insight or recommendation]
• [Third key insight or recommendation]

**Recommended Next Step:**
[One concrete, specific action the user should take today]

Keep the entire response under 350 words. Be practical, not generic. Tailor your advice specifically to the business context provided.`;

  let response: string;

  try {
    response = await ask(prompt);
    // Ensure we got a non-empty response
    if (!response || response.trim().length === 0) {
      throw new Error('Empty response from Gemini');
    }
  } catch (err) {
    console.error('[Business Agent] Gemini failed, using fallback:', err instanceof Error ? err.message : err);
    response = `**Answer:**
I'm unable to provide a tailored response at this moment. Please try again shortly.

**Key Points:**
• Review your core business metrics before making any strategic decisions
• Consult with a domain expert relevant to your query
• Document your current state before implementing changes

**Recommended Next Step:**
Retry your question in a moment, or rephrase it with more specific details about your challenge.`;
  }

  // Log to Supabase (non-fatal)
  await insertExecutionLog({
    agent_id: agentId,
    buyer_wallet: userConfig.walletAddress,
    action: 'business_query',
    result: {
      businessContext: businessContext.slice(0, 100),
      queryPreview: userConfig.query.slice(0, 100),
    },
  });

  res.json({ response });
}
