import { Request, Response } from 'express';
import { askJSON } from '../lib/gemini';
import { insertExecutionLog } from '../lib/supabase';

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

const FALLBACK_REPLIES: Record<string, Array<{ reply: string }>> = {
  Professional: [
    { reply: 'Thank you for sharing this. I appreciate the insight and will take it into consideration.' },
    { reply: 'This is a valuable perspective. I look forward to exploring this further with you.' },
    { reply: 'Well noted. I would be happy to connect and discuss this in more detail.' },
  ],
  Casual: [
    { reply: 'Hey, totally get where you\'re coming from! Let\'s chat more about this 😊' },
    { reply: 'Wow, this is super interesting! Thanks for putting it out there.' },
    { reply: 'Love this! Would be cool to talk more about it sometime.' },
  ],
  Witty: [
    { reply: 'Bold move, I respect it. Here\'s my equally bold take: agreed.' },
    { reply: 'Well, that\'s one way to start a Monday. Absolutely here for it.' },
    { reply: 'I didn\'t have this on my bingo card but honestly? Valid point.' },
  ],
};

export async function content(req: Request, res: Response): Promise<void> {
  const { agentId, userConfig } = req.body as {
    agentId: string;
    userConfig: { walletAddress: string; message: string; tone: string };
  };

  if (!userConfig?.message || !userConfig?.walletAddress) {
    res.status(400).json({ error: 'userConfig.message and userConfig.walletAddress are required' });
    return;
  }

  const tone = userConfig.tone || 'Professional';

  const prompt = `You are a social media assistant. Generate exactly 3 distinct reply options for the following message.

Message to reply to: "${userConfig.message}"
Tone: ${tone}

Rules:
- Each reply must sound natural and human-written
- Replies must be short (1-3 sentences max)
- Replies must match the specified tone exactly
- Do NOT include numbering, bullet points, or extra explanation
- Return ONLY a valid JSON array with no markdown, no code fences, no extra text

Return format (strict JSON only):
[{"reply": "..."}, {"reply": "..."}, {"reply": "..."}]`;

  let replies: Array<{ reply: string }>;

  try {
    const parsed = await askJSON<Array<{ reply: string }>>(prompt);

    // Validate structure and enforce exactly 3
    if (Array.isArray(parsed) && parsed.length >= 3) {
      replies = parsed.slice(0, 3).map((item) => ({
        reply: typeof item.reply === 'string' ? item.reply : String(item),
      }));
    } else if (Array.isArray(parsed) && parsed.length > 0) {
      // Pad to 3 if Gemini returned fewer
      replies = [...parsed];
      const fallbacks = FALLBACK_REPLIES[tone] ?? FALLBACK_REPLIES['Professional'];
      while (replies.length < 3) {
        replies.push(fallbacks[replies.length]);
      }
    } else {
      throw new Error('Invalid reply structure from Gemini');
    }
  } catch (err) {
    console.error('[Content Agent] Gemini failed, using fallbacks:', err instanceof Error ? err.message : err);
    replies = FALLBACK_REPLIES[tone] ?? FALLBACK_REPLIES['Professional'];
  }

  // Log to Supabase (non-fatal)
  await insertExecutionLog({
    agent_id: agentId,
    buyer_wallet: userConfig.walletAddress,
    action: 'content_reply',
    result: { tone, messagePreview: userConfig.message.slice(0, 100), repliesGenerated: replies.length },
  });

  res.json({ replies });
}
