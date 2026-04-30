import { Router, Request, Response } from 'express';
import { askJSON } from '../lib/gemini';

export const voiceRoutes = Router();

function handle(fn: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Voice Error]', message);
      res.status(500).json({ error: message });
    }
  };
}

interface VoiceIntent {
  action: 'launch' | 'stop' | 'status' | 'balance' | 'browse' | 'help' | 'unknown';
  agentId: string | null;
  agentType: 'trading' | 'farming' | 'scheduling' | 'rebalancing' | 'content' | 'business' | null;
  amount: number | null;
  currency: 'SOL' | null;
}

// ── POST /api/voice/transcribe ────────────────────────────────────────────────
// Receives audio from the frontend or API Tester. 
// 1. If 'transcript' is provided (from Puter.js), it's a pass-through.
// 2. If 'audio' is provided, it uses Gemini Flash to transcribe (fallback).
voiceRoutes.post('/transcribe', handle(async (req, res) => {
  const { transcript, audio, mimeType = 'audio/webm' } = req.body;

  // Option A: Pass-through for client-side transcription (Puter.js)
  if (transcript && typeof transcript === 'string') {
    return res.json({ transcript, source: 'puter-client' });
  }

  // Option B: Server-side fallback via Gemini Flash
  if (audio) {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey.includes('your_')) {
      return res.json({ transcript: 'launch trading agent with 0.5 SOL', source: 'mock' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: audio } },
              { text: 'Transcribe the speech in this audio clip. Return ONLY the transcript text.' }
            ]
          }]
        })
      }
    );

    if (!response.ok) throw new Error(`Gemini transcription error: ${response.status}`);
    const data = await response.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    return res.json({ transcript: text, source: 'gemini-fallback' });
  }

  res.status(400).json({ error: 'Provide either transcript or audio.' });
}));

// ── POST /api/voice/parse ─────────────────────────────────────────────────────
voiceRoutes.post('/parse', handle(async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: 'transcript is required' });

  const prompt = `You are a Trovia agent command parser. Extract structured intent from: "${transcript}"
  Return ONLY valid JSON:
  {
    "action": "launch" | "stop" | "status" | "balance" | "browse" | "help" | "unknown",
    "agentId": string | null,
    "agentType": "trading" | "farming" | "scheduling" | "rebalancing" | "content" | "business" | null,
    "amount": number | null,
    "currency": "SOL" | null
  }`;

  let intent: VoiceIntent;
  try {
    intent = await askJSON<VoiceIntent>(prompt);
  } catch {
    intent = { action: 'unknown', agentId: null, agentType: null, amount: null, currency: null };
  }

  // Formatting helper to make things sound natural
  const formatType = (t: string | null) => t ? t.charAt(0).toUpperCase() + t.slice(1) + ' Agent' : 'Agent';

  const confirmMap: Record<string, string> = {
    launch: `Launch ${formatType(intent.agentType)}${intent.amount ? ` with ${intent.amount} ${intent.currency || 'SOL'}` : ''} — confirm?`,
    stop: `Stop ${intent.agentId || formatType(intent.agentType)} — confirm?`,
    status: `Check status of ${intent.agentId || formatType(intent.agentType)}`,
    balance: 'Check your SOL wallet balance',
    browse: 'Open the Trovia marketplace',
    help: 'Show available voice commands',
    unknown: "I didn't catch that — try 'launch trading agent' or 'show balance'",
  };

  res.json({
    transcript,
    intent,
    confirmationMessage: confirmMap[intent.action],
    requiresConfirmation: ['launch', 'stop'].includes(intent.action),
  });
}));
